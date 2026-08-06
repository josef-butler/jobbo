export interface Stage {
  id: string;
  trade: string;
  duration: number;
  start: number;
  end: number;
}

export interface JobSchedule {
  job_id: string;
  job_name: string;
  stages: Stage[];
}

export interface ScheduleOutput {
  makespan: number;
  optimal: boolean;
  schedule: JobSchedule[];
}

// Keep in sync with the trades in data/input.json.
export const TRADE_COLORS: Record<string, string> = {
  excavator: "bg-amber-500",
  concrete: "bg-stone-400",
  carpenter: "bg-orange-500",
  roofer: "bg-red-500",
  plumber: "bg-blue-500",
  electrician: "bg-yellow-500",
  plasterer: "bg-purple-500",
  painter: "bg-pink-500",
  floorer: "bg-emerald-500",
};

export const TRADE_COLORS_LIGHT: Record<string, string> = {
  excavator: "bg-amber-100 text-amber-900",
  concrete: "bg-stone-200 text-stone-900",
  carpenter: "bg-orange-100 text-orange-900",
  roofer: "bg-red-100 text-red-900",
  plumber: "bg-blue-100 text-blue-900",
  electrician: "bg-yellow-100 text-yellow-900",
  plasterer: "bg-purple-100 text-purple-900",
  painter: "bg-pink-100 text-pink-900",
  floorer: "bg-emerald-100 text-emerald-900",
};

export type ViewMode = "list" | "gantt";
