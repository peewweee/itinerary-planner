import {
  CrowdBand,
  CrowdReport,
  CrowdResult,
  DAY_KEYS,
  Spot,
  Weather,
} from "@/types";

// Score above which a spot is considered overcrowded and triggers rerouting.
export const CROWD_THRESHOLD = 70;

// How recent a crowd report must be to count (ms). 60 minutes.
const REPORT_WINDOW_MS = 60 * 60 * 1000;

// Weight split when live reports exist: 60% time model, 40% crowdsource.
const TIME_WEIGHT = 0.6;
const REPORT_WEIGHT = 0.4;

function bandFor(score: number): CrowdBand {
  if (score <= 40) return "low";
  if (score <= CROWD_THRESHOLD) return "medium";
  return "high";
}

// Maps a 1-5 report level to a 0-100 scale.
function levelToScore(level: number): number {
  return ((level - 1) / 4) * 100;
}

// Weather acts as a multiplier on the base estimate. Rain pushes people off
// outdoor sites and into malls; clear skies pull crowds back outdoors.
function weatherModifier(isIndoor: boolean, weather?: Weather): number {
  if (!weather) return 1;
  switch (weather.condition) {
    case "storm":
      return isIndoor ? 1.25 : 0.45;
    case "rain":
      return isIndoor ? 1.2 : 0.6;
    case "clear":
      return isIndoor ? 0.95 : 1.1;
    case "clouds":
    default:
      return 1;
  }
}

export interface CrowdInputs {
  hour: number; // 0-23
  dayIndex: number; // 0 = Sunday (matches Date.getDay())
  reports?: CrowdReport[]; // all reports for this spot
  weather?: Weather;
  now?: number; // epoch ms, for report recency; defaults to Date.now()
}

/**
 * The core crowd-estimation function. Pure and deterministic given its inputs
 * — this is the defensible heart of CrowdFlow.
 *
 *   score = (time-of-day model blended with recent reports) x weather modifier
 */
export function crowdScore(spot: Spot, inputs: CrowdInputs): CrowdResult {
  const { hour, dayIndex, reports = [], weather } = inputs;
  const now = inputs.now ?? Date.now();

  const dayKey = DAY_KEYS[dayIndex];
  const timeScore = spot.popularityCurve[dayKey]?.[hour] ?? 0;

  const recent = reports.filter(
    (r) => r.spotId === spot.id && now - r.createdAt <= REPORT_WINDOW_MS
  );

  let base: number;
  if (recent.length > 0) {
    const avgLevel =
      recent.reduce((sum, r) => sum + r.level, 0) / recent.length;
    const reportScore = levelToScore(avgLevel);
    base = TIME_WEIGHT * timeScore + REPORT_WEIGHT * reportScore;
  } else {
    base = timeScore;
  }

  const score = Math.max(
    0,
    Math.min(100, Math.round(base * weatherModifier(spot.isIndoor, weather)))
  );

  return { score, band: bandFor(score) };
}

// Haversine distance in km — used by the rerouting engine to find nearby
// alternatives.
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
