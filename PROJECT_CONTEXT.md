# CrowdFlow — Project Context Document

> **One-line pitch:** A Philippine-based dynamic itinerary planner that builds you a day plan, watches how crowded each spot is, and automatically reroutes you to a similar, emptier place when somewhere gets packed.

**Document status:** Living document — the single source of truth for what we're building and why.
**Last updated:** 2026-06-01
**Build target:** Functional demo completed in 1 day (~8 focused hours)
**Context:** Capstone / thesis demo project

> ⚠️ **Tech stack is NOT finalized.** The AI provider, backend, and deployment target may all change mid-build. We are building **frontend-first** with mocked data behind a thin, swappable data layer so the UI never depends on any specific backend. Treat all stack entries below as the *current working assumption*, not a commitment.

---

## 1. The Problem

Popular Philippine tourist destinations (Intramuros, SM Mall of Asia, Kawasan Falls, Boracay, etc.) suffer from **overcrowding during peak hours**. Travelers waste time in long queues and crowded sites, which ruins the experience.

Traditional itinerary planners are **static** — they hand you a fixed schedule and never react to real-world conditions. If your 12pm stop is mobbed, the planner doesn't care.

**CrowdFlow** solves this with a **Dynamic Rerouting Engine**: when a spot exceeds a comfort threshold, the app automatically suggests an interest-aligned, less-crowded alternative nearby — giving a smoother, queue-free experience.

---

## 2. The Core Challenge (and Our Honest Answer)

**There is no free, reliable API that reports real-time crowd levels for Philippine tourist spots.**

- Google Maps *displays* "Popular Times" and live busyness, but **does not expose this through any API**. Developers cannot pull it.
- **BestTime.app** (paid 3rd-party) estimates busyness, but its Philippine coverage is weak — most tourist sites return no data.
- Foursquare / Placer.ai foot-traffic data is paid and US/Western-focused.

This data gap is a **real-world limitation**, and our design is the correct engineering response to it. Instead of one unreliable source, CrowdFlow **estimates** crowd levels by blending three free, explainable signals:

```
Crowd Score (0–100) =
      0.6 × time-of-day popularity guess   (the "smart calendar")
    + 0.4 × recent crowdsourced reports     (real people tapping a button)
    × weather modifier                       (OpenWeather — sunny/rain adjustment)
```

This works even with zero users (the time guess always returns a value), gets smarter as people report, and every number can be explained to a thesis panel — no black box.

---

## 3. Scope

### In Scope (the 1-day demo)
- **AI Itinerary Generation** — Claude generates a custom day plan from user interests + available hours + city.
- **Crowd Estimation** — per-spot crowd score from time-of-day + crowdsourced reports + weather.
- **Crowdsourced Reporting** — a "How crowded is it?" button; reports update the score live via realtime.
- **Dynamic Rerouting Engine** — when a spot's score exceeds the threshold, suggest a nearby, interest-matched, less-crowded alternative; user taps "Swap" to update the plan.
- **Map View** — spots shown on a free Leaflet/OpenStreetMap map with color-coded crowd badges.
- **Weather-aware rerouting** — e.g. during rain, reroute from outdoor sites to indoor venues (malls).

### Out of Scope (documented as Future Work)
- ❌ User accounts / login — anonymous `session_id` only
- ❌ Live GPS tracking — browser geolocation is a stretch goal for the last hour
- ❌ Google Places live search — we pre-load a curated spot list instead
- ❌ Real-time crowd APIs (BestTime, etc.) — architecture is designed to plug one in later
- ❌ Payments, bookings, multi-day trips, social features

---

## 4. Limitations (for the thesis paper)

- **Data accuracy** — Crowd levels are *estimates*, not sensor-measured truth. Accuracy improves with more user reports.
- **Spot coverage** — Limited to the ~35 pre-loaded Philippine spots in v1, not every location nationwide.
- **Connectivity** — Requires internet for itinerary generation, weather, and live rerouting.
- **Crowdsource cold-start** — With few users, the estimate leans almost entirely on the time-of-day model.
- **Privacy compliance** — Any future location tracking must respect the PH Data Privacy Act (RA 10173).

---

## 5. Tech Stack (PROVISIONAL — not finalized)

