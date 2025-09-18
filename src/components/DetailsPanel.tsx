import React from 'react';
import type { DailyForecast, HistoricalStat } from '../services/weatherClient';

interface Props {
  day?: DailyForecast;
  historical: HistoricalStat[];
}

export default function DetailsPanel({ day, historical }: Props) {
  return (
    <div className='panel details'>
      <div className='card'>
        <h3>Forecast</h3>
        {day ? (
          <div className='metrics'>
            <div className='metric'>
              <div className='label'>Date</div>
              <div className='value'>
                {new Date(day.date).toLocaleDateString()}
              </div>
            </div>
            <div className='metric'>
              <div className='label'>High</div>
              <div className='value'>{Math.round(day.tMax)}°F</div>
            </div>
            <div className='metric'>
              <div className='label'>Low</div>
              <div className='value'>{Math.round(day.tMin)}°F</div>
            </div>
            <div className='metric'>
              <div className='label'>Rain chance</div>
              <div className='value'>{Math.round(day.precipProb)}%</div>
            </div>
            <div className='metric'>
              <div className='label'>Rain total</div>
              <div className='value'>{day.precipSum?.toFixed(1)} mm</div>
            </div>
            <div className='metric'>
              <div className='label'>Wind gust</div>
              <div className='value'>{day.windMax.toFixed(1)} mph</div>
            </div>
          </div>
        ) : (
          <div className='hint'>Select a day on the calendar.</div>
        )}
      </div>
      <div className='card'>
        <h3>Historical (last 10 years)</h3>
        {historical.length ? (
          <div className='metrics'>
            <div className='metric'>
              <div className='label'>Avg High</div>
              <div className='value'>
                {Math.round(avg(historical.map((h) => h.tMax)).value)}°F
              </div>
              <div className='hint'>
                ±{Math.round(avg(historical.map((h) => h.tMax)).stdev)}°
              </div>
            </div>
            <div className='metric'>
              <div className='label'>Avg Low</div>
              <div className='value'>
                {Math.round(avg(historical.map((h) => h.tMin)).value)}°F
              </div>
              <div className='hint'>
                ±{Math.round(avg(historical.map((h) => h.tMin)).stdev)}°
              </div>
            </div>
            <div className='metric'>
              <div className='label'>Avg Rain</div>
              <div className='value'>
                {avg(historical.map((h) => h.precipSum)).value.toFixed(1)} mm
              </div>
              <div className='hint'>
                ±{avg(historical.map((h) => h.precipSum)).stdev.toFixed(1)} mm
              </div>
            </div>
            <div className='metric'>
              <div className='label'>Sample size</div>
              <div className='value'>{historical.length}</div>
              <div className='hint'>years</div>
            </div>
          </div>
        ) : (
          <div className='hint'>
            No historical data yet for the selected day.
          </div>
        )}
      </div>
    </div>
  );
}

function avg(arr: (number | undefined)[]) {
  const nums = arr.filter((x): x is number => typeof x === 'number');
  if (!nums.length) return { value: 0, stdev: 0 };
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
  return { value: mean, stdev: Math.sqrt(variance) };
}
