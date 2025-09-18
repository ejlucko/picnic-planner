import React, { useEffect, useMemo, useState } from 'react';
import CalendarGrid from './components/CalendarGrid';
import DetailsPanel from './components/DetailsPanel';
import {
  OpenMeteoClient,
  type DailyForecast,
  type HistoricalStat,
} from './services/weatherClient';

const client = new OpenMeteoClient();

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function App() {
  // Default: NYC (user can change)
  const [lat, setLat] = useState(40.537);
  const [lon, setLon] = useState(-79.94);
  const [days, setDays] = useState<DailyForecast[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [hist, setHist] = useState<HistoricalStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = iso(addDays(new Date(), 1));
  const end = iso(addDays(new Date(), 14));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const f = await client.getDailyForecast(lat, lon, start, end);
        if (!cancelled) setDays(f);
        if (!cancelled) setSelected(f[0]?.date ?? null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load forecast');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lat, lon, start, end]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    (async () => {
      try {
        const h = await client.getHistoricalForDate(lat, lon, selected, 10);
        if (!cancelled) setHist(h);
      } catch {
        if (!cancelled) setHist([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, lat, lon]);

  const selectedDay = useMemo(
    () => days.find((d) => d.date === selected),
    [days, selected]
  );

  return (
    <div className='container'>
      <header>
        <div>
          <div className='title'>🌤️ Weather Picnic Planner</div>
          <div className='subtitle'>
            Pick the perfect picnic day using a 2‑week forecast + 10‑year
            history.
          </div>
        </div>
        <div className='row'>
          <input
            type='number'
            step='0.0001'
            value={lat}
            onChange={(e) => setLat(parseFloat(e.target.value))}
            title='Latitude'
          />
          <input
            type='number'
            step='0.0001'
            value={lon}
            onChange={(e) => setLon(parseFloat(e.target.value))}
            title='Longitude'
          />
        </div>
      </header>

      {error && (
        <div className='panel' style={{ padding: 12, borderColor: '#e67e22' }}>
          ⚠️ {error}
        </div>
      )}
      {loading && (
        <div className='panel' style={{ padding: 12 }}>
          Loading forecast…
        </div>
      )}

      <CalendarGrid days={days} selected={selected} onSelect={setSelected} />
      <DetailsPanel day={selectedDay} historical={hist} />

      <div className='panel footer'>
        Data from{' '}
        <a
          className='link'
          href='https://open-meteo.com/'
          target='_blank'
          rel='noreferrer'
        >
          Open‑Meteo
        </a>
        . Cached in your browser (IndexedDB). Thresholds configurable in{' '}
        <code>src/utils/scoring.ts</code>.
      </div>
    </div>
  );
}