> The AI provider, backend, and deployment may change. Only the **frontend** choices are firm enough to start building against. Everything else is a working assumption.

| Layer | Status | Current assumption | Why / notes |
|-------|--------|--------------------|-------------|
| Frontend framework | 🔒 Firm (to start) | **Vite + React + TypeScript** | Pure frontend, decoupled from backend/deploy — exactly what we want while the stack is open. (Switched away from Next.js, which bundles backend + deploy assumptions.) |
| Styling | 🔒 Firm | **Tailwind CSS** | Fast UI, no design overhead |
| Map | 🔒 Firm | **Leaflet + OpenStreetMap** | Free, no billing, no API key |
| Data source (now) | 🔒 Firm | **Mocked data + thin swappable data layer** | Frontend talks to a `dataService` interface; real backend slots in later with no UI changes |
| AI provider | ❓ Open | Claude API (`claude-sonnet-4-6`) *tentative* | May change — itinerary generation is behind the data layer |
| Backend / DB / Realtime | ❓ Open | Supabase *tentative* | May change — could be Firebase, custom API, etc. |
| Weather | ❓ Open | OpenWeather *tentative* | Free tier; powers the weather modifier when wired up |
| Deployment | ❓ Open | TBD (Vercel / Netlify / other) | Decide near the end |

**Decisions made:**
- ✅ **Frontend-first build** — UI + mocked data now; backend wired in later.
- ✅ **Swappable data layer** — all data access goes through one interface so the backend/AI can change without touching the UI.
- ✅ Skip Google Places API — spots are pre-loaded.
- ✅ OpenWeather as a crowd modifier (when backend is wired).
- ✅ Anonymous sessions — no auth for the demo.

---

## 6. Architecture Overview

```
                ┌─────────────────────────────┐
   User ───────▶│   Next.js UI (React + TW)   │
                │  - Interest/time/city form  │
                │  - Map (Leaflet) + cards    │
                │  - Crowd report button      │
                │  - Swap suggestion banner   │
                └───────────┬─────────────────┘
                            │
        ┌───────────────────┼───────────────────────┐
        ▼                   ▼                         ▼
 /api/itinerary       Supabase (Postgres)      External APIs
 → Claude API         - spots                  - OpenWeather
 → ordered plan       - itineraries              (weather modifier)
                      - crowd_reports
                      - Realtime channel
                        (live density)
                            │
                            ▼
              ┌──────────────────────────────┐
              │   Dynamic Rerouting Engine   │
              │   (pure function)            │
              │  crowdScore(spot, now,       │
              │             reports, weather)│
              │  if score > THRESHOLD:       │
              │    find nearest interest-    │
              │    matched spot with         │
              │    score < THRESHOLD         │
              └──────────────────────────────┘
```

The **Rerouting Engine is a pure function** — testable, deterministic, and independent of any flaky external feed. This is the defensible core of the thesis.

---

## 7. The Crowd Score Model (detailed)

Each spot stores a **base popularity curve**: a simple expected-busyness value (0–100) per hour, per day of week.

**Step 1 — Time guess:** Look up the curve for the current weekday + hour.
**Step 2 — Crowdsource:** Average the crowd reports (level 1–5, scaled to 0–100) from the last ~60 minutes; if none, this term contributes nothing and weights shift to the time guess.
**Step 3 — Weather modifier:**
- ☀️ Sunny + weekend → multiply outdoor-spot score **up**
- 🌧️ Heavy rain → multiply outdoor-spot score **down**, and indoor venues (malls) **up** (everyone moves indoors)

**Final score → color badge:**
- 🟢 0–40 — Chill, go now
- 🟡 41–70 — Filling up
- 🔴 71–100 — Packed → triggers rerouting suggestion

**Threshold (default):** 70. Configurable.

---

## 8. Dynamic Rerouting Engine (logic)

```
for each spot in itinerary:
    score = crowdScore(spot, now, recentReports, weather)
    if score > THRESHOLD:
        candidates = spots where:
            category ∈ user.interests
            AND distance(spot, candidate) < radius
            AND crowdScore(candidate, ...) < THRESHOLD
        suggest top candidate (closest, least crowded)
        → user taps "Swap" → itinerary + map update live
```

---

## 9. Data Model (Supabase)

