import React from 'react';
import { PicnicScore, scoreDay, scoreLabel } from '../utils/scoring';
import type { DailyForecast } from '../services/weatherClient';

interface Props {
  days: DailyForecast[];
  selected: string | null;
  onSelect: (isoDate: string) => void;
}

function badge(score: PicnicScore) {
  const cls =
    score === 'green' ? 'b-green' : score === 'yellow' ? 'b-yellow' : 'b-red';
  return <span className={`badge ${cls}`}>{scoreLabel(score)}</span>;
}

export default function CalendarGrid({ days, selected, onSelect }: Props) {
  return (
    <div className='panel'>
      <div className='controls'>
        <div className='legend'>
          <span>
            <span className='swatch sw-green'></span>Ideal
          </span>
          <span>
            <span className='swatch sw-yellow'></span>Fair
          </span>
          <span>
            <span className='swatch sw-red'></span>Poor
          </span>
        </div>
        <div className='hint'>Two-week outlook • Click a day for details</div>
      </div>
      <div className='grid'>
        {days.map((d) => {
          const score = scoreDay({
            tMax: d.tMax,
            tMin: d.tMin,
            precipProb: d.precipProb,
            windMax: d.windMax,
          });
          const sel = selected === d.date ? 'selected' : '';
          return (
            <button
              key={d.date}
              className={`day ${sel}`}
              onClick={() => onSelect(d.date)}
            >
              <div className='date'>
                {new Date(d.date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className='row'>{badge(score)}</div>
              <div className='hint' style={{ marginTop: 8 }}>
                High {Math.round(d.tMax)}°F · Low {Math.round(d.tMin)}°F
              </div>
              <div className='hint'>
                <div className='hint'>
                  Rain {Math.round(d.precipProb)}% · Gust {d.windMax.toFixed(1)}{' '}
                  mph
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
