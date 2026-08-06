# Features — a layered roadmap

Each feature links to the relevant model in [MODELS.md](./MODELS.md) and names the
specific change needed in `solver.py`. The tiers are ordered by natural conversation
flow — start at the bottom and build up as constraints emerge.

---

## Tier 1 — Realism

_These surface when the conversation moves from "track jobs" to "but the real world is
messier than that." Each is a small, incremental solver change — none invalidate what
we've already built._

| Feature | Model | Solver change |
|---|---|---|
| **Multiple crews per trade** ("3 plumbing crews") | RCPSP — [MODELS.md §2](./MODELS.md#2-rcpsp--resource-constrained-project-scheduling) | Replace `add_no_overlap` with `CumulativeConstraint` per trade, capacity = crew count |
| **Trade availability calendars** ("no weekends, public holidays") | CP-SAT calendars — [MODELS.md §6](./MODELS.md#6-cp-sat--the-engine-underneath) | Add `new_interval_var` for non-working periods; constrain task intervals to avoid them |
| **Minimum delays** ("concrete needs 2 days to cure before framing") | CP-SAT — [MODELS.md §6](./MODELS.md#6-cp-sat--the-engine-underneath) | Add `min_delay` field to stage schema; `model.add(start_next >= end_prev + delay)` |
| **Hard deadlines per job** ("job 7 must finish by May 15") | CP-SAT with penalties — [MODELS.md §6](./MODELS.md#6-cp-sat--the-engine-underneath) | Add `deadline` to job schema; `model.add(job_end <= deadline)` or add penalty cost to objective |
| **Rescheduling after delays** ("the roofer is 4 days late on job 3") | CP-SAT re-solve — [MODELS.md §6](./MODELS.md#6-cp-sat--the-engine-underneath) | Fix completed/started tasks at their actual times; re-solve for remaining tasks |
| **Flexible trade assignment** ("plumber OR gasfitter can rough-in") | Flexible Job Shop — [MODELS.md §3](./MODELS.md#3-flexible-job-shop) | Optional intervals + `ExactlyOne` constraint per stage |

---

## Tier 2 — Operations

_These surface when the conversation shifts from "can we optimise?" to "how do we use
this day to day?" They're frontend features — no solver changes._

| Feature | What it does | Frontend work |
|---|---|---|
| **Add / edit jobs in the UI** | Form to create new jobs with stages, trades, durations; edit existing ones | New route: `/jobs/new`, `/jobs/:id/edit`. Base UI Dialog + Form. Writes to `input.json`-equivalent structure |
| **Drag-to-reschedule** | Drag a stage bar in the Gantt to a new date; recalculate downstream dependencies | dnd-kit integration on timeline bars; validate against constraints client-side |
| **Trade utilisation dashboard** | Bar chart: % of each trade's capacity currently allocated across all jobs | Read `output.json`, sum task durations per trade, divide by available capacity. Recharts or hand-rolled SVG bars |
| **Export schedule** | Download the schedule as CSV or PDF for the owner to share | CSV: trivial JSON → CSV. PDF: `jsPDF` or browser print CSS |
| **Search / filter jobs** | Find jobs by name, trade, or status | Client-side filter on the job list; TanStack Router search params for shareable filter state |

---

## Tier 3 — Scale

_These surface late in the conversation — "what about when we grow to 200 jobs?" or
"what about the tradespeople on site?" They're architectural, not implementation._

| Feature | What it does | Approach |
|---|---|---|
| **Mobile view for trades on site** | Tradesperson sees their assigned jobs for the day, can mark stages complete | PWA or React Native (matching the job ad's stack). New app in `apps/mobile/` |
| **Multi-user with roles** | Owner vs project manager vs tradesperson — different views and permissions | Auth layer + row-level filtering. Not a solver change |
| **Notifications** | Alert when a stage finishes, a delay cascades, or a trade is about to be idle | Email or push. Hook into solver output diff: compare old schedule to new, surface changes |
| **Material / equipment tracking** | Materials needed per stage, delivery lead times, constraints ("can't start framing until timber arrives") | New resource type in the solver: non-renewable resources with arrival dates. CP-SAT handles this via additional interval constraints |
| **Integration with accounting** | Job costs, trade rates, invoice triggers ("stage complete → bill the client") | External API integration. Not a solver concern — pure backend feature |
