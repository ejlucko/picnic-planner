import { getCache, setCache, key } from './cache';

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  tMax: number;
  tMin: number;
  precipProb: number; // %
  precipSum: number; // mm
  windMax: number; // m/s (from daily wind_gusts_10m_max if available, fallback to 10m windspeed)
}

export interface HistoricalStat {
  year: number;
  tMax?: number;
  tMin?: number;
  precipSum?: number;
}

export interface WeatherProvider {
  getDailyForecast(
    lat: number,
    lon: number,
    start: string,
    end: string
  ): Promise<DailyForecast[]>;
  getHistoricalForDate(
    lat: number,
    lon: number,
    isoDate: string,
    yearsBack?: number
  ): Promise<HistoricalStat[]>;
}

const FORECAST_TTL = 1000 * 60 * 30; // 30 min
const HIST_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

export class OpenMeteoClient implements WeatherProvider {
  private base = 'https://api.open-meteo.com/v1';
  private archiveBase = 'https://archive-api.open-meteo.com/v1';

  async getDailyForecast(
    lat: number,
    lon: number,
    start: string,
    end: string
  ): Promise<DailyForecast[]> {
    const k = key(['forecast', lat, lon, start, end]);
    const cached = await getCache<DailyForecast[]>(k);
    if (cached) return cached;

    const url = new URL(`${this.base}/forecast`);
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('start_date', start);
    url.searchParams.set('end_date', end);
    url.searchParams.set('temperature_unit', 'fahrenheit');
    url.searchParams.set(
      'daily',
      [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
        'precipitation_sum',
        'wind_gusts_10m_max',
      ].join(',')
    );

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Forecast fetch failed: ${res.status}`);
    const data = await res.json();

    const out: DailyForecast[] = data.daily.time.map(
      (d: string, i: number) => ({
        date: d,
        tMax: data.daily.temperature_2m_max[i],
        tMin: data.daily.temperature_2m_min[i],
        precipProb: data.daily.precipitation_probability_max?.[i] ?? 0,
        precipSum: data.daily.precipitation_sum?.[i] ?? 0,
        windMax: data.daily.wind_gusts_10m_max?.[i] ?? 0,
      })
    );

    await setCache(k, out, FORECAST_TTL);
    return out;
  }

  async getHistoricalForDate(
    lat: number,
    lon: number,
    isoDate: string,
    yearsBack = 10
  ): Promise<HistoricalStat[]> {
    const k = key(['hist', lat, lon, isoDate, yearsBack]);
    const cached = await getCache<HistoricalStat[]>(k);
    if (cached) return cached;

    const date = new Date(isoDate + 'T00:00:00');
    const tasks: Promise<HistoricalStat | undefined>[] = [];
    for (let i = 1; i <= yearsBack; i++) {
      const year = date.getUTCFullYear() - i;
      const d = new Date(date);
      d.setUTCFullYear(year);
      const dStr = d.toISOString().slice(0, 10);

      tasks.push(
        this.fetchArchiveDay(lat, lon, dStr).then((row) =>
          row ? { year, ...row } : undefined
        )
      );
    }
    const results = (await Promise.all(tasks)).filter(
      Boolean
    ) as HistoricalStat[];
    await setCache(k, results, HIST_TTL);
    return results;
  }

  private async fetchArchiveDay(
    lat: number,
    lon: number,
    isoDate: string
  ): Promise<Omit<HistoricalStat, 'year'> | undefined> {
    const url = new URL(`${this.archiveBase}/era5`);
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('start_date', isoDate);
    url.searchParams.set('end_date', isoDate);
    url.searchParams.set('temperature_unit', 'fahrenheit');
    url.searchParams.set(
      'daily',
      ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'].join(
        ','
      )
    );
    url.searchParams.set('timezone', 'UTC');

    const res = await fetch(url.toString());
    if (!res.ok) return undefined;
    const data = await res.json();
    if (!data?.daily?.time?.length) return undefined;
    return {
      tMax: data.daily.temperature_2m_max[0],
      tMin: data.daily.temperature_2m_min[0],
      precipSum: data.daily.precipitation_sum[0],
    };
  }
}
