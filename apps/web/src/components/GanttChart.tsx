import { useState } from "react";
import type { JobSchedule, Stage } from "@/types";
import { TRADE_COLORS, TRADE_COLORS_LIGHT } from "@/types";

interface Props {
  jobs: JobSchedule[];
  makespan: number;
  onSelectJob: (job: JobSchedule) => void;
}

export function GanttChart({ jobs, makespan, onSelectJob }: Props) {
  const [hoveredStage, setHoveredStage] = useState<Stage | null>(null);

  return (
    <div className="relative overflow-x-auto rounded-lg border border-zinc-800">
      {/* Tooltip — absolutely positioned so it doesn't shift the chart layout */}
      {hoveredStage && (
        <div className="pointer-events-none absolute top-2 left-4 z-10 rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 shadow-lg">
          {hoveredStage.trade} — day {hoveredStage.start} → {hoveredStage.end}{" "}
          ({hoveredStage.duration}d)
        </div>
      )}

      <div className="min-w-[800px]">
        {jobs.map((job) => (
          <div
            key={job.job_id}
            className="flex border-b border-zinc-800 last:border-b-0"
          >
            {/* Job label */}
            <button
              type="button"
              onClick={() => onSelectJob(job)}
              className="w-44 shrink-0 border-r border-zinc-800 px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-zinc-800/50"
            >
              <div className="truncate">{job.job_name}</div>
            </button>

            {/* Timeline row */}
            <div className="relative flex-1 py-2 pr-4">
              {job.stages.map((stage) => {
                const left = (stage.start / makespan) * 100;
                const width = (stage.duration / makespan) * 100;

                return (
                  <div
                    key={`${job.job_id}-${stage.id}`}
                    className={`absolute top-1/2 h-6 -translate-y-1/2 rounded-sm transition-opacity hover:opacity-80 ${
                      TRADE_COLORS[stage.trade] ?? "bg-zinc-500"
                    }`}
                    style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
                    onMouseEnter={() => setHoveredStage(stage)}
                    onMouseLeave={() => setHoveredStage(null)}
                    title={`${stage.trade}: ${stage.duration}d (day ${stage.start}–${stage.end})`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { TRADE_COLORS_LIGHT };
