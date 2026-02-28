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

/**
 * Standard ordering of the 18 Pokemon types.
 */
export const POKEMON_TYPE_ORDER = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

/**
 * 3-letter abbreviations for type column headers.
 */
export const TYPE_ABBREVIATIONS: Record<string, string> = {
  normal: 'NOR',
  fire: 'FIR',
  water: 'WAT',
  electric: 'ELE',
  grass: 'GRA',
  ice: 'ICE',
  fighting: 'FIG',
  poison: 'POI',
  ground: 'GRO',
  flying: 'FLY',
  psychic: 'PSY',
  bug: 'BUG',
  rock: 'ROC',
  ghost: 'GHO',
  dragon: 'DRA',
  dark: 'DAR',
  steel: 'STE',
  fairy: 'FAI',
};

/**
 * Format a type effectiveness multiplier for display.
 * Neutral (1x) returns empty string since neutral cells are left blank.
 */
export function formatEffectivenessValue(value: number): string {
  if (value === 0) return '0';
  if (value === 0.125) return '\u215B'; // ⅛
  if (value === 0.25) return '\u00BC'; // ¼
  if (value === 0.5) return '\u00BD'; // ½
  if (value === 1) return '';
  if (value === 2) return '2';
  if (value === 4) return '4';
  if (value === 8) return '8';
  return String(value);
}

/**
 * Get the background color for a type effectiveness cell.
 * Green shades for resistances, red shades for weaknesses,
 * charcoal for immune, transparent for neutral.
 */
export function getEffectivenessColor(value: number): string {
  if (value === 0) return 'rgba(50, 50, 50, 0.9)';
  if (value <= 0.125) return 'rgba(20, 100, 45, 0.8)';
  if (value <= 0.25) return 'rgba(34, 120, 60, 0.7)';
  if (value <= 0.5) return 'rgba(56, 142, 80, 0.5)';
  if (value === 1) return 'transparent';
  if (value <= 2) return 'rgba(190, 50, 50, 0.5)';
  if (value <= 4) return 'rgba(200, 30, 30, 0.7)';
  return 'rgba(180, 20, 20, 0.85)'; // 8x+
}

/**
 * Convert a type effectiveness multiplier to a cumulative score.
 * Inverted sign: positive = good (resistant), negative = bad (weak).
 * Uses -log2(value) pattern, with +4 for immune.
 */
export function getEffectivenessScore(value: number): number {
  if (value === 0) return 4;
  if (value === 0.125) return 3;
  if (value === 0.25) return 2;
  if (value === 0.5) return 1;
  if (value === 1) return 0;
  if (value === 2) return -1;
  if (value === 4) return -2;
  if (value === 8) return -3;
  // Fallback: use -log2 for any other value
  return -Math.round(Math.log2(value));
}