**`spots`**
| column | type | notes |
|--------|------|-------|
| id | uuid (pk) | |
| name | text | e.g. "Intramuros" |
| category | text | history / food / nature / shopping / etc. |
| lat | float8 | |
| lng | float8 | |
| city | text | Manila, Cebu, etc. |
| is_indoor | bool | drives weather modifier |
| base_popularity_curve | jsonb | `{ "mon": [..24 hourly values..], ... }` |

**`itineraries`**
| column | type | notes |
|--------|------|-------|
| id | uuid (pk) | |
| session_id | text | anonymous, from localStorage |
| interests | text[] | |
| spots | jsonb | ordered list of spot ids + visit times |
| city | text | |
| created_at | timestamptz | |

**`crowd_reports`**
| column | type | notes |
|--------|------|-------|
| id | uuid (pk) | |
| spot_id | uuid (fk → spots) | |
| level | int | 1 (empty) – 5 (packed) |
| created_at | timestamptz | drives realtime + recency weighting |

---

## 10. Pre-loaded Spots (seed data plan)

~35 curated real Philippine tourist spots, hand-tagged with category, lat/lng, city, indoor/outdoor flag, and a base popularity curve. Examples:

| Name | Category | City | Indoor |
|------|----------|------|--------|
| Intramuros | history | Manila | No |
| Fort Santiago | history | Manila | No |
| Rizal Park (Luneta) | nature | Manila | No |
| Binondo (Chinatown) | food | Manila | No |
| National Museum | history | Manila | Yes |
| SM Mall of Asia | shopping | Pasay | Yes |
| BGC High Street | shopping | Taguig | No |
| Magellan's Cross | history | Cebu | No |
| Kawasan Falls | nature | Cebu | No |
| ... (~26 more across Manila, Cebu, and key destinations) | | | |

Curated data guarantees the demo never breaks on a bad API response, and lets us guarantee an overcrowding event fires during the presentation.

---

## 11. Build Timeline (frontend-first)

**Phase A — Frontend with mocked data (current focus):**
| Step | Task |
|------|------|
| A1 | Scaffold Vite + React + TS + Tailwind; project structure |
| A2 | Mock spot data (~35 PH spots) + `dataService` interface (swappable) |
| A3 | Interest + time + city input form |
| A4 | Itinerary cards view |
| A5 | Leaflet + OSM map with markers + color-coded crowd badges |
| A6 | `crowdScore` pure function (time + reports + weather), client-side mock |
| A7 | "Report crowd" button → updates local state → badges react live |
| A8 | Dynamic Rerouting Engine UI: detect → suggest banner → "Swap" updates plan |
| A9 | Polish, empty/loading states, responsive layout |

**Phase B — Wire up backend (after stack is finalized):**
- Replace mock `dataService` with real backend (DB + realtime)
- Connect chosen AI provider for itinerary generation
- Connect weather API for the modifier
- Deploy to chosen host

---

## 12. Demo Script (for the defense)

1. Pick interests (history + food) + 9am–5pm in Manila → AI builds the itinerary.
2. Show the map + crowd badges; Intramuros shows amber.
3. Tap "Report crowded" a few times → badge flips red **live** (shows crowdsourcing + realtime).
4. Engine pops a banner: *"Fort Santiago is packed — visit Casa Manila instead?"*
5. Tap **Swap** → itinerary + map reroute instantly → **the thesis "wow" moment.**
6. (Optional) Show weather effect: rain → recommends indoor mall over outdoor site.

---

## 13. Key Talking Points for the Panel

- **"Real-time crowd APIs don't cover Philippine tourist destinations"** — so CrowdFlow combines a popularity-time model + community reports + weather, and is designed to plug into a paid API (e.g. BestTime) later if coverage improves.
- **The rerouting engine is a pure, deterministic function** — testable and explainable, not a black box.
- **The system degrades gracefully** — works with zero users via the time model, improves with each report.
- **Weather-aware rerouting** — during rain, users are guided from outdoor sites to indoor venues.

---

## 14. Environment / Keys Needed

- `OPENWEATHER_API_KEY` — free signup at openweathermap.org (~2 min)
- `ANTHROPIC_API_KEY` — for Claude itinerary generation
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_ANON_KEY` — from the Supabase project
- (No Google key needed — intentionally omitted.)
