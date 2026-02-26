/**
 * Linearly interpolate between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Get the HSL color for a stat bar based on the stat value.
 * Uses continuous interpolation for smooth color transitions:
 * - 0-60: Red tones (hue 0-25)
 * - 61-100: Yellow/Orange tones (hue 25-55)
 * - 101-150: Green tones (hue 55-130)
 * - 151-255: Blue tones (hue 130-240, deepening)
 *
 * Saturation and lightness remain consistent for uniform vibrancy.
 */
export function getStatColor(value: number): string {
  const saturation = 72;
  const lightness = 50;

  let hue: number;

  if (value <= 60) {
    // Red to orange-red: hue 0 → 25
    const t = value / 60;
    hue = lerp(0, 25, t);
  } else if (value <= 100) {
    // Orange to yellow: hue 25 → 55
    const t = (value - 60) / 40;
    hue = lerp(25, 55, t);
  } else if (value <= 150) {
    // Yellow-green to green: hue 55 → 130
    const t = (value - 100) / 50;
    hue = lerp(55, 130, t);
  } else {
    // Green-cyan to deep blue: hue 130 → 240
    // Use 255 as the upper bound but allow extrapolation for very high stats
    const t = Math.min((value - 150) / 105, 1.5);
    hue = lerp(130, 240, t);
  }

  return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
}

export interface SpeedTiers {
  maxNeutral: number;
  maxPositive: number;
  maxPositivePlus1: number;
}

/**
 * Calculate speed tier values from a base speed stat.
 * - maxNeutral: Max speed with neutral nature (level 100, 31 IVs, 252 EVs)
 * - maxPositive: Max speed with +speed nature
 * - maxPositivePlus1: Max speed with +speed nature after +1 boost (e.g. Dragon Dance)
 */
export function calculateSpeedTiers(baseSpeed: number): SpeedTiers {
  const maxNeutral = Math.floor(baseSpeed * 2 + 99);
  const maxPositive = Math.floor(maxNeutral * 1.1);
  const maxPositivePlus1 = Math.floor(maxPositive * 1.5);
  return { maxNeutral, maxPositive, maxPositivePlus1 };
}
