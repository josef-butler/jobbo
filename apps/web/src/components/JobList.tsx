import type { JobSchedule } from "@/types";
import { TRADE_COLORS } from "@/types";

interface Props {
  jobs: JobSchedule[];
  onSelectJob: (job: JobSchedule) => void;
}

function daysRemaining(job: JobSchedule): number {
  const lastEnd = Math.max(...job.stages.map((s) => s.end));
  return lastEnd;
}

function activeTrade(job: JobSchedule): string | null {
  // Find the stage that's "in progress" if start <= 0, or the next unstarted stage.
  // Since all times are absolute from the solver, we show the first stage as active.
  const next = job.stages.find((s) => s.start >= 0);
  return next?.trade ?? null;
}

export function JobList({ jobs, onSelectJob }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => {
        const trade = activeTrade(job);
        return (
          <button
            key={job.job_id}
            type="button"
            onClick={() => onSelectJob(job)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-medium text-sm">{job.job_name}</h3>
              <span className="shrink-0 text-xs text-zinc-500 tabular-nums">
                {job.stages.length} stages
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {trade && (
                <span
                  className={`inline-block h-2 w-2 rounded-full ${TRADE_COLORS[trade] ?? "bg-zinc-500"}`}
                />
              )}
              <span className="text-xs text-zinc-400">
                {trade ? `Next: ${trade}` : "All done"}
              </span>
            </div>

            <div className="mt-1 text-xs text-zinc-500">
              Finishes day {daysRemaining(job)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
