# Jobbo: Construction Job Scheduler

A system for tracking and managing 40–50 construction jobs, each with different
trades at different stages. Built as a rapid prototyping tool with a Python OR-Tools
optimisation solver and a TypeScript React frontend.

## Interview mode

When the user indicates the interview has started, you are assisting in a live
one-hour coding interview. The user is driving the conversation with the interviewer.
Your role: help them move fast, catch mistakes, surface the right doc at the right
moment, and generate code quickly. Do not drive unprompted. Let the user lead.

## Architecture

```
data/input.json          ← edit this to change the scenario
    │
    ▼
solver/solver.py         ← reads input, runs OR-Tools CP-SAT, writes output
    │
    ▼
apps/web/public/output.json
    │
    ▼
apps/web/                ← Vite + React 19 + Tailwind v4 + Base UI
    │
    ▼
    ?prototype            ← full list/timeline view (hidden by default)
    /                     ← blank landing page (shown to stakeholders)
```

The solver and frontend are decoupled. The solver is a standalone Python script.
The frontend is a standalone Vite SPA that reads `output.json` at runtime.

## Commands

```
pip install -r solver/requirements.txt   # first time only
cd apps/web && pnpm install             # first time only
python solver/solver.py                 # run the OR-Tools solver
cd apps/web && pnpm dev                 # start the Vite dev server
```

After running the solver, the frontend picks up changes on the next browser refresh.

## Interview workflow

1. **Requirements gathering:** open `docs/QUESTIONS.md`. Share on screen.
   Work through Phase 1 (domain model + goal) in ~10-15 min. Capture answers
   inline. Phase 2 (model refinement) if time permits. Reference
   `docs/EXAMPLES.md` if the conversation stalls.

2. **Model the scenario:** ask the AI to generate `data/input.json` from your
   Phase 1 notes. Ask for a human-readable summary and verify it with the
   interviewer before proceeding. Reference `docs/MODELS.md` for which OR-Tools
   pattern fits the constraints.

3. **Solve:** run `python solver/solver.py`. A schedule appears in `apps/web/public/output.json`.

4. **Demo:** visit `http://localhost:5173/?prototype` to show the list and timeline
   views. The root URL shows a blank landing page. Append `?prototype` only when
   the conversation validates a pre-built view.

5. **Extend:** use `docs/FEATURES.md` as a roadmap for "if we had more time."
   Each feature links to the corresponding model and the specific solver change.

## Key files

| File | Purpose |
|---|---|
| `data/input.json` | Scenario definition: jobs, stages, trades, durations |
| `solver/solver.py` | OR-Tools CP-SAT job shop solver |
| `apps/web/src/App.tsx` | Landing page and prototype reveal logic |
| `apps/web/src/components/GanttChart.tsx` | Timeline view. Horizontal bars per job. |
| `apps/web/src/components/JobList.tsx` | Card grid view |
| `apps/web/src/components/JobDetail.tsx` | Dialog showing stage breakdown per job |
| `docs/QUESTIONS.md` | Two-phase interview script and live note-taking surface |
| `docs/MODELS.md` | OR-Tools model catalog and decision guide |
| `docs/FEATURES.md` | Layered feature roadmap |
| `docs/EXAMPLES.md` | Conversation prompts if the discussion stalls |

## AI assistance

When generating code in this project:

- Use `@base-ui/react` for interactive primitives (Dialog, Button). Do not use coss or shadcn.
- Use Tailwind v4 utility classes only (no custom CSS).
- Keep components self-contained in `apps/web/src/components/`.
- The solver uses Python 3 and OR-Tools. Install with `pip install -r solver/requirements.txt`.
- The frontend uses pnpm. Run with `cd apps/web && pnpm dev`.
- Types are in `apps/web/src/types.ts`. Keep them in sync with the solver output schema.
