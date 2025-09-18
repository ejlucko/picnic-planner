export type PicnicScore = 'green' | 'yellow' | 'red';

export interface DayInputs {
  tMax: number; // C
  tMin: number; // C
  precipProb: number; // 0..100 (%)
  windMax: number; // m/s
  humidity?: number; // % (optional, not always available in daily)
}

export function scoreDay(input: DayInputs): PicnicScore {
  const comfyTemp = input.tMax >= 65 && input.tMax <= 75 && input.tMin >= 50;
  const lightWind = input.windMax <= 40;
  const lowRain = input.precipProb <= 30;

  if (comfyTemp && lightWind && lowRain) return 'green';
  const okayTemp = input.tMax >= 55 && input.tMax <= 85;
  const mediumWind = input.windMax <= 50;
  const mediumRain = input.precipProb <= 60;

  if (okayTemp && mediumWind && mediumRain) return 'yellow';
  return 'red';
}

export function scoreLabel(score: PicnicScore) {
  switch (score) {
    case 'green':
      return 'Ideal';
    case 'yellow':
      return 'Fair';
    case 'red':
      return 'Poor';
  }
}
