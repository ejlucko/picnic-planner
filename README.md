
# 🌤️ Weather Picnic Planner

A compact React + TypeScript app that helps pick the best picnic day using a 2‑week forecast and 10‑year historical stats (Open‑Meteo).

## Features
- **Interactive 2‑week calendar** with color‑coded picnic suitability (green / yellow / red).
- **Details panel** showing forecast metrics and 10‑year historical averages & variability for the selected date.
- **Local caching** via IndexedDB with TTL to minimize API calls.
- **API abstraction layer** (`WeatherProvider` interface) with an **Open‑Meteo** implementation. Swap providers easily.
- Basic **location controls** (lat/lon).

## Suitability Criteria
Defined in [`src/utils/scoring.ts`](src/utils/scoring.ts) — tweak thresholds as needed:
```ts
// Ideal (green): 18–28°C high, ≥10°C low, rain ≤20%, gusts ≤7 m/s
// Fair (yellow): 12–32°C high, rain ≤40%, gusts ≤10 m/s
// Otherwise: Poor (red)
```

## Caching Strategy
- **Forecast**: cached for 30 minutes (keyed by lat, lon, start, end).
- **Historical**: cached for 30 days (keyed by lat, lon, date, window).
- Storage: **IndexedDB** (`picnic-cache-v1/kv`) with **TTL** per entry and automatic invalidation on read.

## Architecture
- `src/services/weatherClient.ts`: `WeatherProvider` interface + `OpenMeteoClient` implementation for **forecast** and **ERA5 archive**.
- `src/utils/scoring.ts`: pure scoring logic; tested independently or swapped per user prefs.
- `src/components/*`: UI components (`CalendarGrid`, `DetailsPanel`).

## How historical works
For the selected day (e.g., `2025-05-20`), the app pulls the **same calendar date** for the previous 10 years from the Open‑Meteo ERA5 archive and aggregates mean and stdev for High/Low/Precip. Responses are cached to avoid repeated calls. In production you might batch by year ranges or offload to a backend for rate limiting.

## Run locally
```bash
pnpm i   # or npm i / yarn
pnpm dev # or npm run dev
```
Then open the printed Local URL (default: http://localhost:5173).

## Build
```bash
pnpm build
pnpm preview
```

## Notes / Trade‑offs
- Kept dependencies minimal for fast spin‑up. No design systems; minimal CSS.
- No API keys required for Open‑Meteo.
- If you prefer charts, add a small chart lib (Recharts) and plot historical distribution.
- Extensibility: implement another class compatible with `WeatherProvider` and wire it up in `App.tsx`.

## Testing ideas (not included)
- Unit test `scoreDay` thresholds.
- Mock `OpenMeteoClient` to test UI without network.
- Validate caching TTL & invalidation.
