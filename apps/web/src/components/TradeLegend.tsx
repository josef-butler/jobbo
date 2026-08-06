import { TRADE_COLORS } from "@/types";

export function TradeLegend() {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {Object.entries(TRADE_COLORS).map(([trade, color]) => (
        <div key={trade} className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`} />
          {trade}
        </div>
      ))}
    </div>
  );
}
