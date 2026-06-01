"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  CrowdReport,
  CrowdResult,
  Itinerary,
  Spot,
  Weather,
} from "@/types";
import { dataService, GenerateItineraryInput } from "@/lib/dataService";
import { crowdScore } from "@/lib/crowd";
import { findAlternative, RerouteSuggestion } from "@/lib/reroute";
import { ItineraryForm } from "@/components/ItineraryForm";
import { SpotCard } from "@/components/SpotCard";
import { WeatherBar } from "@/components/WeatherBar";
import type { MapMarker } from "@/components/MapView";

// Leaflet can't render on the server — load the map client-side only.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      Loading map…
    </div>
  ),
});

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [dayIndex, setDayIndex] = useState(1); // Mon fallback for SSR
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [spotMap, setSpotMap] = useState<Map<string, Spot>>(new Map());
  const [citySpots, setCitySpots] = useState<Spot[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [reports, setReports] = useState<CrowdReport[]>([]);

  useEffect(() => {
    setMounted(true);
    setDayIndex(new Date().getDay());
    dataService.listCities().then(setCities);
  }, []);

  const handleGenerate = useCallback(
    async (input: GenerateItineraryInput) => {
      setLoading(true);
      try {
        const [itin, wx, spots] = await Promise.all([
          dataService.generateItinerary(input),
          dataService.getWeather(input.city),
          dataService.getSpots(input.city),
        ]);
        setItinerary(itin);
        setWeather(wx);
        setCitySpots(spots);
        setSpotMap(new Map(spots.map((s) => [s.id, s])));
        setReports([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleReport = useCallback(
    (spotId: string, level: 1 | 3 | 5) => {
      setReports((prev) => [
        ...prev,
        {
          id: `${spotId}_${Date.now()}_${prev.length}`,
          spotId,
          level,
          createdAt: Date.now(),
        },
      ]);
    },
    []
  );

  const handleSwap = useCallback(
    (stopSpotId: string, alternativeId: string) => {
      setItinerary((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stops: prev.stops.map((s) =>
            s.spotId === stopSpotId ? { ...s, spotId: alternativeId } : s
          ),
        };
      });
    },
    []
  );

  // Crowd score for a spot at a given visit hour, using current reports/weather.
  const scoreAt = useCallback(
    (spot: Spot, hour: number): CrowdResult =>
      crowdScore(spot, {
        hour,
        dayIndex,
        reports,
        weather: weather ?? undefined,
      }),
    [dayIndex, reports, weather]
  );

  // Build per-stop view models: the spot, its crowd, and a reroute suggestion
  // if it's overcrowded.
  const rows = useMemo(() => {
    if (!itinerary) return [];
    return itinerary.stops.map((stop) => {
      const spot = spotMap.get(stop.spotId);
      if (!spot) return null;
      const crowd = scoreAt(spot, stop.startHour);

      let suggestion: RerouteSuggestion | null = null;
      let suggestionCrowd: CrowdResult | null = null;
      if (crowd.band === "high") {
        suggestion = findAlternative({
          spot,
          candidates: citySpots,
          itinerarySpotIds: itinerary.stops.map((s) => s.spotId),
          interests: itinerary.interests,
          scoreOf: (s) => scoreAt(s, stop.startHour),
        });
        if (suggestion) {
          suggestionCrowd = scoreAt(suggestion.alternative, stop.startHour);
        }
      }
      return { stop, spot, crowd, suggestion, suggestionCrowd };
    });
  }, [itinerary, spotMap, citySpots, scoreAt]);

  const markers: MapMarker[] = useMemo(
    () =>
      rows
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map((r, i) => ({ spot: r.spot, crowd: r.crowd, order: i + 1 })),
    [rows]
  );

  const crowdedCount = rows.filter((r) => r?.crowd.band === "high").length;

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-400">
        Loading CrowdFlow…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧭</span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">CrowdFlow</h1>
              <p className="text-xs text-slate-500">
                Dynamic, crowd-aware itineraries for the Philippines
              </p>
            </div>
          </div>
          {itinerary && (
            <button
              onClick={() => setItinerary(null)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Plan another day
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {!itinerary ? (
          <div className="mx-auto max-w-xl">
            <h2 className="mb-1 text-2xl font-bold text-slate-900">
              Plan a queue-free day
            </h2>
            <p className="mb-6 text-slate-500">
              Tell us what you like and we&apos;ll build a route that steers you
              around the crowds.
            </p>
            <ItineraryForm
              cities={cities}
              loading={loading}
              onGenerate={handleGenerate}
            />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,42%)]">
            {/* Itinerary column */}
            <div className="space-y-4">
              {weather && <WeatherBar weather={weather} />}

              {crowdedCount > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  ⚠️ {crowdedCount} stop{crowdedCount > 1 ? "s" : ""} on your
                  route {crowdedCount > 1 ? "are" : "is"} packed. See the
                  suggested swaps below.
                </div>
              )}

              {rows.map((r) =>
                r ? (
                  <SpotCard
                    key={r.stop.spotId}
                    spot={r.spot}
                    stop={r.stop}
                    index={markers.findIndex((m) => m.spot.id === r.spot.id)}
                    crowd={r.crowd}
                    suggestion={r.suggestion}
                    suggestionCrowd={r.suggestionCrowd}
                    onReport={handleReport}
                    onSwap={handleSwap}
                  />
                ) : null
              )}
            </div>

            {/* Map column */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <MapView markers={markers} />
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">
                Tap a pin for crowd details · 🟢 quiet 🟡 filling up 🔴 packed
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
