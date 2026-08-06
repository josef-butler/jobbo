import { useQuery } from "@tanstack/react-query";
import type { ScheduleOutput } from "@/types";

async function fetchSchedule(): Promise<ScheduleOutput> {
  const res = await fetch("/output.json");
  if (!res.ok) throw new Error(`Failed to load schedule: ${res.status}`);
  return res.json();
}

export function useSchedule() {
  return useQuery({
    queryKey: ["schedule"],
    queryFn: fetchSchedule,
    staleTime: 10_000,
  });
}
