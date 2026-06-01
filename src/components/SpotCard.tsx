"use client";

import { CATEGORIES, CrowdResult, ItineraryStop, Spot } from "@/types";
import { RerouteSuggestion } from "@/lib/reroute";
import { formatHour } from "@/lib/ui";
import { CrowdBadge } from "./CrowdBadge";

const REPORT_OPTIONS: { label: string; emoji: string; level: 1 | 3 | 5 }[] = [
  { label: "Quiet", emoji: "🟢", level: 1 },
  { label: "Busy", emoji: "🟡", level: 3 },
  { label: "Packed", emoji: "🔴", level: 5 },
];

function categoryMeta(cat: Spot["category"]) {
  return CATEGORIES.find((c) => c.key === cat);
}

export function SpotCard({
  spot,
  stop,
  index,
  crowd,
  suggestion,
  suggestionCrowd,
  onReport,
  onSwap,
}: {
  spot: Spot;
  stop: ItineraryStop;
  index: number;
  crowd: CrowdResult;
  suggestion: RerouteSuggestion | null;
  suggestionCrowd: CrowdResult | null;
  onReport: (spotId: string, level: 1 | 3 | 5) => void;
  onSwap: (stopSpotId: string, alternativeId: string) => void;
}) {
  const cat = categoryMeta(spot.category);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex gap-4 p-5">
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
            {index + 1}
          </div>
          <div className="mt-2 flex-1 border-l-2 border-dashed border-slate-200" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-xs font-medium text-slate-400">
                {formatHour(stop.startHour)} – {formatHour(stop.endHour)}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {cat?.emoji} {spot.name}
              </h3>
            </div>
            <CrowdBadge crowd={crowd} />
          </div>

          <p className="mt-1 text-sm text-slate-500">{spot.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">How crowded is it?</span>
            {REPORT_OPTIONS.map((opt) => (
              <button
                key={opt.level}
                type="button"
                onClick={() => onReport(spot.id, opt.level)}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {suggestion && (
        <div className="border-t border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">↪️</span>
            <div className="flex-1">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">{spot.name}</span> is packed
                right now. Try{" "}
                <span className="font-semibold">
                  {suggestion.alternative.name}
                </span>{" "}
                instead —{" "}
                {suggestion.distanceKm < 1
                  ? "just around the corner"
                  : `${suggestion.distanceKm.toFixed(1)} km away`}
                {suggestionCrowd && (
                  <>
                    {" "}
                    and currently{" "}
                    <span className="font-medium">
                      {suggestionCrowd.band === "low"
                        ? "quiet"
                        : "less busy"}
                    </span>
                  </>
                )}
                .
              </p>
              <button
                type="button"
                onClick={() => onSwap(spot.id, suggestion.alternative.id)}
                className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Swap to {suggestion.alternative.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
