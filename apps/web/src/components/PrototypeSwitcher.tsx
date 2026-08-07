import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  variants: { key: string; label: string }[];
  current: string;
  onChange: (key: string) => void;
}

export function PrototypeSwitcher({ variants, current, onChange }: Props) {
  const idx = variants.findIndex((v) => v.key === current);
  const prev = variants[(idx - 1 + variants.length) % variants.length];
  const next = variants[(idx + 1) % variants.length];

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      onChange(e.key === "ArrowLeft" ? prev.key : next.key);
    },
    [onChange, prev.key, next.key],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/95 px-3 py-1.5 shadow-lg backdrop-blur-sm">
        <button
          type="button"
          onClick={() => onChange(prev.key)}
          className="rounded-full p-0.5 text-zinc-400 transition-colors hover:text-zinc-200"
          title={`Previous: ${prev.label}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[180px] text-center text-xs text-zinc-300">
          <span className="font-mono text-zinc-500">{current}</span>
          <span className="mx-1.5 text-zinc-600">—</span>
          {variants[idx]?.label}
        </span>
        <button
          type="button"
          onClick={() => onChange(next.key)}
          className="rounded-full p-0.5 text-zinc-400 transition-colors hover:text-zinc-200"
          title={`Next: ${next.label}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
