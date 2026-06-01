import { NextRequest, NextResponse } from "next/server";
import { spotsByCity } from "@/data/spots";
import { Category } from "@/types";

export const runtime = "nodejs";

interface RequestBody {
  city: string;
  interests: Category[];
  startHour: number;
  endHour: number;
  stops: number; // desired number of stops
}

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Calls Gemini to choose and order an itinerary from the candidate spots.
// Returns an ordered array of spot ids, or null on any failure so the client
// can fall back to the offline generator.
async function generateWithGemini(body: RequestBody): Promise<string[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const candidates = spotsByCity(body.city);
  if (candidates.length === 0) return null;

  const list = candidates
    .map(
      (s) => `- ${s.id} | ${s.name} (${s.category}): ${s.description}`
    )
    .join("\n");

  const prompt = `You are a travel planner for the Philippines.
Build a ${body.stops}-stop day itinerary in ${body.city} for a traveler whose
interests are: ${body.interests.join(", ")}. The day runs from ${body.startHour}:00
to ${body.endHour}:00.

Choose ONLY from these candidate spots (use the exact id):
${list}

Rules:
- Pick exactly ${body.stops} spots (or fewer only if there aren't enough good matches).
- Prefer spots that match the traveler's interests.
- Vary the experience; avoid repeating the same category back-to-back when possible.
- Order them as a sensible visiting sequence for one day.
Return the chosen spots in visiting order.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      // Gemini's REST API expects UPPERCASE OpenAPI type names.
      responseSchema: {
        type: "OBJECT",
        properties: {
          stops: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                spotId: { type: "STRING" },
                reason: { type: "STRING" },
              },
              required: ["spotId"],
            },
          },
        },
        required: ["stops"],
      },
    },
  });

  const text = await callGeminiWithRetry(url, requestBody);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as { stops?: { spotId: string }[] };
    const validIds = new Set(candidates.map((c) => c.id));
    const ordered = (parsed.stops ?? [])
      .map((s) => s.spotId)
      .filter((id) => validIds.has(id));

    // De-duplicate while preserving order.
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const id of ordered) {
      if (!seen.has(id)) {
        seen.add(id);
        unique.push(id);
      }
    }

    return unique.length > 0 ? unique : null;
  } catch (err) {
    console.error("Failed to parse Gemini response:", err);
    return null;
  }
}

// Transient statuses worth retrying: rate limit and "model overloaded".
const RETRYABLE = new Set([429, 503]);

// Calls Gemini, retrying transient errors with a short backoff. Returns the
// raw model text, or null after exhausting retries.
async function callGeminiWithRetry(
  url: string,
  body: string,
  attempts = 3
): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body,
      });

      if (res.ok) {
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      }

      const errText = await res.text();
      console.error(`Gemini error (attempt ${i + 1}):`, res.status, errText);
      if (!RETRYABLE.has(res.status) || i === attempts - 1) return null;
    } catch (err) {
      console.error(`Gemini request failed (attempt ${i + 1}):`, err);
      if (i === attempts - 1) return null;
    } finally {
      clearTimeout(timeout);
    }
    // Backoff: 0.8s, 1.6s, ...
    await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const spotIds = await generateWithGemini(body);

  // `source` lets the client know whether real AI was used (handy for debugging
  // and for an honest "AI-powered" indicator in the UI).
  if (!spotIds) {
    return NextResponse.json({ spotIds: null, source: "fallback" });
  }
  return NextResponse.json({ spotIds, source: "gemini" });
}
