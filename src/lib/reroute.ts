import { Category, CrowdResult, Spot } from "@/types";
import { CROWD_THRESHOLD, distanceKm } from "./crowd";

export interface RerouteParams {
  /** The overcrowded spot we want to replace. */
  spot: Spot;
  /** All spots available in the same city. */
  candidates: Spot[];
  /** Spot ids already in the itinerary (so we don't suggest a duplicate). */
  itinerarySpotIds: string[];
  /** The user's selected interests. */
  interests: Category[];
  /** Resolves a crowd result for any candidate spot at the relevant time. */
  scoreOf: (spot: Spot) => CrowdResult;
  /** Max distance (km) for an alternative to count as "nearby". */
  radiusKm?: number;
}

export interface RerouteSuggestion {
  alternative: Spot;
  distanceKm: number;
  fromScore: number;
  toScore: number;
}

/**
 * The Dynamic Rerouting Engine.
 *
 * Given an overcrowded spot, finds the best nearby, interest-aligned
 * alternative that is currently below the crowd threshold. Pure function —
 * deterministic given its inputs, so it's easy to test and to explain.
 */
export function findAlternative(
  params: RerouteParams
): RerouteSuggestion | null {
  const { spot, candidates, itinerarySpotIds, interests, scoreOf } = params;
  const radiusKm = params.radiusKm ?? 20;

  const fromScore = scoreOf(spot).score;

  const ranked = candidates
    .filter((c) => c.id !== spot.id)
    .filter((c) => !itinerarySpotIds.includes(c.id))
    .filter(
      (c) => c.category === spot.category || interests.includes(c.category)
    )
    .map((c) => ({
      spot: c,
      dist: distanceKm(spot, c),
      score: scoreOf(c).score,
    }))
    .filter((c) => c.dist <= radiusKm)
    .filter((c) => c.score < CROWD_THRESHOLD)
    .sort((a, b) => {
      // Prefer a same-category swap (true like-for-like), then less crowded,
      // then closer.
      const aSame = a.spot.category === spot.category ? 0 : 1;
      const bSame = b.spot.category === spot.category ? 0 : 1;
      if (aSame !== bSame) return aSame - bSame;
      if (a.score !== b.score) return a.score - b.score;
      return a.dist - b.dist;
    });

  const best = ranked[0];
  if (!best) return null;

  return {
    alternative: best.spot,
    distanceKm: best.dist,
    fromScore,
    toScore: best.score,
  };
}
