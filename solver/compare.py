"""Run the solver under multiple crew-config scenarios and output a comparison file.

Usage:
    python solver/compare.py
"""
import json, sys, copy
from pathlib import Path
from ortools.sat.python import cp_model

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
OUT_DIR = ROOT / "apps" / "web" / "public"

with open(DATA_DIR / "input.json") as f:
    data = json.load(f)

def solve_with_crews(crew_overrides: dict[str, int], time_limit: int = 30) -> dict:
    """Run solver with given crew counts. Returns output dict or None."""
    trades = {}
    for t in data["trades"]:
        name = t["name"]
        trades[name] = crew_overrides.get(name, t["crews"])

    jobs = data["jobs"]
    model = cp_model.CpModel()
    horizon = sum(s["duration"] for j in jobs for s in j["stages"])

    all_stages = {}
    for job in jobs:
        for stage in job["stages"]:
            key = (job["id"], stage["id"])
            d = stage["duration"]
            start = model.new_int_var(0, horizon, f"start_{key}")
            end = model.new_int_var(0, horizon, f"end_{key}")
            interval = model.new_interval_var(start, d, end, f"int_{key}")
            all_stages[key] = {
                "job_id": job["id"], "job_name": job["name"],
                "stage_id": stage["id"], "trade": stage["trade"],
                "duration": d, "start": start, "end": end,
                "interval": interval,
            }

    for job in jobs:
        for i, stage in enumerate(job["stages"]):
            key = (job["id"], stage["id"])
            task = all_stages[key]
            if stage.get("depends_on"):
                for dep_id in stage["depends_on"]:
                    dep_key = (job["id"], dep_id)
                    model.add(task["start"] >= all_stages[dep_key]["end"])
            elif i > 0:
                prev_key = (job["id"], job["stages"][i - 1]["id"])
                model.add(task["start"] >= all_stages[prev_key]["end"])
            if stage.get("min_delay"):
                for dep_id in stage.get("depends_on", []):
                    dep_key = (job["id"], dep_id)
                    model.add(task["start"] >= all_stages[dep_key]["end"] + stage["min_delay"])

    for trade_name, crew_count in trades.items():
        intervals = [t["interval"] for t in all_stages.values() if t["trade"] == trade_name]
        if intervals:
            model.add_cumulative(intervals, [1] * len(intervals), crew_count)

    makespan = model.new_int_var(0, horizon, "makespan")
    for task in all_stages.values():
        model.add(task["end"] <= makespan)
    model.minimize(makespan)

    solver = cp_model.CpSolver()
    solver.parameters.num_search_workers = 8
    solver.parameters.max_time_in_seconds = time_limit
    status = solver.solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None

    # Trade-centric util
    trade_util = {}
    for trade_name, crew_count in trades.items():
        tasks = [t for t in all_stages.values() if t["trade"] == trade_name]
        total_days = sum(solver.value(t["end"]) - solver.value(t["start"]) for t in tasks)
        util = round((total_days / (crew_count * solver.value(makespan))) * 100) if tasks else 0
        trade_util[trade_name] = {"crews": crew_count, "util_pct": util, "tasks": len(tasks)}

    return {
        "makespan": solver.value(makespan),
        "optimal": status == cp_model.OPTIMAL,
        "wall_time": round(solver.wall_time, 2),
        "trade_util": trade_util,
        "crew_overrides": crew_overrides,
    }


# === Define scenarios ===
base_crews = {t["name"]: t["crews"] for t in data["trades"]}

scenarios = [
    {"id": "baseline", "label": "Current crew counts", "crews": {}},
    {"id": "concrete-x2", "label": "+1 concrete crew (2 total)", "crews": {"concrete": 2}},
    {"id": "concrete-excavator-x2", "label": "+1 concrete + +1 excavator (2 each)", "crews": {"concrete": 2, "excavator": 2}},
    {"id": "excavator-x2", "label": "+1 excavator crew (2 total)", "crews": {"excavator": 2}},
    {"id": "kitchen-bathroom-x2", "label": "+1 kitchen + +1 bathroom installer", "crews": {"kitchen-installer": 2, "bathroom-installer": 2}},
    {"id": "all-bottlenecks-x2", "label": "2 crews on all single-crew trades", "crews": {
        "excavator": 2, "concrete": 2, "kitchen-installer": 2, "bathroom-installer": 2,
    }},
]

print("Running scenario comparison...")
results = []
for s in scenarios:
    overrides = {**base_crews, **s["crews"]}
    label = s["label"]
    print(f"  {s['id']}: {label} ... ", end="", flush=True)
    result = solve_with_crews(overrides)
    if result:
        result["id"] = s["id"]
        result["label"] = label
        results.append(result)
        print(f"makespan={result['makespan']}d, {result['wall_time']}s")
    else:
        print("FAILED")

# Build comparison output
baseline = results[0] if results else None
comparison = {
    "baseline": baseline,
    "scenarios": results,
}

OUT_DIR.mkdir(parents=True, exist_ok=True)
with open(OUT_DIR / "comparison.json", "w") as f:
    json.dump(comparison, f, indent=2)

print(f"\nWrote {len(results)} scenarios to apps/web/public/comparison.json")

# Summary table
if baseline:
    print(f"\n{'Scenario':<40} {'Makespan':>8} {'Δ':>6} {'Time':>6}")
    print("-" * 62)
    for r in results:
        delta = r["makespan"] - baseline["makespan"]
        sign = f"{delta:+d}d" if delta else "  --"
        print(f"{r['label']:<40} {r['makespan']:>5}d  {sign:>5}  {r['wall_time']:>5}s")
