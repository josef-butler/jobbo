import { useCallback, useState } from "react";
import { Hammer } from "lucide-react";
import { useSchedule } from "@/hooks/useSchedule";
import type { JobSchedule, ViewMode } from "@/types";
import { JobList } from "@/components/JobList";
import { GanttChart } from "@/components/GanttChart";
import { JobDetail } from "@/components/JobDetail";
import { TradeLegend } from "@/components/TradeLegend";
import { PrototypeSwitcher } from "@/components/PrototypeSwitcher";
import { VariantTradeSwimlane } from "@/components/VariantTradeSwimlane";
import { VariantJobMatrix } from "@/components/VariantJobMatrix";
import { VariantScenarioPlanner } from "@/components/VariantScenarioPlanner";

const params = new URLSearchParams(window.location.search);
const SHOW_PROTOTYPE = params.has("prototype");
const VARIANT = params.get("variant") ?? "A";

const VARIANTS = [
  { key: "A", label: "Trade Swimlane — who is where & when" },
  { key: "B", label: "Job Matrix — crews per job + utilisation" },
  { key: "C", label: "Scenario Planner — what-if crew changes" },
];

export function App() {
  if (!SHOW_PROTOTYPE) return <Landing />;
  return <Prototype />;
}

/** Blank canvas shown to stakeholders during requirements gathering. */
function Landing() {
  return (
    <div className="flex h-screen items-center">
      <div className="ml-[12.5%] max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
            <Hammer className="h-5 w-5 text-amber-500" />
          </span>
          <span className="font-semibold text-lg tracking-tight text-zinc-500">Jobbo</span>
        </div>
        <p className="text-xl leading-relaxed text-zinc-300">
          A system for tracking and managing construction jobs.
        </p>
      </div>
    </div>
  );
}

/** Full prototype — append ?prototype to the URL to reveal. */
function Prototype() {
  const { data, isLoading, error } = useSchedule();
  const [variant, setVariant] = useState(VARIANT);
  const [view, setView] = useState<ViewMode>("gantt");
  const [selectedJob, setSelectedJob] = useState<JobSchedule | null>(null);

  const handleVariantChange = useCallback((key: string) => {
    setVariant(key);
    const url = new URL(window.location.href);
    url.searchParams.set("variant", key);
    window.history.replaceState({}, "", url);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-400">
        Loading schedule…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center text-red-400">
        Failed to load schedule. Is the solver output at public/output.json?
      </div>
    );
  }

  const isNewVariant = variant === "A" || variant === "B" || variant === "C";

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 pb-24">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            Construction Tracker
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {data.schedule.length} jobs · makespan {data.makespan} days
            {data.optimal ? " · optimal" : " · near-optimal"}
          </p>
        </div>

        {!isNewVariant && (
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
            {(["list", "gantt"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === mode
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {mode === "list" ? "List" : "Timeline"}
              </button>
            ))}
          </div>
        )}
      </header>

      {variant === "A" ? (
        <VariantTradeSwimlane data={data} />
      ) : variant === "B" ? (
        <VariantJobMatrix data={data} />
      ) : variant === "C" ? (
        <VariantScenarioPlanner />
      ) : view === "list" ? (
        <JobList jobs={data.schedule} onSelectJob={setSelectedJob} />
      ) : (
        <GanttChart
          jobs={data.schedule}
          makespan={data.makespan}
          onSelectJob={setSelectedJob}
        />
      )}

      {!isNewVariant && <TradeLegend />}

      {selectedJob && (
        <JobDetail
          job={selectedJob}
          makespan={data.makespan}
          onClose={() => setSelectedJob(null)}
        />
      )}

      <PrototypeSwitcher
        variants={VARIANTS}
        current={variant}
        onChange={handleVariantChange}
      />
    </div>
  );
}
