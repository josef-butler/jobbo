import { useQuery } from "@tanstack/react-query";
import type { ComparisonData, ScenarioResult } from "@/types";
import { TRADE_COLORS } from "@/types";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckCircle,
  Clock,
  TrendingDown,
  Zap,
} from "lucide-react";

async function fetchComparison(): Promise<ComparisonData> {
  const res = await fetch("/comparison.json");
  if (!res.ok) throw new Error(`Failed to load comparison: ${res.status}`);
  return res.json();
}

export function VariantScenarioPlanner() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["comparison"],
    queryFn: fetchComparison,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-400">
        Loading scenario data…
      </div>
    );
  }

  if (error || !data || !data.baseline) {
    return (
      <div className="flex h-64 items-center justify-center text-red-400">
        Comparison data not found. Run <code className="mx-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs">python solver/compare.py</code>
        first.
      </div>
    );
  }

  return <ScenarioView data={data} />;
}

function ScenarioView({ data }: { data: ComparisonData }) {
  const baseline = data.baseline!;

  return (
    <div className="space-y-8">
      {/* Header: makespan comparison row */}
      <MakespanComparison baseline={baseline} scenarios={data.scenarios} />

      {/* Scenario cards grid */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
          <Zap className="h-3.5 w-3.5" />
          What-if scenarios
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.scenarios.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              baseline={baseline}
              isBaseline={s.id === "baseline"}
            />
          ))}
        </div>
      </div>

      {/* Trade bottleneck deep-dive */}
      <BottleneckDeepDive baseline={baseline} scenarios={data.scenarios} />
    </div>
  );
}

/** Horizontal bar chart showing makespan across scenarios. */
function MakespanComparison({
  baseline,
  scenarios,
}: {
  baseline: ScenarioResult;
  scenarios: ScenarioResult[];
}) {
  const maxMakespan = Math.max(...scenarios.map((s) => s.makespan));

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-4 text-sm font-medium text-zinc-400">
        Makespan comparison
      </h2>
      <div className="space-y-2">
        {scenarios.map((s) => {
          const pct = (s.makespan / maxMakespan) * 100;
          const delta = s.makespan - baseline.makespan;
          const isBaseline = s.id === "baseline";
          const isBetter = delta < 0;
          const isWorse = delta > 0;

          return (
            <div key={s.id} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-56 shrink-0 text-right">
                <div
                  className={`text-xs font-medium ${isBaseline ? "text-zinc-200" : "text-zinc-400"}`}
                >
                  {s.label}
                </div>
                {!isBaseline && (
                  <div
                    className={`text-[10px] ${isBetter ? "text-emerald-400" : isWorse ? "text-red-400" : "text-zinc-500"}`}
                  >
                    {isBetter
                      ? `−${Math.abs(delta)}d faster`
                      : isWorse
                        ? `+${delta}d slower`
                        : "no change"}
                  </div>
                )}
              </div>

              {/* Bar */}
              <div className="flex flex-1 items-center gap-2">
                <div className="h-5 flex-1 rounded-sm bg-zinc-800">
                  <div
                    className={`h-full rounded-sm transition-all ${
                      isBaseline
                        ? "bg-zinc-500"
                        : isBetter
                          ? "bg-emerald-500"
                          : isWorse
                            ? "bg-red-500"
                            : "bg-zinc-600"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs tabular-nums text-zinc-300">
                  {s.makespan}d
                  {s.optimal && (
                    <CheckCircle className="ml-1 inline h-3 w-3 text-emerald-400" />
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Single scenario card showing trade util and crew changes. */
function ScenarioCard({
  scenario,
  baseline,
  isBaseline,
}: {
  scenario: ScenarioResult;
  baseline: ScenarioResult;
  isBaseline: boolean;
}) {
  const delta = scenario.makespan - baseline.makespan;
  const resolvedBottlenecks = Object.entries(scenario.trade_util)
    .filter(([name, u]) => {
      const base = baseline.trade_util[name];
      return base && base.crews === 1 && u.crews > 1;
    })
    .map(([name]) => name);

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isBaseline
          ? "border-zinc-300 bg-zinc-800/30"
          : delta < 0
            ? "border-emerald-500/30 bg-emerald-500/5"
            : delta > 0
              ? "border-red-500/20 bg-red-500/5"
              : "border-zinc-800 bg-zinc-900/30"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <h3 className="text-xs font-medium text-zinc-300">{scenario.label}</h3>
        {isBaseline && (
          <span className="rounded bg-zinc-600 px-1.5 py-0.5 text-[10px] text-zinc-300">
            Baseline
          </span>
        )}
      </div>

      {/* Makespan */}
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">
          {scenario.makespan}
        </span>
        <span className="text-sm text-zinc-500">days</span>
        {!isBaseline && (
          <span
            className={`ml-auto text-xs font-medium tabular-nums ${
              delta < 0
                ? "text-emerald-400"
                : delta > 0
                  ? "text-red-400"
                  : "text-zinc-500"
            }`}
          >
            {delta < 0 ? `−${Math.abs(delta)}d` : delta > 0 ? `+${delta}d` : "—"}
          </span>
        )}
      </div>

      {/* Optimal badge */}
      {scenario.optimal && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
          <CheckCircle className="h-3 w-3" />
          Proven optimal
        </div>
      )}

      {/* Crew changes */}
      {Object.keys(scenario.crew_overrides).length > 0 && (
        <div className="mt-3 space-y-1">
          <div className="text-[10px] text-zinc-600">Crew changes</div>
          {Object.entries(scenario.crew_overrides).map(([trade, crews]) => {
            const base = baseline.trade_util[trade];
            const was = base?.crews ?? "?";
            return (
              <div
                key={trade}
                className="flex items-center gap-1.5 text-[10px]"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${TRADE_COLORS[trade] ?? "bg-zinc-500"}`}
                />
                <span className="text-zinc-400">{trade}</span>
                <span className="text-zinc-600">{was}</span>
                <ArrowRight className="h-2.5 w-2.5 text-zinc-600" />
                <span className="font-medium text-emerald-400">{crews}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolved bottlenecks */}
      {resolvedBottlenecks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {resolvedBottlenecks.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400"
            >
              <CheckCircle className="h-2.5 w-2.5" />
              {name} no longer bottleneck
            </span>
          ))}
        </div>
      )}

      {/* Solve time */}
      <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-600">
        <Clock className="h-2.5 w-2.5" />
        Solved in {scenario.wall_time}s
      </div>
    </div>
  );
}

