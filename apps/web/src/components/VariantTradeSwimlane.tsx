import { useState } from "react";
import type { ScheduleOutput, TradeAssignment } from "@/types";
import { TRADE_COLORS } from "@/types";
import { AlertTriangle, GripVertical } from "lucide-react";

interface Props {
  data: ScheduleOutput;
}

/** Calculate utilization for a trade: total working days / (crews * makespan) */
function tradeUtilization(
  assignments: TradeAssignment[],
  crews: number,
  makespan: number,
): number {
  const totalDays = assignments.reduce((sum, a) => sum + a.duration, 0);
  return Math.round((totalDays / (crews * makespan)) * 100);
}

/** Find gaps in a crew's schedule. Returns list of {from, to, days}. */
function findGaps(assignments: TradeAssignment[]): { from: number; to: number; days: number }[] {
  if (assignments.length < 2) return [];
  const sorted = [...assignments].sort((a, b) => a.start - b.start);
  const gaps: { from: number; to: number; days: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start > sorted[i - 1].end) {
      gaps.push({
        from: sorted[i - 1].end,
        to: sorted[i].start,
        days: sorted[i].start - sorted[i - 1].end,
      });
    }
  }
  return gaps;
}

export function VariantTradeSwimlane({ data }: Props) {
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const makespan = data.makespan;

  const trades = Object.entries(data.trade_schedule).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  // Build a lookup for job name from a job_id.
  const jobNames: Record<string, string> = {};
  for (const job of data.schedule) {
    jobNames[job.job_id] = job.job_name;
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm">
        <span className="font-medium">Trades</span>
        {trades.map(([name, info]) => {
          const util = tradeUtilization(info.assignments, info.crews, makespan);
          const isBottleneck = info.crews === 1;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setSelectedTrade(selectedTrade === name ? null : name)}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                selectedTrade === name
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${TRADE_COLORS[name] ?? "bg-zinc-500"}`} />
              {name}
              <span className="text-zinc-600">{info.crews}c</span>
              <span className="tabular-nums text-zinc-500">{util}%</span>
              {isBottleneck && (
                <span title="Single crew — bottleneck risk">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Swimlanes */}
      <div className="space-y-0 rounded-lg border border-zinc-800">
        {trades
          .filter(([name]) => !selectedTrade || name === selectedTrade)
          .map(([tradeName, info]) => {
            // Group assignments by crew.
            const crewCount = info.crews;
            const byCrew: TradeAssignment[][] = Array.from({ length: crewCount }, () => []);
            for (const a of info.assignments) {
              byCrew[a.crew]?.push(a);
            }

            const gaps = findGaps(info.assignments);

            return (
              <div
                key={tradeName}
                className="border-b border-zinc-800 last:border-b-0"
              >
                {/* Trade header */}
                <div className="flex items-center gap-3 border-b border-zinc-800/50 bg-zinc-900/30 px-4 py-2">
                  <GripVertical className="h-3.5 w-3.5 text-zinc-600" />
                  <span className={`h-3 w-3 rounded-sm ${TRADE_COLORS[tradeName] ?? "bg-zinc-500"}`} />
                  <span className="text-sm font-medium">{tradeName}</span>
                  <span className="text-xs text-zinc-500">
                    {crewCount} crew{crewCount > 1 ? "s" : ""}
                  </span>
                  {crewCount === 1 && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                      Bottleneck
                    </span>
                  )}
                  {gaps.length > 0 && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                      {gaps.length} gap{gaps.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Crew sub-lanes */}
                {byCrew.map((crewAssignments, crewIdx) => (
                  <div
                    key={crewIdx}
                    className="flex border-b border-zinc-800/30 last:border-b-0"
                  >
                    {/* Crew label */}
                    <div className="flex w-20 shrink-0 items-center border-r border-zinc-800/30 px-2 py-1.5">
                      <span className="text-[10px] text-zinc-600">
                        Crew {crewIdx + 1}
                      </span>
                    </div>

                    {/* Timeline */}
                    <div className="relative flex-1 py-1.5 pr-4">
                      {crewAssignments
                        .sort((a, b) => a.start - b.start)
                        .map((a) => {
                          const left = (a.start / makespan) * 100;
                          const width = (a.duration / makespan) * 100;
                          const isSelected = selectedJobId === a.job_id;

                          return (
                            <button
                              key={`${a.job_id}-${a.stage_id}`}
                              type="button"
                              onClick={() =>
                                setSelectedJobId(
                                  selectedJobId === a.job_id ? null : a.job_id,
                                )
                              }
                              className={`group absolute top-1/2 h-7 -translate-y-1/2 rounded-sm transition-all hover:opacity-80 ${
                                TRADE_COLORS[tradeName] ?? "bg-zinc-500"
                              } ${isSelected ? "z-10 ring-2 ring-white/50" : ""}`}
                              style={{
                                left: `${left}%`,
                                width: `${Math.max(width, 0.8)}%`,
                              }}
                              title={`${jobNames[a.job_id] ?? a.job_id}: ${a.stage_id} (day ${a.start}–${a.end})`}
                            >
                              <span className="block truncate px-1 text-[10px] leading-7 text-white/90">
                                {jobNames[a.job_id] ?? a.job_id}
                              </span>
                            </button>
                          );
                        })}

                      {/* Gap indicators */}
                      {crewIdx === 0 &&
                        gaps.map((gap, i) => {
                          const left = (gap.from / makespan) * 100;
                          const width = (gap.days / makespan) * 100;
                          return (
                            <div
                              key={i}
                              className="absolute top-1/2 h-3 -translate-y-1/2 border border-dashed border-amber-500/30 bg-amber-500/5"
                              style={{ left: `${left}%`, width: `${width}%` }}
                              title={`${gap.days}d gap (day ${gap.from}–${gap.to})`}
                            />
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
      </div>

      {/* Selected job detail mini-panel */}
      {selectedJobId && (
        <JobCrewPanel
          job={data.schedule.find((j) => j.job_id === selectedJobId)!}
          onClose={() => setSelectedJobId(null)}
        />
      )}
    </div>
  );
}

/** Compact panel showing all crews needed for a job. */
function JobCrewPanel({
  job,
  onClose,
}: {
  job: import("@/types").JobSchedule;
  onClose: () => void;
}) {
  if (!job) return null;

  const lastEnd = Math.max(...job.stages.map((s) => s.end));
  const firstStart = Math.min(...job.stages.map((s) => s.start));

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-medium">{job.job_name}</h3>
          <p className="text-xs text-zinc-500">
            {job.stages.length} stages · day {firstStart} → {lastEnd} ·{" "}
            {lastEnd - firstStart}d span
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Close
        </button>
      </div>

      {/* Stage → Crew mapping */}
      <div className="space-y-1">
        {job.stages.map((stage) => (
          <div
            key={stage.id}
            className="flex items-center gap-2 rounded px-2 py-1 text-xs"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${TRADE_COLORS[stage.trade] ?? "bg-zinc-500"}`}
            />
            <span className="w-28 truncate font-medium text-zinc-300">
              {stage.trade}
            </span>
            <span className="text-zinc-600">Crew {stage.crew + 1}</span>
            <span className="ml-auto tabular-nums text-zinc-500">
              Day {stage.start}–{stage.end} ({stage.duration}d)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
