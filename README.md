# Jobbo

A system for tracking and managing construction jobs. 40–50 active sites, each with different trades at different stages.

Built with Python (OR-Tools CP-SAT solver) and TypeScript (Vite + React + Tailwind v4).

## Quick start

Sample output data is already included in the repo. If you just want to browse the
frontend, you only need the dev server.

```bash
cd apps/web && pnpm install   # first time only
cd apps/web && pnpm dev       # start the Vite dev server
```

Then visit `http://localhost:5173/`. The prototype views appear at the root URL.

### Running the solver

To generate a fresh schedule from `data/input.json`:

```bash
pip install -r solver/requirements.txt   # first time only
python solver/solver.py                  # run the OR-Tools solver
python solver/compare.py                 # run what-if scenarios (~3 min)
```

Use `←` / `→` arrow keys or the floating bar at the bottom to cycle between variants.

## Prototype views

| Variant | URL | What it shows |
|---|---|---|
| **A — Trade Swimlane** | `?variant=A` | Per-trade Gantt with crew sub-lanes. "Who is where and when." Click a job bar to see all crews needed. Gap indicators and bottleneck badges flagged. |
| **B — Job Matrix** | `?variant=B` | Job rows with crew-labeled stage bars. Left sidebar: trade utilisation bars (green/amber/red). Expand a job row to see its crew chip grid. Hover for a preview panel. |
| **C — Scenario Planner** | `?variant=C` | What-if crew change comparison. Makespan bar chart, scenario cards with utilisation deltas, bottleneck deep-dive table, key finding + recommendation callouts. Compares 6 pre-computed scenarios. |

## Architecture

```
data/input.json          ← edit this to change the scenario
    │
    ▼
solver/solver.py         ← RCPSP model (cumulative constraints, configurable crews)
solver/compare.py        ← runs solver under N crew configurations
    │
    ▼
apps/web/public/output.json
apps/web/public/comparison.json
    │
    ▼
apps/web/               ← Vite + React 19 + Tailwind v4 + Base UI
```

## Docs

- [Questions](docs/QUESTIONS.md) — interview script and live note-taking surface
- [Models](docs/MODELS.md) — OR-Tools scheduling model catalog
- [Features](docs/FEATURES.md) — layered roadmap