/** Deep-dive: which trades are bottlenecks, and how scenarios change them. */
function BottleneckDeepDive({
  baseline,
  scenarios,
}: {
  baseline: ScenarioResult;
  scenarios: ScenarioResult[];
}) {
  // Find the best scenario for the "ideal" comparison.
  const best = scenarios.reduce((best, s) =>
    s.makespan < best.makespan ? s : best,
  );

  // Trades sorted by baseline utilization descending.
  const tradeEntries = Object.entries(baseline.trade_util).sort(
    ([, a], [, b]) => b.util_pct - a.util_pct,
  );

  // Identify single-crew trades in baseline.
  const singleCrewTrades = tradeEntries
    .filter(([, u]) => u.crews === 1)
    .map(([name]) => name);

  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-medium text-zinc-300">
          Bottleneck Analysis
        </h2>
      </div>

      {/* Key insight */}
      <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
        <p className="text-xs text-amber-300">
          <strong>Key finding:</strong> Adding a concrete crew alone does
          nothing. The excavator (single crew) blocks the front of the pipeline
          — every job queues behind it. Doubling all 4 single-crew trades
          (excavator, concrete, kitchen-installer, bathroom-installer) saves{" "}
          {baseline.makespan - best.makespan} day
          {baseline.makespan - best.makespan > 1 ? "s" : ""} and lets the
          solver prove optimality.
        </p>
      </div>

      {/* Trade utilization table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-3 py-2 text-left font-medium text-zinc-500">
                Trade
              </th>
              <th className="px-3 py-2 text-center font-medium text-zinc-500">
                Baseline crews
              </th>
              <th className="px-3 py-2 text-center font-medium text-zinc-500">
                Baseline util
              </th>
              <th className="px-3 py-2 text-center font-medium text-zinc-500">
                Best util
              </th>
              <th className="px-3 py-2 text-left font-medium text-zinc-500">
                Assessment
              </th>
            </tr>
          </thead>
          <tbody>
            {tradeEntries.map(([name, baseUtil]) => {
              const isSingleCrew = baseUtil.crews === 1;
              const bestUtil = best.trade_util[name];
              const utilDelta = bestUtil
                ? bestUtil.util_pct - baseUtil.util_pct
                : 0;
              const isHighUtil = baseUtil.util_pct > 70;

              return (
                <tr
                  key={name}
                  className="border-b border-zinc-800/50 last:border-b-0"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${TRADE_COLORS[name] ?? "bg-zinc-500"}`}
                      />
                      <span className="text-zinc-300">{name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums text-zinc-400">
                    {baseUtil.crews}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <UtilBadge
                      pct={baseUtil.util_pct}
                      isHigh={isHighUtil}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {bestUtil ? (
                      <UtilBadge
                        pct={bestUtil.util_pct}
                        isHigh={bestUtil.util_pct > 70}
                      />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                    {bestUtil && bestUtil.crews > baseUtil.crews && (
                      <ArrowDown className="ml-1 inline h-2.5 w-2.5 text-emerald-400" />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isSingleCrew && isHighUtil ? (
                      <span className="flex items-center gap-1 text-amber-400">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Bottleneck
                      </span>
                    ) : isSingleCrew ? (
                      <span className="flex items-center gap-1 text-amber-400/60">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Single crew
                      </span>
                    ) : (
                      <span className="text-zinc-600">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recommendation */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
        <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <div>
          <p className="text-xs font-medium text-emerald-300">
            Recommended action
          </p>
          <p className="mt-0.5 text-xs text-emerald-400/80">
            The excavator is the dominant bottleneck. Adding a second excavator
            crew is the single most impactful change. Pair it with a second
            concrete crew to unlock the front of the pipeline. The finish-trade
            bottlenecks (kitchen/bathroom) matter less because they sit at the
            end of the schedule and don't cascade.
          </p>
        </div>
      </div>
    </div>
  );
}

function UtilBadge({ pct, isHigh }: { pct: number; isHigh: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
        isHigh
          ? "bg-red-500/10 text-red-400"
          : pct > 50
            ? "bg-amber-500/10 text-amber-400"
            : "bg-emerald-500/10 text-emerald-400"
      }`}
    >
      {pct}%
    </span>
  );
}
