import {
  DEFAULT_CUSTOM_SPEED_INPUT,
  SPEED_STAGE_MULTIPLIERS,
  calculateCustomSpeed,
  calculateSpeedTiers,
  isDefaultCustomSpeedInput,
} from './pokemon';

/**
 * Base speed is a 0..255 field, so the invariants below are asserted over the
 * whole domain rather than a sample: `calculateSpeedTiers` and
 * `calculateCustomSpeed` floor at different points, and a single base would
 * not catch a divergence that only shows up at some remainders.
 */
const ALL_BASES = Array.from({ length: 256 }, (_, i) => i);

/** Real Pokemon, so a wrong expectation is recognisable rather than just arithmetic. */
const DRAGAPULT_BASE_SPEED = 142;
const LANDORUS_THERIAN_BASE_SPEED = 91;

describe('calculateSpeedTiers', () => {
  it('returns all four tiers for Dragapult', () => {
    expect(calculateSpeedTiers(DRAGAPULT_BASE_SPEED)).toEqual({
      noInvestment: 320,
      maxNeutral: 383,
      maxPositive: 421,
      maxPositivePlus1: 631,
    });
  });

  it('returns all four tiers for Landorus-Therian', () => {
    expect(calculateSpeedTiers(LANDORUS_THERIAN_BASE_SPEED)).toEqual({
      noInvestment: 218,
      maxNeutral: 281,
      maxPositive: 309,
      maxPositivePlus1: 463,
    });
  });

  it('computes noInvestment as 2*base + 36 (31 IV, 0 EV, neutral nature)', () => {
    for (const base of ALL_BASES) {
      expect(calculateSpeedTiers(base).noInvestment).toBe(2 * base + 36);
    }
  });

  it('handles a base speed of 0', () => {
    expect(calculateSpeedTiers(0)).toEqual({
      noInvestment: 36,
      maxNeutral: 99,
      maxPositive: 108,
      maxPositivePlus1: 162,
    });
  });

  it('handles the maximum base speed of 255', () => {
    expect(calculateSpeedTiers(255)).toEqual({
      noInvestment: 546,
      maxNeutral: 609,
      maxPositive: 669,
      maxPositivePlus1: 1003,
    });
  });

  it('keeps the four tiers strictly ascending for every base speed', () => {
    for (const base of ALL_BASES) {
      const { noInvestment, maxNeutral, maxPositive, maxPositivePlus1 } = calculateSpeedTiers(base);
      expect(noInvestment).toBeLessThan(maxNeutral);
      expect(maxNeutral).toBeLessThan(maxPositive);
      expect(maxPositive).toBeLessThan(maxPositivePlus1);
    }
  });
});

describe('DEFAULT_CUSTOM_SPEED_INPUT', () => {
  it('is the 252+/+1 spread', () => {
    expect(DEFAULT_CUSTOM_SPEED_INPUT).toEqual({
      ev: 252,
      iv: 31,
      nature: 'positive',
      stage: 1,
    });
  });

  /**
   * The load-bearing invariant of the merged adjustable column: at rest it must
   * render the exact number the old fixed `252+/+1` column rendered, so the
   * table and the Pokemon modal tooltip cannot silently disagree.
   *
   * This rests on `SPEED_STAGE_MULTIPLIERS[1] === 1.5` (asserted separately
   * below) — if that table is ever edited, this is the test that fails.
   */
  it('reproduces maxPositivePlus1 exactly for every base speed', () => {
    const { ev, iv, nature, stage } = DEFAULT_CUSTOM_SPEED_INPUT;
    for (const base of ALL_BASES) {
      expect(calculateCustomSpeed(base, ev, iv, nature, stage)).toBe(
        calculateSpeedTiers(base).maxPositivePlus1,
      );
    }
  });

  it('relies on a +1 stat stage being a 1.5x multiplier', () => {
    expect(SPEED_STAGE_MULTIPLIERS[1]).toBe(1.5);
  });
});

describe('isDefaultCustomSpeedInput', () => {
  it('accepts the default spread', () => {
    expect(isDefaultCustomSpeedInput(DEFAULT_CUSTOM_SPEED_INPUT)).toBe(true);
  });

  it('rejects the superseded 0-EV neutral default', () => {
    expect(isDefaultCustomSpeedInput({ ev: 0, iv: 31, nature: 'neutral', stage: null })).toBe(
      false,
    );
  });

  it('rejects a spread that differs only by stat stage', () => {
    expect(isDefaultCustomSpeedInput({ ...DEFAULT_CUSTOM_SPEED_INPUT, stage: null })).toBe(false);
  });
});
