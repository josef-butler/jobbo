"""
Construction job scheduler using Google OR-Tools CP-SAT solver.

Reads data/input.json, models each construction stage as a task with
resource constraints (multiple crews per trade), solves for the
minimum-makespan schedule, and writes output to apps/web/public/output.json.

Usage:
    pip install -r requirements.txt
    python solver.py
"""

import json
import sys
from pathlib import Path

from ortools.sat.python import cp_model


# === Load input ===

DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_DIR = Path(__file__).parent.parent / "apps" / "web" / "public"

with open(DATA_DIR / "input.json") as f:
    data = json.load(f)

# Trades are objects: { name, crews }
trades = {t["name"]: t["crews"] for t in data["trades"]}
trade_names = list(trades.keys())
jobs = data["jobs"]

# === Build the CP-SAT model ===

model = cp_model.CpModel()

# A conservative horizon: sum of all stage durations.
horizon = sum(s["duration"] for j in jobs for s in j["stages"])

# For every stage, create variables and store them keyed by (job_id, stage_id).
Stage = dict  # type alias for readability

all_stages: dict[tuple[str, str], Stage] = {}

for job in jobs:
    for stage in job["stages"]:
        key = (job["id"], stage["id"])
        duration = stage["duration"]

        start = model.new_int_var(0, horizon, f"start_{key}")
        end = model.new_int_var(0, horizon, f"end_{key}")
        interval = model.new_interval_var(start, duration, end, f"int_{key}")

        all_stages[key] = {
            "job_id": job["id"],
            "job_name": job["name"],
            "stage_id": stage["id"],
            "trade": stage["trade"],
            "duration": duration,
            "start": start,
            "end": end,
            "interval": interval,
        }


# === Precedence constraints ===

for job in jobs:
    for i, stage in enumerate(job["stages"]):
        key = (job["id"], stage["id"])
        task = all_stages[key]

        if stage.get("depends_on"):
            for dep_id in stage["depends_on"]:
                dep_key = (job["id"], dep_id)
                dep_task = all_stages[dep_key]
                model.add(task["start"] >= dep_task["end"])
        elif i > 0:
            # No explicit depends_on: sequential by stage order.
            prev_key = (job["id"], job["stages"][i - 1]["id"])
            prev_task = all_stages[prev_key]
            model.add(task["start"] >= prev_task["end"])

        # Minimum delay between stages (e.g. concrete curing).
        if stage.get("min_delay"):
            for dep_id in stage.get("depends_on", []):
                dep_key = (job["id"], dep_id)
                dep_task = all_stages[dep_key]
                model.add(task["start"] >= dep_task["end"] + stage["min_delay"])

        # Locked stages (already in progress or committed).
        if stage.get("locked_start") is not None:
            model.add(task["start"] == stage["locked_start"])
        if stage.get("locked_end") is not None:
            model.add(task["end"] == stage["locked_end"])

# === Resource constraints: cumulative (N crews per trade) ===

for trade_name, crew_count in trades.items():
    intervals = [
        task["interval"]
        for task in all_stages.values()
        if task["trade"] == trade_name
    ]
    if intervals:
        demands = [1] * len(intervals)
        model.add_cumulative(intervals, demands, crew_count)

# === Objective: minimise makespan ===

makespan = model.new_int_var(0, horizon, "makespan")
for task in all_stages.values():
    model.add(task["end"] <= makespan)
model.minimize(makespan)

# === Solve ===

solver = cp_model.CpSolver()
solver.parameters.num_search_workers = 8
solver.parameters.max_time_in_seconds = 30
# solver.parameters.log_search_progress = True   # uncomment during development
status = solver.solve(model)

if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
    print("Solver did not find a solution.", file=sys.stderr)
    sys.exit(1)


# === Post-process: assign crew indices per trade ===

# For each trade, greedily assign crew numbers based on scheduled start times.
def assign_crews(tasks: list[dict]) -> dict[tuple, int]:
    """Assign crew indices greedily. Returns {(job_id, stage_id): crew_index}."""
    # Sort by start time.
    sorted_tasks = sorted(tasks, key=lambda t: solver.value(t["start"]))

    # Each crew's next available time, initially day 0.
    crew_available = [0] * trades.get(sorted_tasks[0]["trade"], 1) if sorted_tasks else []

    assignments = {}
    for task in sorted_tasks:
        task_start = solver.value(task["start"])
        # Find the first crew that is free at or before task_start.
        for crew_idx, avail in enumerate(crew_available):
            if avail <= task_start:
                crew_available[crew_idx] = solver.value(task["end"])
                assignments[(task["job_id"], task["stage_id"])] = crew_idx
                break
    return assignments

crew_assignments: dict[tuple, int] = {}
for trade_name in trade_names:
    trade_tasks = [t for t in all_stages.values() if t["trade"] == trade_name]
    if trade_tasks:
        crew_assignments.update(assign_crews(trade_tasks))


# === Build output ===

# Job-centric schedule.
schedule = {}
for (job_id, stage_id), task in all_stages.items():
    start = solver.value(task["start"])
    end = solver.value(task["end"])
    crew = crew_assignments.get((job_id, stage_id), 0)

    if job_id not in schedule:
        schedule[job_id] = {
            "job_id": job_id,
            "job_name": task["job_name"],
            "stages": [],
        }
    schedule[job_id]["stages"].append({
        "id": stage_id,
        "trade": task["trade"],
        "duration": task["duration"],
        "start": start,
        "end": end,
        "crew": crew,
    })

# Sort jobs by their earliest stage start.
sorted_jobs = sorted(
    schedule.values(),
    key=lambda j: min(s["start"] for s in j["stages"]),
)

# Trade-centric schedule: who is where on which day.
trade_schedule = {}
for trade_name in trade_names:
    trade_tasks = [
        t for t in all_stages.values() if t["trade"] == trade_name
    ]
    if not trade_tasks:
        continue

    entries = []
    for task in trade_tasks:
        crew = crew_assignments.get((task["job_id"], task["stage_id"]), 0)
        entries.append({
            "job_id": task["job_id"],
            "job_name": task["job_name"],
            "stage_id": task["stage_id"],
            "duration": task["duration"],
            "start": solver.value(task["start"]),
            "end": solver.value(task["end"]),
            "crew": crew,
        })
    # Sort by start time.
    entries.sort(key=lambda e: e["start"])
    trade_schedule[trade_name] = {
        "crews": trades[trade_name],
        "assignments": entries,
    }

output = {
    "makespan": solver.value(makespan),
    "optimal": status == cp_model.OPTIMAL,
    "schedule": sorted_jobs,
    "trade_schedule": trade_schedule,
}

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
with open(OUTPUT_DIR / "output.json", "w") as f:
    json.dump(output, f, indent=2)

print(f"✅ Solved in {solver.wall_time:.2f}s")
print(f"   Makespan: {output['makespan']} days")
print(f"   Optimal:  {output['optimal']}")
print(f"   Trades:   {len(trade_names)} ({sum(trades.values())} crews total)")
print(f"   Jobs:     {len(jobs)}")
print(f"   Written:  apps/web/public/output.json")
