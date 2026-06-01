import { CrowdResult } from "@/types";
import { BAND_META } from "@/lib/ui";

export function CrowdBadge({
  crowd,
  showScore = true,
}: {
  crowd: CrowdResult;
  showScore?: boolean;
}) {
  const meta = BAND_META[crowd.band];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.chip}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
      {showScore && <span className="opacity-60">· {crowd.score}</span>}
    </span>
  );
}
