/**
 * Linearly interpolate between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Stat-bar gradient constants (extracted from the inline magic numbers that
 * used to live inside getStatColor). This stays a runtime-computed gradient
 * in TS on purpose: CSS custom properties can't express the continuous hue
 * interpolation below, so unlike the discrete effectiveness swatches these
 * are not mirrored as CSS variables.
 *
 * Saturation and lightness stay constant for uniform vibrancy; only the hue
 * moves across the value range.
 */
export const STAT_COLOR_SATURATION = 72;
export const STAT_COLOR_LIGHTNESS = 50;

/**
 * Hue breakpoints for the stat gradient, keyed to stat-value bands:
 * - 0-60: Red tones (hue 0 → 25)
 * - 61-100: Yellow/Orange tones (hue 25 → 55)
 * - 101-150: Green tones (hue 55 → 130)
 * - 151-255: Blue tones (hue 130 → 240, deepening)
 */
export const STAT_HUE_STOPS = {
  red: 0,
  orangeRed: 25,
  yellow: 55,
  green: 130,
  blue: 240,
} as const;

/**
 * Get the HSL color for a stat bar based on the stat value.
 * Uses continuous interpolation for smooth color transitions between the
 * bands described on STAT_HUE_STOPS.
 */
export function getStatColor(value: number): string {
  let hue: number;

  if (value <= 60) {
    // Red to orange-red
    const t = value / 60;
    hue = lerp(STAT_HUE_STOPS.red, STAT_HUE_STOPS.orangeRed, t);
  } else if (value <= 100) {
    // Orange to yellow
    const t = (value - 60) / 40;
    hue = lerp(STAT_HUE_STOPS.orangeRed, STAT_HUE_STOPS.yellow, t);
  } else if (value <= 150) {
    // Yellow-green to green
    const t = (value - 100) / 50;
    hue = lerp(STAT_HUE_STOPS.yellow, STAT_HUE_STOPS.green, t);
  } else {
    // Green-cyan to deep blue
    // Use 255 as the upper bound but allow extrapolation for very high stats
    const t = Math.min((value - 150) / 105, 1.5);
    hue = lerp(STAT_HUE_STOPS.green, STAT_HUE_STOPS.blue, t);
  }

  return `hsl(${Math.round(hue)}, ${STAT_COLOR_SATURATION}%, ${STAT_COLOR_LIGHTNESS}%)`;
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
 * Only the Speed effect of a nature matters for speed math, so the 25 real
 * natures collapse to this tri-state (see `types/nature.type.ts` for the full
 * model, which is deliberately not reused here).
 */
export type SpeedNature = 'positive' | 'neutral' | 'negative';

export const SPEED_EV_MAX = 252;
export const SPEED_IV_MAX = 31;

/** The inputs to `calculateCustomSpeed`, as edited in the custom speed modal. */
export interface CustomSpeedInput {
  ev: number;
  iv: number;
  nature: SpeedNature;
  /** -6..6, or null for no stat stage applied. */
  stage: number | null;
}

export const DEFAULT_CUSTOM_SPEED_INPUT: CustomSpeedInput = {
  ev: 0,
  iv: SPEED_IV_MAX,
  nature: 'neutral',
  stage: null,
};

/**
 * Starting spread for the head-to-head slots in the speed calculator. Unlike
 * the column default above, this assumes a fully invested Speed attacker —
 * the usual starting point when checking who outruns whom.
 */
export const DEFAULT_COMPARISON_SPEED_INPUT: CustomSpeedInput = {
  ev: SPEED_EV_MAX,
  iv: SPEED_IV_MAX,
  nature: 'positive',
  stage: null,
};

/**
 * Speed EVs only ever move the stat in steps of 4, so the solver walks in 4s —
 * and the EV number inputs step by the same amount.
 */
export const SPEED_EV_STEP = 4;

/** Choice Scarf multiplies Speed by 1.5, stacking on top of any stat stage. */
export const CHOICE_SCARF_MULTIPLIER = 1.5;

/**
 * Megas are locked to their Mega Stone, so a Choice Scarf is never an option
 * for them. Matches `-Mega` anywhere in the name rather than only at the end,
 * so the X/Y formes (`Mewtwo-Mega-X`) are caught alongside `Rayquaza-Mega`.
 */
export function canHoldChoiceScarf(pokemonName: string): boolean {
  return !pokemonName.toLowerCase().includes('-mega');
}

function speedWith(
  baseSpeed: number,
  ev: number,
  iv: number,
  nature: SpeedNature,
  stage: number | null,
  choiceScarf: boolean,
): number {
  const speed = calculateCustomSpeed(baseSpeed, ev, iv, nature, stage);
  return choiceScarf ? Math.floor(speed * CHOICE_SCARF_MULTIPLIER) : speed;
}

/**
 * Fewest Speed EVs this Pokemon needs to land strictly above `targetSpeed`,
 * holding its IV/nature/stage fixed. Null when even a full 252 isn't enough.
 *
 * Reported regardless of who is currently ahead: when the Pokemon already wins,
 * the answer doubles as an efficiency check (spending 252 to clear a bar that
 * 108 would have cleared).
 */
export function minEvToOutspeed(
  baseSpeed: number,
  iv: number,
  nature: SpeedNature,
  stage: number | null,
  targetSpeed: number,
  choiceScarf = false,
): number | null {
  for (let ev = 0; ev <= SPEED_EV_MAX; ev += SPEED_EV_STEP) {
    if (speedWith(baseSpeed, ev, iv, nature, stage, choiceScarf) > targetSpeed) return ev;
  }
  return null;
}

export interface OutspeedOption {
  nature: SpeedNature;
  ev: number;
}

export interface OutspeedSolution {
  /** Ways to get there with no held item. Empty means it can't be done bare. */
  options: OutspeedOption[];
  /** Ways to get there with a Choice Scarf. Only filled when `options` is empty. */
  scarfOptions: OutspeedOption[];
  /** False for Megas, which are locked to their Mega Stone. */
  canHoldScarf: boolean;
  /** Best reachable speed bare — 252 EVs and a positive nature. */
  maxSpeed: number;
  /** Best reachable speed holding a Choice Scarf. */
  maxScarfSpeed: number;
}

/**
 * Only these two are worth solving for: a negative Speed nature is never the
 * answer to "how do I outrun this", even when the slot happens to be set to one.
 * Positive always needs no more EVs than neutral, so the list is cheapest-first
 * as written.
 */
const SOLVER_NATURES: SpeedNature[] = ['positive', 'neutral'];

/**
 * Every practical way this Pokemon could end up faster than `targetSpeed`, at a
 * fixed IV and stat stage: first bare, then — only if bare is impossible — with
 * a Choice Scarf.
 */
export function solveOutspeed(
  baseSpeed: number,
  iv: number,
  stage: number | null,
  targetSpeed: number,
  pokemonName: string,
): OutspeedSolution {
  const solveFor = (choiceScarf: boolean): OutspeedOption[] =>
    SOLVER_NATURES.flatMap((nature) => {
      const ev = minEvToOutspeed(baseSpeed, iv, nature, stage, targetSpeed, choiceScarf);
      return ev === null ? [] : [{ nature, ev }];
    });

  const options = solveFor(false);
  const canHoldScarf = canHoldChoiceScarf(pokemonName);

  return {
    options,
    scarfOptions: options.length === 0 && canHoldScarf ? solveFor(true) : [],
    canHoldScarf,
    maxSpeed: speedWith(baseSpeed, SPEED_EV_MAX, iv, 'positive', stage, false),
    maxScarfSpeed: speedWith(baseSpeed, SPEED_EV_MAX, iv, 'positive', stage, true),
  };
}

export function isDefaultCustomSpeedInput(input: CustomSpeedInput): boolean {
  return (
    input.ev === DEFAULT_CUSTOM_SPEED_INPUT.ev &&
    input.iv === DEFAULT_CUSTOM_SPEED_INPUT.iv &&
    input.nature === DEFAULT_CUSTOM_SPEED_INPUT.nature &&
    input.stage === DEFAULT_CUSTOM_SPEED_INPUT.stage
  );
}

/** e.g. "252 EV · 31 IV · +Nature · +1" — used for the Custom column tooltip. */
export function describeCustomSpeedInput(input: CustomSpeedInput): string {
  const nature =
    input.nature === 'positive'
      ? '+Nature'
      : input.nature === 'negative'
        ? '-Nature'
        : 'Neutral nature';
  const parts = [`${input.ev} EV`, `${input.iv} IV`, nature];
  if (input.stage) parts.push(input.stage > 0 ? `+${input.stage}` : String(input.stage));
  return parts.join(' · ');
}

/**
 * Official stat-stage multipliers. Stage 0 is absent on purpose: "no stage"
 * skips the multiply/floor pass entirely rather than multiplying by 1, so an
 * unboosted value can never differ from the plain nature-adjusted speed.
 */
export const SPEED_STAGE_MULTIPLIERS: Record<number, number> = {
  [-6]: 0.25,
  [-5]: 2 / 7,
  [-4]: 1 / 3,
  [-3]: 0.4,
  [-2]: 0.5,
  [-1]: 2 / 3,
  1: 1.5,
  2: 2,
  3: 2.5,
  4: 3,
  5: 3.5,
  6: 4,
};

/**
 * Calculate a Pokemon's real Speed stat at level 100 for a given
 * EV/IV/nature/stage combination:
 *
 *   floor( floor(2*Base + IV + floor(EV/4) + 5) * NatureMult ) * StageMult
 *
 * EV/IV are clamped rather than rejected, so an out-of-range value from a
 * free-text input still produces a sensible number.
 */
export function calculateCustomSpeed(
  baseSpeed: number,
  ev: number,
  iv: number,
  nature: SpeedNature,
  stage: number | null,
): number {
  const clampedEv = Math.min(SPEED_EV_MAX, Math.max(0, ev));
  const clampedIv = Math.min(SPEED_IV_MAX, Math.max(0, iv));

  // Level is fixed at 100, so the `* Level / 100` term of the real formula
  // cancels out and is omitted.
  const raw = 2 * baseSpeed + clampedIv + Math.floor(clampedEv / 4) + 5;

  const natureMult = nature === 'positive' ? 1.1 : nature === 'negative' ? 0.9 : 1;
  const natureAdjusted = Math.floor(raw * natureMult);

  if (!stage) return natureAdjusted;
  return Math.floor(natureAdjusted * (SPEED_STAGE_MULTIPLIERS[stage] ?? 1));
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
 *
 * These are discrete, fixed swatches (not a gradient), so they are mirrored
 * as --effectiveness-* CSS custom properties in globals.css and referenced
 * via var() here. Neutral (1x) stays a literal `transparent` since there is
 * no corresponding swatch. The underlying rgba values are unchanged.
 */
export function getEffectivenessColor(value: number): string {
  if (value === 0) return 'var(--effectiveness-immune)';
  if (value <= 0.125) return 'var(--effectiveness-resist-min)';
  if (value <= 0.25) return 'var(--effectiveness-resist-low)';
  if (value <= 0.5) return 'var(--effectiveness-resist-high)';
  if (value === 1) return 'transparent';
  if (value <= 2) return 'var(--effectiveness-weak-low)';
  if (value <= 4) return 'var(--effectiveness-weak-mid)';
  return 'var(--effectiveness-weak-high)'; // 8x+
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
