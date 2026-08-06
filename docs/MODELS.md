# Scheduling models — a decision guide

Match domain requirements to the right model, or compose multiple models if the
problem spans categories. Each entry links to the official OR-Tools documentation.

---

## Quick-match table

| Requirement                                                       | Model(s)                 | Why                                                              |
| ------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| One crew per trade, stages always in order                          | **Job Shop**             | Classic JSP — tasks on machines, precedence                      |
| "We have 3 plumbing crews, 2 sparky crews"                          | **RCPSP** (cumulative)   | JSP but with capacity > 1 per resource                           |
| "Plumber or gasfitter can do the rough-in"                          | **Flexible Job Shop**    | Tasks can run on any machine from a set                          |
| "Bob works Mon–Thu, Alice does Tue–Fri"                             | **Employee Scheduling**  | Assign individuals to shifts; constrain availability             |
| "Each job has a hard deadline, late jobs cost $X/day"               | **CP-SAT with penalties**| Objective shifts from makespan to cost-minimisation              |
| "Trades don't work weekends, concrete needs 2 days to cure"         | **CP-SAT calendars**     | Banned intervals + minimum delays between stages                 |
| "A delay on one job cascades — how do we re-plan?"                  | **CP-SAT re-solve**      | Fix the past (already-started tasks) and re-optimise the future  |
| "We just need to assign the right trade to each job" (no timeline)  | **Assignment**           | Pure matching — no time axis                                     |

---

## Models in detail

### 1. Job Shop Problem (JSP) — our starting point

**What it solves:** Jobs broken into a sequence of tasks. Each task must run on a specific
machine. Each machine handles one task at a time. Minimise the total makespan.

**Maps to construction:**

| OR-Tools concept | Construction equivalent |
|---|---|
| job | One build/renovation site |
| task = (machine, duration) | A stage = (trade, days), e.g. (framing, 7d) |
| machine | A trade or crew type (plumber, sparky, carpenter) |
| precedence constraint | Stages must run in order — foundations before framing, framing before MEP, MEP before finishing |
| `add_no_overlap` / `CumulativeConstraint` | A crew does one thing at a time; a trade pool of K crews can do K things simultaneously |
| `minimize(makespan)` | Finish everything as early as possible |

**Our solver already does this,** plus parallel stages via `depends_on`.

- [OR-Tools JSP guide](https://developers.google.com/optimization/scheduling/job_shop)
- We use CP-SAT directly (not a JSP wrapper), so extending it is natural.

---

### 2. RCPSP — Resource-Constrained Project Scheduling

**What it solves:** Tasks consume resources (people, equipment). Each resource has a
capacity. Tasks can run in parallel as long as total resource usage ≤ capacity.

**Maps to construction:** Trade = resource pool. "3 carpenter crews" = capacity 3.
Two framing tasks can run simultaneously if 2 crews are available.

**How to add to our solver:** Replace `AddNoOverlap` with `CumulativeConstraint`.
Two-line change per trade.

- Not a separate OR-Tools page; search for `CumulativeConstraint` in the
  [CP-SAT solver docs](https://developers.google.com/optimization/cp/cp_solver)

---

### 3. Flexible Job Shop

**What it solves:** Like JSP, but each task can be processed by any machine from a set
of alternatives (with possibly different durations per machine).

**Maps to construction:** "Plumber OR gasfitter can do the rough-in." "Joe (fast) or
the apprentice (slow) can do the painting."

**How to add:** Use CP-SAT optional intervals — create one interval per alternative,
add an `ExactlyOne` constraint to pick one.

- Not a separate OR-Tools page; search for "optional intervals" or "alternative
  resources" in the [CP-SAT solver docs](https://developers.google.com/optimization/cp/cp_solver)

---

### 4. Employee / Workforce Scheduling

**What it solves:** Assign employees to shifts while respecting availability,
preferences, skill requirements, and coverage demands.

**Maps to construction:** Individual tradespeople with personal calendars, rather than
anonymous crews. Bob can only work Mon–Thu. Alice doesn't do roofing.

**When to use:** The domain involves individual people rather than anonymous trade
crews. This model operates on the person level, not the trade-crew level.

- [Employee Scheduling overview](https://developers.google.com/optimization/scheduling/employee_scheduling)
- [CP-SAT shift scheduling example](https://developers.google.com/optimization/scheduling/employee_scheduling#a_nurse_scheduling_problem)

---

### 5. Assignment Problem

**What it solves:** Match workers to tasks one-to-one (or many-to-one) to minimise cost.
**No time dimension** — this is about *who does what*, not *when*.

**Maps to construction:** "We have 8 jobs ready for electrical rough-in and 2 sparky
crews — which jobs do we assign to which crew to minimise travel time?"

**When to use:** Pure allocation without scheduling. Can be combined with JSP as a
sub-problem (e.g., optimise assignment within each week's available work).

- [Assignment overview](https://developers.google.com/optimization/assignment)
- [Assignment with teams](https://developers.google.com/optimization/assignment/assignment_teams)

---

### 6. CP-SAT — the engine underneath

**What it solves:** Any constraint satisfaction / optimisation problem you can express
as integer variables, constraints, and an objective.

**All the models above are just patterns built on CP-SAT.** When no named pattern fits,
model the problem directly with CP-SAT primitives: interval variables, optional
intervals, cumulative constraints, circuit constraints, linear expressions.

**Language availability:** OR-Tools has no official JavaScript or TypeScript binding.
Official bindings are Python, C++, Java, and C#. Integration patterns from a Node/React
stack are (a) a thin Python service or script with JSON I/O, or (b) a TypeScript
heuristic scheduler that approximates the solver output. Our setup uses pattern (a):
a Python script (`solver/solver.py`) that reads `input.json` and writes `output.json`,
invoked independently of the frontend.

Key CP-SAT primitives:
- `new_interval_var` — a task with a start, duration, and end
- `add_no_overlap` — no two tasks on the same resource at once
- `CumulativeConstraint` — capacity-limited resource pool
- `new_optional_interval_var` — a task that may or may not be scheduled
- `add_circuit` — enforce a tour (useful for sequencing dependencies)
- Objective: `minimize(makespan)` or minimise weighted sum of costs/delays

- [CP-SAT solver guide](https://developers.google.com/optimization/cp/cp_solver)
- [CP-SAT example (N-queens)](https://developers.google.com/optimization/cp/queens)

---

## How they compose

The most powerful thing: **these models are not mutually exclusive.** A realistic
construction scheduler might use:

```
RCPSP            ← Multiple crews per trade
  + calendars    ← No weekends, public holidays, concrete curing time
  + deadlines    ← Each job has a target finish date; late = penalty
  + re-solve     ← When a delay happens, re-plan from current state
  + assignment   ← Weekly: which specific crew goes to which job (minimise travel)
```

All of these are just CP-SAT constraints layered onto the same model. You don't
switch solvers — you add constraints. Our `solver.py` already does JSP + parallel
stages. Each of the additions above is a small, incremental code change.


