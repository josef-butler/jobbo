# Questions

## Context

> A building company is running 40-50 jobs at any given time. Each job needs
> different trades at different stages. The owner wants a system to track and
> manage it.
>
> Access is available to subject matter experts to provide additional context.

## Opening

1. **Is there any additional context before we jump into questions?**
2. **What does the owner do today and what makes it hard?**
3. **What data exists already?** Spreadsheets, invoices, anything digital.
4. **What does "managing" the jobs mean?** Visibility into current state? Actively scheduling and rescheduling? Both?
5. **What question can't they answer today** that they wish they could?

## Domain model

6. **Walk me through a typical job.** What are the stages, in what order? Is it
   the same sequence for every job, or does each one differ? *(This is where
   you'll discover the trades, dependencies, templates, and parallel stages —
   let them describe it in their own words.)*
7. **In-house crews or subcontractors?**
8. **Can a trade work on two sites in one day,** or is it one site per day?

## Workflow

9. **Who's the primary user?** Just the owner, or tradespeople and project
   managers too?

## Constraints

10. **What happens when something goes wrong?** Trade delayed, weather, a job
    added last minute.

## Deferred (prototyping questions)

- Multiple crews per trade, or one per trade?
- Do stages have fixed durations, or do they vary per job?
- Do trades have availability constraints? Only certain days, part-time,
  seasonal?
- Are buffer times needed between stages? E.g. concrete curing for 2 days.

## Capstone

11. **What would make the owner say "this is exactly what I needed"?**
