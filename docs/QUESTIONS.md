# Interview

## Context

> A building company is running 40-50 jobs at any given time. Each job needs
> different trades at different stages. The owner wants a system to track and
> manage it.

---

## Phase 1 — Foundation (10–15 min)

*Domain model + goal. Enough to build the right prototype.*

1. **Is there any additional context before we jump into questions?**

- 

2. **What does the owner do today and what makes it hard?**

- Spreadsheets, not well formed.
- Mostly communication with tradies via SMS messages, calls etc. eg. to scheduling.

3. **What does "managing" the jobs mean?** Visibility into current state?
   Actively scheduling and rescheduling? Both?

- See answer to question #8.
- Being able to see where everyone is at each week and having a system to work it out.
- Who is on site, where and when.

4. **Walk me through a typical job.** What are the stages, in what order? Is
   it the same sequence for every job, or does each one differ?

   *(Example: "For a standard three-bedroom — section cleared and slab poured,
   framing goes up, roof and windows on, sparky and plumber rough-in, insulation,
   gib fixed and stopped, painting, flooring, kitchen and joinery, fit-off,
   final clean, handover.")*

   *(Follow-up: any dependencies between trades that aren't obvious from the
   order? E.g. the sparky can rough-in some areas before the plasterer is
   completely done.)*

- All brand new house builds.
- Sequencing and dependencies in this order:
   - Foundations and slabs go first.
   - Framing.
   - Plumbing and electrical rough-in (these two can happen in parallel).
   - Gib goes on (both physical panels and plastering - different but happens as one physical job).
   - Painting.
   - The following jobs can go in parallel:
      - Kitchen.
      - Bathroom.
      - Tiling and flooring.
      - Other little things.
      - Plumbing (taps, hardwards, etc.)
      - Electrical fitout (light switches, etc.)

5. **In-house crews or subcontractors?**
   *(In-house = you control their schedule. Subcontractors = they have other
   clients and limited availability.)*

   - Mostly subcontractors.
   - Jobs can stall because a subcontractor isn't available on the day.

6. **Can a trade work on two sites in one day,** or is it one site per day?

- For most things it will full days. Treat this as default.
- For small stuff like inspections, it might be two in one day.

7. **What question can't they answer today** that they wish they could?

- See other answers.

8. **What would make the owner say "this is exactly what I needed"?**
   *(If unclear: "Would you rather every job hits its date but crews sit idle
   some days, or every crew is busy but some jobs run late?")*

- Figuring out who needs to be where and when.
- Because working with real people, real things come up like sickness, etc.
- Being able to shuffle things so need visibility of what is going on.

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

12. **Additional context**

- Stages from the perspective of the owner can be high level - ie. assumes it is up to the trade to manage the work within a stage themselves (ie. a painter has interior painting vs exterior). Different granularity of stages could be considered as a refinement but high level is acceptable.

---

*Our terms — not questions, just reference:*

- **Dependency** — Stage B can't start until A finishes
- **Parallel** — Two stages at the same time
- **Makespan** — Earliest start to latest finish
- **Capacity** — How many jobs a trade can do at once
- **Template** — Same stage sequence across jobs
