import { useState } from "react";
import type { ScheduleOutput, TradeAssignment } from "@/types";
import { TRADE_COLORS } from "@/types";
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  Users,
  Wrench,
} from "lucide-react";

interface Props {
  data: ScheduleOutput;
}

/** Utilization % for a trade. */
function utilPct(assignments: TradeAssignment[], crews: number, span: number) {
  const days = assignments.reduce((s, a) => s + a.duration, 0);
  return Math.round((days / (crews * span)) * 100);
}

export function VariantJobMatrix({ data }: Props) {
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const makespan = data.makespan;

  // Trade util stats.
  const tradeStats = Object.entries(data.trade_schedule)
    .map(([name, info]) => ({
      name,
      crews: info.crews,
      util: utilPct(info.assignments, info.crews, makespan),
      assignments: info.assignments.length,
    }))
    .sort((a, b) => a.util - b.util);

  const hoveredJob = expandedJobId
    ? data.schedule.find((j) => j.job_id === expandedJobId)
    : hoveredJobId
      ? data.schedule.find((j) => j.job_id === hoveredJobId)
      : null;

  return (
    <div className="flex gap-4">
      {/* Left: Utilization sidebar */}
      <div className="w-56 shrink-0 space-y-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
          <Wrench className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">
            Trade Utilisation
          </span>
        </div>

        {tradeStats.map((t) => (
          <div
            key={t.name}
            className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${TRADE_COLORS[t.name] ?? "bg-zinc-500"}`}
                />
                <span className="text-xs font-medium text-zinc-300">
                  {t.name}
                </span>
              </div>
              <span className="text-[10px] text-zinc-600">
                {t.crews}c
              </span>
            </div>

            {/* Util bar */}
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all ${
                  t.util > 80
                    ? "bg-red-500"
                    : t.util > 60
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(t.util, 100)}%` }}
              />
            </div>

            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span
                className={
                  t.util > 80
                    ? "text-red-400"
                    : t.util > 60
                      ? "text-amber-400"
                      : "text-emerald-400"
                }
              >
                {t.util}%
              </span>
              <span className="text-zinc-600">
                {t.assignments} tasks
              </span>
            </div>

            {t.crews === 1 && t.util > 70 && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400">
                <AlertTriangle className="h-2.5 w-2.5" />
                Single crew bottleneck
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right: Job timeline matrix */}
      <div className="min-w-0 flex-1">
        {/* Header: day scale */}
        <div className="mb-1 ml-44 flex">
          {Array.from({ length: Math.min(makespan, 14) }, (_, i) => {
            const day = Math.floor((i / Math.min(makespan, 14)) * makespan);
            return (
              <div
                key={i}
                className="flex-1 text-[10px] text-zinc-600"
              >
                d{day}
              </div>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-800">
          {data.schedule.map((job) => {
            const jobStart = Math.min(...job.stages.map((s) => s.start));
            const jobEnd = Math.max(...job.stages.map((s) => s.end));
            const isHovered = hoveredJobId === job.job_id;
            const isExpanded = expandedJobId === job.job_id;

            // Find gaps between consecutive stages.
            const sortedStages = [...job.stages].sort(
              (a, b) => a.start - b.start,
            );
            const gaps: { from: number; to: number; days: number }[] = [];
            for (let i = 1; i < sortedStages.length; i++) {
              if (sortedStages[i].start > sortedStages[i - 1].end) {
                gaps.push({
                  from: sortedStages[i - 1].end,
                  to: sortedStages[i].start,
                  days:
                    sortedStages[i].start - sortedStages[i - 1].end,
                });
              }
            }

            return (
              <div key={job.job_id}>
                <div
                  className={`flex border-b border-zinc-800 transition-colors ${
                    isHovered ? "bg-zinc-800/30" : ""
                  }`}
                  onMouseEnter={() => setHoveredJobId(job.job_id)}
                  onMouseLeave={() => setHoveredJobId(null)}
                >
                  {/* Job label */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedJobId(
                        isExpanded ? null : job.job_id,
                      )
                    }
                    className="flex w-44 shrink-0 items-center gap-1.5 border-r border-zinc-800 px-3 py-2 text-left transition-colors hover:bg-zinc-800/50"
                  >
                    <ChevronDown
                      className={`h-3 w-3 text-zinc-600 transition-transform ${
                        isExpanded ? "" : "-rotate-90"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">
                        {job.job_name}
                      </div>
                      <div className="text-[10px] text-zinc-600">
                        d{jobStart}–{jobEnd}
                      </div>
                    </div>
                    {gaps.length > 0 && (
                      <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                    )}
                  </button>

                  {/* Timeline row */}
                  <div className="relative flex-1 py-2 pr-4">
                    {/* Gap indicators */}
                    {gaps.map((gap, i) => {
                      const left = (gap.from / makespan) * 100;
                      const width = (gap.days / makespan) * 100;
                      return (
                        <div
                          key={i}
                          className="absolute top-1/2 h-5 -translate-y-1/2 border border-dashed border-amber-500/30 bg-amber-500/5"
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(width, 0.3)}%`,
                          }}
                          title={`${gap.days}d idle gap (day ${gap.from}–${gap.to})`}
                        />
                      );
                    })}

                    {/* Stage bars */}
                    {job.stages.map((stage) => {
                      const left = (stage.start / makespan) * 100;
                      const width =
                        (stage.duration / makespan) * 100;

                      return (
                        <div
                          key={`${job.job_id}-${stage.id}`}
                          className={`group absolute top-1/2 h-6 -translate-y-1/2 rounded-sm transition-opacity hover:opacity-80 ${
                            TRADE_COLORS[stage.trade] ?? "bg-zinc-500"
                          }`}
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(width, 1)}%`,
                          }}
                          title={`${stage.trade} · Crew ${stage.crew + 1} · Day ${stage.start}–${stage.end} (${stage.duration}d)`}
                        >
                          {/* Crew badge */}
                          {width > 2 && (
                            <span className="block truncate px-1 text-[9px] leading-6 text-white/80">
                              {stage.trade} · C{stage.crew + 1}
                            </span>
                          )}
                          {width <= 2 && width >= 1 && (
                            <span className="block truncate px-0.5 text-[8px] leading-6 text-white/80">
                              C{stage.crew + 1}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {jobEnd - jobStart}d span
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {new Set(job.stages.map((s) => s.trade)).size}{" "}
                        trades
                      </span>
                      {gaps.length > 0 && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          {gaps.length} idle gap
                          {gaps.length > 1 ? "s" : ""} ·{" "}
                          {gaps.reduce((s, g) => s + g.days, 0)}d
                          total
                        </span>
                      )}
                    </div>

                    {/* Crew assignment grid */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.stages.map((stage) => (
                        <span
                          key={stage.id}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] ${
                            TRADE_COLORS[stage.trade]
                              ?.replace("bg-", "bg-")
                              .replace("500", "500/20") ?? "bg-zinc-500/20"
                          } text-zinc-300`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${TRADE_COLORS[stage.trade] ?? "bg-zinc-500"}`}
                          />
                          {stage.trade}
                          <span className="text-zinc-600">
                            C{stage.crew + 1}
                          </span>
                          <span className="text-zinc-500">
                            d{stage.start}–{stage.end}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating detail on hover */}
      {hoveredJob && !expandedJobId && (
        <div className="fixed right-4 bottom-16 z-40 w-64 rounded-lg border border-zinc-700 bg-zinc-900/95 p-3 shadow-lg backdrop-blur-sm">
          <h4 className="text-xs font-medium">{hoveredJob.job_name}</h4>
          <div className="mt-2 flex flex-wrap gap-1">
            {hoveredJob.stages.map((s) => (
              <span
                key={s.id}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${
                  TRADE_COLORS[s.trade]?.replace("500", "500/20") ?? "bg-zinc-500/20"
                } text-zinc-300`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${TRADE_COLORS[s.trade] ?? "bg-zinc-500"}`}
                />
                {s.trade} C{s.crew + 1}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
