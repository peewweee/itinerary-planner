import { CrowdResult } from "@/types";
import { BAND_META } from "@/lib/ui";

export function CrowdBadge({
  crowd,
  showScore = true,
  showInfo = false,
}: {
  crowd: CrowdResult;
  showScore?: boolean;
  showInfo?: boolean;
}) {
  const meta = BAND_META[crowd.band];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.chip}`}
      >
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
        {meta.label}
        {showScore && <span className="opacity-60">· {crowd.score}</span>}
      </span>
      {showInfo && <CrowdScoreInfo />}
    </span>
  );
}

// Small "i" affordance that reveals a tooltip explaining the crowd score.
// Pure CSS (hover + focus), so it works inside server components.
function CrowdScoreInfo() {
  return (
    <span className="group/info relative inline-flex">
      <span
        tabIndex={0}
        role="button"
        aria-label="What does the crowd score mean?"
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold leading-none text-slate-400 transition hover:border-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        i
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-6 z-20 w-60 rounded-lg bg-slate-900 p-3 text-left text-[11px] font-normal leading-relaxed text-slate-100 opacity-0 shadow-xl transition-opacity duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100"
      >
        <span className="mb-1 block text-xs font-semibold text-white">
          Crowd score · 0–100
        </span>
        How busy we expect this spot to be at your visit time. Higher = more
        crowded.
        <span className="mt-1.5 block">
          🟢 0–40 quiet · 🟡 41–70 filling up · 🔴 71+ packed
        </span>
        <span className="mt-1.5 block text-slate-300">
          Based on time-of-day patterns, your live reports &amp; the weather.
        </span>
      </span>
    </span>
  );
}
