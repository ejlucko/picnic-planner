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
// Ideal (green): 65–75°F high, ≥50°F low, rain ≤30%, gusts ≤40 mph
// Fair (yellow): 55–85°F high, rain ≤60%, gusts ≤50 mph
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

For the selected day (e.g., `2025-05-20`), the app pulls the **same calendar date** for the previous 10 years from the Open‑Meteo ERA5 archive and aggregates mean and stdev for High/Low/Precip. Responses are cached to avoid repeated calls.

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

## Notes

- SCSS.
- No API keys required for Open‑Meteo.

## Testing ideas (not included)

- Unit test `scoreDay` thresholds.
- Mock `OpenMeteoClient` to test UI without network.
