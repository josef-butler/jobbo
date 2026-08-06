# Interview

## Context

> A building company is running 40-50 jobs at any given time. Each job needs
> different trades at different stages. The owner wants a system to track and
> manage it.

---

## Phase 1 — Foundation (10–15 min)

*Domain model + goal. Enough to build the right prototype.*

1. **Is there any additional context before we jump into questions?**

2. **What does the owner do today and what makes it hard?**

3. **What does "managing" the jobs mean?** Visibility into current state?
   Actively scheduling and rescheduling? Both?

4. **Walk me through a typical job.** What are the stages, in what order? Is
   it the same sequence for every job, or does each one differ?

   *(Example: "For a standard three-bedroom — section cleared and slab poured,
   framing goes up, roof and windows on, sparky and plumber rough-in, insulation,
   gib fixed and stopped, painting, flooring, kitchen and joinery, fit-off,
   final clean, handover.")*

   *(Follow-up: any dependencies between trades that aren't obvious from the
   order? E.g. the sparky can rough-in some areas before the plasterer is
   completely done.)*

5. **In-house crews or subcontractors?**
   *(In-house = you control their schedule. Subcontractors = they have other
   clients and limited availability.)*

6. **Can a trade work on two sites in one day,** or is it one site per day?

7. **What question can't they answer today** that they wish they could?

8. **What would make the owner say "this is exactly what I needed"?**
   *(If unclear: "Would you rather every job hits its date but crews sit idle
   some days, or every crew is busy but some jobs run late?")*

---

## Phase 2 — Refinement (if time permits)

*Model details. These tune the solver, not the goal.*

9. **How long do stages take?** Fixed per type, or varies per job?

10. **Are there deadlines?** Hard dates, or soft targets?

11. **What happens when something goes wrong?**

    - One crew per trade, or multiple?
    - Mandatory waits? (gib stopping, concrete curing)
    - Trade delayed or goes AWOL mid-job
    - Weather (rain for two weeks — what breaks?)
    - Council inspection backlog
    - Last-minute job added
    - Materials delayed (timber not on site, can't start framing)

---

*Our terms — not questions, just reference:*

- **Dependency** — Stage B can't start until A finishes
- **Parallel** — Two stages at the same time
- **Makespan** — Earliest start to latest finish
- **Capacity** — How many jobs a trade can do at once
- **Template** — Same stage sequence across jobs
