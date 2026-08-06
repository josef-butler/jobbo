import { Dialog } from "@base-ui/react/dialog";
import type { JobSchedule } from "@/types";
import { TRADE_COLORS, TRADE_COLORS_LIGHT } from "@/types";

interface Props {
  job: JobSchedule;
  makespan: number;
  onClose: () => void;
}

export function JobDetail({ job, makespan, onClose }: Props) {
  // Parse the job name into a short label for the stage timeline.
  const firstStageStart = job.stages[0]?.start ?? 0;
  const lastStageEnd = job.stages[job.stages.length - 1]?.end ?? 0;
  const jobSpan = lastStageEnd - firstStageStart;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
          <Dialog.Title className="font-semibold text-lg tracking-tight">
            {job.job_name}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-zinc-500">
            {job.stages.length} stages · finishes day {lastStageEnd} ·{" "}
            {jobSpan} day span
          </Dialog.Description>

          {/* Stage list */}
          <div className="mt-6 space-y-3">
            {job.stages.map((stage, i) => {
              const prevEnd = i > 0 ? job.stages[i - 1].end : null;
              const hasGap = prevEnd !== null && stage.start > prevEnd;

              return (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/50 px-3 py-2.5"
                >
                  {/* Color bar */}
                  <div
                    className={`h-8 w-1.5 shrink-0 rounded-full ${TRADE_COLORS[stage.trade] ?? "bg-zinc-500"}`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate text-sm font-medium">
                        {stage.trade}
                      </span>
                      {i === 0 && (
                        <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 uppercase">
                          first
                        </span>
                      )}
                      {i === job.stages.length - 1 && (
                        <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 uppercase">
                          last
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      Day {stage.start} → {stage.end} · {stage.duration}d
                      {hasGap && (
                        <span className="ml-2 text-amber-500">
                          {stage.start - prevEnd!}d gap
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Close button */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-700"
            >
              Close
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
