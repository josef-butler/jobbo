export interface Stage {
  id: string;
  trade: string;
  duration: number;
  start: number;
  end: number;
  crew: number;
}

export interface JobSchedule {
  job_id: string;
  job_name: string;
  stages: Stage[];
}

export interface TradeAssignment {
  job_id: string;
  job_name: string;
  stage_id: string;
  duration: number;
  start: number;
  end: number;
  crew: number;
}

export interface TradeScheduleEntry {
  crews: number;
  assignments: TradeAssignment[];
}

export interface ScheduleOutput {
  makespan: number;
  optimal: boolean;
  schedule: JobSchedule[];
  trade_schedule: Record<string, TradeScheduleEntry>;
}

// Keep in sync with the trades in data/input.json.
export const TRADE_COLORS: Record<string, string> = {
  excavator: "bg-amber-500",
  concrete: "bg-stone-400",
  framer: "bg-orange-500",
  plumber: "bg-blue-500",
  electrician: "bg-yellow-500",
  "gib-installer": "bg-purple-500",
  painter: "bg-pink-500",
  "kitchen-installer": "bg-red-500",
  "bathroom-installer": "bg-cyan-500",
  "tiler-floorer": "bg-emerald-500",
};

export const TRADE_COLORS_LIGHT: Record<string, string> = {
  excavator: "bg-amber-100 text-amber-900",
  concrete: "bg-stone-200 text-stone-900",
  framer: "bg-orange-100 text-orange-900",
  plumber: "bg-blue-100 text-blue-900",
  electrician: "bg-yellow-100 text-yellow-900",
  "gib-installer": "bg-purple-100 text-purple-900",
  painter: "bg-pink-100 text-pink-900",
  "kitchen-installer": "bg-red-100 text-red-900",
  "bathroom-installer": "bg-cyan-100 text-cyan-900",
  "tiler-floorer": "bg-emerald-100 text-emerald-900",
};

export type ViewMode = "list" | "gantt";

// Scenario comparison (from solver/compare.py)
export interface TradeUtilSnapshot {
  crews: number;
  util_pct: number;
  tasks: number;
}

export interface ScenarioResult {
  id: string;
  label: string;
  makespan: number;
  optimal: boolean;
  wall_time: number;
  trade_util: Record<string, TradeUtilSnapshot>;
  crew_overrides: Record<string, number>;
}

export interface ComparisonData {
  baseline: ScenarioResult | null;
  scenarios: ScenarioResult[];
}
