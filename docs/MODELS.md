# Scheduling models — a decision guide

> **⚠️ Interview guard:** This catalog exists so I don't have to fetch API docs
> live. It must NOT bias me toward complex solutions. The interviewer is testing
> whether I can listen, ask questions, and build incrementally. Start with the
> simplest thing that answers the owner's stated need. If the owner says
> "I just want to see what's happening across my jobs," the answer is a list
> view or Gantt chart rendering existing data — not a solver. Only reach for
> scheduling/optimisation when a concrete constraint is named ("but I need to
> know if two trades will clash"). Let the conversation pull the model;
> don't push the model into the conversation.

Match domain requirements to the right model, or compose multiple models if the
problem spans categories. Each entry links to the official OR-Tools documentation.

---

## Quick-match table

| Model | Name | Requirement | Why |
|---|---|---|---|
| **JSP** | Job Shop Problem | One crew per trade, stages always in order | Fixed sequence of tasks. Each trade = one machine. One thing at a time. |
| **RCPSP** | Resource-Constrained Project Scheduling | "We have 3 plumbing crews, 2 sparky crews" | Like JSP but each trade has a capacity > 1. Multiple stages of the same trade can overlap. |
| **FJSP** | Flexible Job Shop | "Plumber or gasfitter can do the rough-in" | A stage can run on any trade from a set. Solver picks which one. |
| — | Employee Scheduling | "Bob works Mon–Thu, Alice does Tue–Fri" | Named individuals with personal availability. More granular than anonymous crews. |
| — | CP-SAT with penalties<br><small>Constraint Programming + Boolean Satisfiability</small> | "Each job has a hard deadline, late jobs cost $X/day" | Objective shifts from "finish fast" to "minimise cost of being late." |
| — | CP-SAT calendars<br><small>Constraint Programming + Boolean Satisfiability</small> | "No weekends, concrete needs 2 days to cure" | Block out dates (weekends, holidays) and enforce minimum gaps between stages. |
| — | CP-SAT re-solve<br><small>Constraint Programming + Boolean Satisfiability</small> | "A delay cascaded — how do we re-plan?" | Lock in tasks already started, free up the rest, re-run from today. |
| — | Assignment | "Assign trades to jobs" (no timeline) | Pure matching problem. No dates, no sequence, just who does what.

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

---

## 7. CP-SAT Python API Reference

> Fetched from the [official pdoc](https://or-tools.github.io/docs/pdoc/ortools/sat/python/cp_model.html)
> and [CP-SAT solver guide](https://developers.google.com/optimization/cp/cp_solver).
> Current as of OR-Tools ≥9.11.

### Import

```python
from ortools.sat.python import cp_model
```

### CpModel — building the model

```python
model = cp_model.CpModel()
```

#### Integer variables

```python
# new_int_var(lb, ub, name) → IntVar
x = model.new_int_var(0, 10, "x")          # domain [0, 10]
```

#### Boolean variables

```python
# new_bool_var(name) → IntVar (domain {0,1})
b = model.new_bool_var("b")
```

#### Interval variables

```python
# new_interval_var(start, size, end, name) → IntervalVar
# Internally enforces start + size == end.
start = model.new_int_var(0, horizon, "start_j1_s1")
end   = model.new_int_var(0, horizon, "end_j1_s1")
interval = model.new_interval_var(start, 5, end, "int_j1_s1")
```

#### Optional interval variables (Flexible Job Shop)

```python
# new_optional_interval_var(start, size, end, is_present, name) → IntervalVar
# When is_present=False, the interval is ignored by NoOverlap/Cumulative.
is_present = model.new_bool_var("present")
opt_interval = model.new_optional_interval_var(start, 3, end, is_present, "opt")
# Use with ExactlyOne to pick one of N alternatives:
model.add_exactly_one([present_a, present_b, present_c])
```

#### Pandas series helpers

```python
# new_int_var_series, new_bool_var_series, new_interval_var_series,
# new_optional_interval_var_series — bulk creation with pd.Index
```

### Constraints

All return a `Constraint` object.

```python
# Linear constraints — natural Python operators
model.add(x + y <= 10)
model.add(x >= y + 3)
model.add(x == 5)
model.add(x != y)

# AllDifferent
model.add_all_different([x, y, z])

# NoOverlap — no two intervals overlap in time (JSP machine constraint)
model.add_no_overlap([interval_list])           # returns Constraint

# NoOverlap2D — rectangles on a plane
model.add_no_overlap_2d(x_intervals, y_intervals)

# Cumulative — resource-constrained scheduling (RCPSP)
# sum(demands[i] for active intervals at time t) <= capacity
model.add_cumulative(intervals, demands, capacity)
# intervals: Iterable[IntervalVar]
# demands:   Iterable[affine expr], each >= 0
# capacity:  affine expr (constant or variable)

# ExactlyOne / ExactlyK
model.add_exactly_one([b1, b2, b3])     # Exactly one bool is true

# Element constraint: expressions[index] == target
model.add_element(index, expressions, target)

# Circuit (for sequencing/tour constraints)
model.add_circuit(arcs)  # arcs: list of (tail, head, literal) tuples

# Implication: OnlyEnforceIf
model.add(x == 3).only_enforce_if(b)    # b → (x == 3)

# Minimise / Maximise
model.minimize(makespan)
model.maximize(profit)
```

### CpSolver — solving and inspecting

```python
solver = cp_model.CpSolver()

# Optional: solver limits
solver.parameters.max_time_in_seconds = 30.0
solver.parameters.num_search_workers = 8          # parallel search
solver.parameters.log_search_progress = True      # stream to stderr
solver.parameters.enumerate_all_solutions = True  # for callbacks

# Solve
status = solver.solve(model, solution_callback=None)
# Status enum: cp_model.OPTIMAL, FEASIBLE, INFEASIBLE, MODEL_INVALID, UNKNOWN

# Read solution values
solver.value(x)              # int value of a variable or expression
solver.boolean_value(b)      # bool value
solver.objective_value       # float → best objective found
solver.best_objective_bound  # float → proven lower bound (minimisation)
solver.wall_time             # float → wall-clock solve time

# Response properties
solver.solve_info            # str → solver stats
solver.solve_log             # str → full search log (needs log_to_response=True)
solver.response_proto        # raw CpSolverResponse

# Status check pattern (used in solver.py)
if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
    print("No solution found.", file=sys.stderr)
    sys.exit(1)
```

### Solution callbacks

```python
class MyCallback(cp_model.CpSolverSolutionCallback):
    def __init__(self, variables):
        super().__init__()
        self._vars = variables

    def on_solution_callback(self):
        # Called for each solution found (with enumerate_all_solutions=True)
        vals = [self.value(v) for v in self._vars]
        print(f"Solution: {vals}")

# Built-in: VarArraySolutionPrinter, ObjectiveSolutionPrinter,
# VarArrayAndObjectiveSolutionPrinter
```

### Common patterns for construction scheduling

| Need | Pattern |
|---|---|
| Sequential stages in a job | `model.add(start_next >= end_prev)` |
| One crew per trade (JSP) | `model.add_no_overlap(trade_intervals)` |
| Multiple crews per trade (RCPSP) | `model.add_cumulative(intervals, [1]*n, crew_count)` |
| Flexible assignment (plumber OR gasfitter) | `new_optional_interval_var` + `add_exactly_one` |
| Concrete curing delay | `model.add(start_framing >= end_pour + 2)` |
| Hard deadline | `model.add(job_end <= deadline)` |
| Soft deadline with penalty | `model.minimize(makespan + sum(penalty * lateness))` |
| Rescheduling | Fix completed tasks: `model.add(start == known_start)`; re-solve rest |
| No weekends | Block out days via interval constraints on a calendar |

---

## 8. React Native / Expo Quick Reference

> For Tier 3 mobile features. React Native shares React's component model
> (hooks, state, props) but replaces DOM with native components.

### Project setup

```bash
npx create-expo-app@latest JobboMobile --template blank-typescript
cd JobboMobile
npx expo start    # QR code → Expo Go on device; w → web
```

### Key differences from React (web)

| Web (React DOM) | React Native |
|---|---|
| `<div>`, `<span>` | `<View>`, `<Text>` |
| CSS / className | `StyleSheet.create({...})` objects |
| `onClick` | `onPress` (TouchableOpacity, Pressable) |
| `<input>` | `<TextInput>` |
| Flexbox (default column) | Flexbox (default column, same API) |
| Browser navigation | Expo Router (file-based, same patterns) |
| `fetch` | `fetch` (same) |

### Core components

```tsx
import { View, Text, StyleSheet, TextInput, Pressable,
         ScrollView, FlatList, Modal, ActivityIndicator } from 'react-native';

<View style={styles.container}>
  <Text style={styles.title}>Jobbo</Text>
  <TextInput value={text} onChangeText={setText} placeholder="Search jobs" />
  <Pressable onPress={handlePress}>
    <Text>Tap me</Text>
  </Pressable>
  <FlatList
    data={jobs}
    renderItem={({ item }) => <JobCard job={item} />}
    keyExtractor={item => item.id}
  />
</View>

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' }
});
```

### Data layer

- **React Query** works the same way — same `useQuery`/`useMutation` API.
- **JSON fetch** from the same `output.json` endpoint or a hosted API.
- Local state: `useState`, `useReducer` — identical to React web.

### Navigation (Expo Router)

```
app/
  _layout.tsx      → Stack or Tab navigator
  index.tsx        → Home screen
  jobs/[id].tsx    → Job detail (dynamic route)
```

### When the interview asks about mobile

1. **Start with Expo** — it's the recommended React Native framework.
2. **Reuse the same JSON I/O pattern** — `solver.py` writes `output.json`, mobile
   fetches it (or a lightweight API wrapper).
3. **Component logic ports directly** — hooks, React Query, state management all
   carry over. Replace `<div>` with `<View>`, Tailwind `className` with
   `StyleSheet.create`.
4. **Gantt chart replacement** — `react-native-svg` for custom drawing, or
   `victory-native` for charts.
5. **PWA as a stepping stone** — if native tooling is too heavy mid-interview,
   a PWA (service worker + manifest) gives mobile access without Expo setup.


