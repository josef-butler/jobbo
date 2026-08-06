"""
Construction job scheduler using Google OR-Tools CP-SAT solver.

Reads data/input.json, models each construction stage as a job-shop task,
solves for the minimum-makespan schedule, and writes data/output.json.

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

trades = data["trades"]
trade_index = {name: i for i, name in enumerate(trades)}
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

        start = model.new_int_var(0, horizon, f"start_{key}")          # Renamed in ortools>=9.11
        end   = model.new_int_var(0, horizon, f"end_{key}")          # Renamed in ortools>=9.11
        interval = model.new_interval_var(start, duration, end, f"int_{key}")   # Renamed

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
    stage_map = {s["id"]: s for s in job["stages"]}

    for i, stage in enumerate(job["stages"]):
        key = (job["id"], stage["id"])
        task = all_stages[key]

        if stage.get("depends_on"):
            for dep_id in stage["depends_on"]:
                dep_key = (job["id"], dep_id)
                dep_task = all_stages[dep_key]
                model.add(task["start"] >= dep_task["end"])
        elif i > 0:
            # No explicit depends_on → sequential: this stage starts after the previous one.
            prev_key = (job["id"], job["stages"][i - 1]["id"])
            prev_task = all_stages[prev_key]
            model.add(task["start"] >= prev_task["end"])

# === No-overlap constraints per trade ===

trade_intervals: dict[str, list] = {t: [] for t in trades}
for task in all_stages.values():
    trade_intervals[task["trade"]].append(task["interval"])

for trade_name, intervals in trade_intervals.items():
    if intervals:
        model.add_no_overlap(intervals)

# === Objective: minimise makespan ===

makespan = model.new_int_var(0, horizon, "makespan")
for task in all_stages.values():
    model.add(task["end"] <= makespan)
model.minimize(makespan)

# === Solve ===

solver = cp_model.CpSolver()
# solver.parameters.log_search_progress = True   # uncomment during development
status = solver.solve(model)

if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
    print("Solver did not find a solution.", file=sys.stderr)
    sys.exit(1)

# === Build output ===

schedule = {}
for (job_id, stage_id), task in all_stages.items():
    start = solver.value(task["start"])
    end = solver.value(task["end"])

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
    })

# Sort jobs by their start time for a sensible output order.
sorted_jobs = sorted(
    schedule.values(),
    key=lambda j: min(s["start"] for s in j["stages"]),
)

output = {
    "makespan": solver.value(makespan),
    "optimal": status == cp_model.OPTIMAL,
    "schedule": sorted_jobs,
}

with open(OUTPUT_DIR / "output.json", "w") as f:
    json.dump(output, f, indent=2)

print(f"✅ Solved in {solver.wall_time:.2f}s")
print(f"   Makespan: {output['makespan']} days")
print(f"   Optimal:  {output['optimal']}")
print(f"   Written:  apps/web/public/output.json")
