# Jobbo

A system for tracking and managing construction jobs. 40–50 active sites, each with different trades at different stages.

Built with Python (OR-Tools CP-SAT solver) and TypeScript (Vite + React + Tailwind v4).

## Quick start

```bash
make install    # pip install + pnpm install (first time only)
make solve      # run the OR-Tools solver (writes apps/web/public/output.json)
make compare    # run what-if scenarios (writes comparison.json, ~3 min)
make dev        # start the Vite dev server
```

Then visit `http://localhost:5173/`. Append `?prototype` to reveal the prototype views.

Use `←` / `→` arrow keys or the floating bar at the bottom to cycle between variants.

## Prototype views

| Variant | URL | What it shows |
|---|---|---|
| **A — Trade Swimlane** | `?prototype&variant=A` | Per-trade Gantt with crew sub-lanes. "Who is where and when." Click a job bar to see all crews needed. Gap indicators and bottleneck badges flagged. |
| **B — Job Matrix** | `?prototype&variant=B` | Job rows with crew-labeled stage bars. Left sidebar: trade utilisation bars (green/amber/red). Expand a job row to see its crew chip grid. Hover for a preview panel. |
| **C — Scenario Planner** | `?prototype&variant=C` | What-if crew change comparison. Makespan bar chart, scenario cards with utilisation deltas, bottleneck deep-dive table, key finding + recommendation callouts. Compares 6 pre-computed scenarios. |

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
