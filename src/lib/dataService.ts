import { Category, Itinerary, Spot, Weather } from "@/types";
import { CITIES, SPOTS, spotsByCity } from "@/data/spots";

// ---------------------------------------------------------------------------
// Swappable data layer.
//
// The entire UI talks ONLY to this interface. Today it returns mocked data.
// When the backend/AI is finalized, we implement DataService against the real
// backend (DB, AI itinerary endpoint, weather API) and swap the export — with
// zero changes to any component.
// ---------------------------------------------------------------------------

export interface GenerateItineraryInput {
  city: string;
  interests: Category[];
  startHour: number;
  endHour: number;
}

export interface DataService {
  listCities(): Promise<string[]>;
  getSpots(city: string): Promise<Spot[]>;
  generateItinerary(input: GenerateItineraryInput): Promise<Itinerary>;
  getWeather(city: string): Promise<Weather>;
}

// Average hours we budget per stop when slicing up the available time.
const HOURS_PER_STOP = 2;

function pickSpotsForItinerary(
  city: string,
  interests: Category[],
  maxStops: number
): Spot[] {
  const pool = spotsByCity(city);

  // Spots matching the user's interests come first, ordered to interleave
  // categories for variety; everything else is a fallback.
  const matching = pool.filter((s) => interests.includes(s.category));
  const rest = pool.filter((s) => !interests.includes(s.category));

  const ordered = interleaveByCategory(matching, interests);
  const chosen = [...ordered, ...rest].slice(0, maxStops);
  return chosen;
}

// Round-robins through the interest categories so the day isn't, e.g., five
// museums in a row.
function interleaveByCategory(spots: Spot[], interests: Category[]): Spot[] {
  const buckets = new Map<Category, Spot[]>();
  for (const cat of interests) buckets.set(cat, []);
  for (const s of spots) buckets.get(s.category)?.push(s);

  const result: Spot[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const cat of interests) {
      const bucket = buckets.get(cat);
      if (bucket && bucket.length > 0) {
        result.push(bucket.shift()!);
        added = true;
      }
    }
  }
  return result;
}

class MockDataService implements DataService {
  async listCities(): Promise<string[]> {
    return CITIES;
  }

  async getSpots(city: string): Promise<Spot[]> {
    return spotsByCity(city);
  }

  async generateItinerary(
    input: GenerateItineraryInput
  ): Promise<Itinerary> {
    const { city, interests, startHour, endHour } = input;
    const available = Math.max(0, endHour - startHour);
    const maxStops = Math.max(1, Math.floor(available / HOURS_PER_STOP));

    const spots = pickSpotsForItinerary(city, interests, maxStops);

    const stops = spots.map((s, i) => ({
      spotId: s.id,
      startHour: startHour + i * HOURS_PER_STOP,
      endHour: startHour + (i + 1) * HOURS_PER_STOP,
    }));

    // Simulate the latency of a real AI/backend call so loading states are
    // exercised during development.
    await delay(500);

    return {
      id: `itin_${Date.now()}`,
      city,
      interests,
      startHour,
      endHour,
      stops,
      createdAt: Date.now(),
    };
  }

  async getWeather(_city: string): Promise<Weather> {
    // Mocked: a typical sunny PH afternoon. Swap for a real weather API later.
    void _city;
    await delay(200);
    return { condition: "clear", tempC: 32, isDaytime: true };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The single instance the app imports. Replace this line to swap backends.
export const dataService: DataService = new MockDataService();

// Re-export so callers don't need a second import for the full spot catalog.
export { SPOTS };
