// Core domain types for CrowdFlow.
// These are UI-facing and intentionally backend-agnostic — the dataService
// layer maps whatever real backend we choose into these shapes.

export type Category =
  | "history"
  | "food"
  | "nature"
  | "shopping"
  | "museum"
  | "religious"
  | "entertainment"
  | "beach";

export const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
  { key: "history", label: "History", emoji: "🏛️" },
  { key: "food", label: "Food", emoji: "🍜" },
  { key: "nature", label: "Nature", emoji: "🌳" },
  { key: "shopping", label: "Shopping", emoji: "🛍️" },
  { key: "museum", label: "Museums", emoji: "🖼️" },
  { key: "religious", label: "Religious", emoji: "⛪" },
  { key: "entertainment", label: "Entertainment", emoji: "🎡" },
  { key: "beach", label: "Beach", emoji: "🏖️" },
];

// Day keys ordered to match JavaScript's Date.getDay() (0 = Sunday).
export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

// Expected busyness (0-100) for each hour of each weekday.
export type PopularityCurve = Record<DayKey, number[]>; // each array has 24 entries

export interface Spot {
  id: string;
  name: string;
  category: Category;
  city: string;
  lat: number;
  lng: number;
  isIndoor: boolean;
  description: string;
  /** Expected busyness by weekday/hour — the time-of-day model. */
  popularityCurve: PopularityCurve;
}

export interface CrowdReport {
  id: string;
  spotId: string;
  level: 1 | 2 | 3 | 4 | 5; // 1 = empty, 5 = packed
  createdAt: number; // epoch ms
}

export type WeatherCondition = "clear" | "clouds" | "rain" | "storm";

export interface Weather {
  condition: WeatherCondition;
  tempC: number;
  isDaytime: boolean;
}

export interface ItineraryStop {
  spotId: string;
  startHour: number; // 24h, e.g. 9 = 9am
  endHour: number;
}

export interface Itinerary {
  id: string;
  city: string;
  interests: Category[];
  startHour: number;
  endHour: number;
  stops: ItineraryStop[];
  createdAt: number;
}

// Crowd score bands for color-coding.
export type CrowdBand = "low" | "medium" | "high";

export interface CrowdResult {
  score: number; // 0-100
  band: CrowdBand;
}
