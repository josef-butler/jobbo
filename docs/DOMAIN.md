# Domain glossary

A shared vocabulary for the scheduling problem. The left column defines each term at a
generic level; the right column captures the context-specific meaning. Fill in the
right column during the conversation — mismatched definitions cause more bugs than
mismatched code.

---

## Raw notes

_Type answers here as they come. Transfer structured bits to the matrix below._

---

## Modeling vocabulary

_These are our terms. The owner will use different words — we translate._

| Concept | Definition |
|---|---|
| **Dependency** | Stage B cannot start until Stage A finishes |
| **Parallel** | Two stages that can happen at the same time (no dependency between them) |
| **Makespan** | The total time from the earliest job start to the latest job finish |
| **Capacity** | How many jobs a trade can work on simultaneously |
| **Template** | A reusable sequence of stages shared across jobs of the same type |

## Concept matrix

_Fill in the right column during the conversation._

| Concept | Generic definition | Context-specific definition |
|---|---|---|
| **Job** | A unit of work with a start, an end, and a location | |
| **Stage** | A step within a job, performed by a specific trade | |
| **Trade** | The type of work (plumbing, framing, electrical, etc.) | |
| **Crew** | The people or company performing the work | |
| **Duration** | How long a stage takes, in days | |
| **Deadline** | A fixed date by which a job must be complete | |

---

## Decisions

_Document choices made during the conversation. Things like: "trade X always runs
before trade Y," "the owner is the only user for now," "due dates are soft." These
feed directly into the solver constraints and UI design._
