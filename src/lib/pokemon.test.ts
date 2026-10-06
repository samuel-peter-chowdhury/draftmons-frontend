import { MoveCategory, type MoveInput, type SpecialMoveCategoryInput } from '@/types';

import {
  DEFAULT_CUSTOM_SPEED_INPUT,
  SPEED_STAGE_MULTIPLIERS,
  calculateCustomSpeed,
  calculateSpeedTiers,
  isDefaultCustomSpeedInput,
  groupMovesBySpecialCategory,
} from './pokemon';

/**
 * The grouper loops over each move's `specialMoveCategories`, not over moves, so a
 * move in two categories has to land in two groups. These fixtures keep the
 * BaseInput noise (isActive/createdAt/updatedAt) out of every case.
 */
const BASE = { isActive: true, createdAt: '', updatedAt: '' };

function specialCategory(id: number, name: string): SpecialMoveCategoryInput {
  return { ...BASE, id, name };
}

const HAZARD = specialCategory(1, 'hazard');
const RECOVERY = specialCategory(2, 'recovery');
const SET_UP = specialCategory(3, 'set up');

function move(
  id: number,
  name: string,
  category: MoveCategory,
  specialMoveCategories?: SpecialMoveCategoryInput[],
  pokemonType?: MoveInput['pokemonType'],
): MoveInput {
  return {
    ...BASE,
    id,
    name,
    pokemonTypeId: 1,
    pokemonType,
    category,
    power: 0,
    accuracy: 0,
    priority: 0,
    pp: 20,
    description: '',
    generationId: 9,
    specialMoveCategories,
  };
}

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

describe('groupMovesBySpecialCategory', () => {
  it('groups moves under their special category, nested by move category', () => {
    const groups = groupMovesBySpecialCategory([
      move(1, 'stealth rock', MoveCategory.PHYSICAL, [HAZARD]),
      move(2, 'toxic spikes', MoveCategory.STATUS, [HAZARD]),
      move(3, 'roost', MoveCategory.STATUS, [RECOVERY]),
    ]);

    expect(groups.map((g) => g.specialMoveCategory.name)).toEqual(['hazard', 'recovery']);

    expect(groups[0].categories).toEqual([
      {
        category: MoveCategory.PHYSICAL,
        moves: [expect.objectContaining({ name: 'stealth rock' })],
      },
      { category: MoveCategory.STATUS, moves: [expect.objectContaining({ name: 'toxic spikes' })] },
    ]);
    expect(groups[1].categories).toEqual([
      { category: MoveCategory.STATUS, moves: [expect.objectContaining({ name: 'roost' })] },
    ]);
  });

  it('puts a move belonging to two special categories in both groups', () => {
    const groups = groupMovesBySpecialCategory([
      move(1, 'shore up', MoveCategory.STATUS, [HAZARD, RECOVERY]),
    ]);

    expect(groups.map((g) => g.specialMoveCategory.name)).toEqual(['hazard', 'recovery']);
    expect(groups[0].categories[0].moves.map((m) => m.name)).toEqual(['shore up']);
    expect(groups[1].categories[0].moves.map((m) => m.name)).toEqual(['shore up']);
  });

  it('orders inner categories PHYSICAL then SPECIAL then STATUS regardless of input order', () => {
    const groups = groupMovesBySpecialCategory([
      move(1, 'calm mind', MoveCategory.STATUS, [SET_UP]),
      move(2, 'tail glow', MoveCategory.SPECIAL, [SET_UP]),
      move(3, 'bulk up', MoveCategory.PHYSICAL, [SET_UP]),
    ]);

    expect(groups[0].categories.map((c) => c.category)).toEqual([
      MoveCategory.PHYSICAL,
      MoveCategory.SPECIAL,
      MoveCategory.STATUS,
    ]);
  });

  it('orders outer groups alphabetically by special category name regardless of input order', () => {
    const groups = groupMovesBySpecialCategory([
      move(1, 'swords dance', MoveCategory.STATUS, [SET_UP]),
      move(2, 'spikes', MoveCategory.STATUS, [HAZARD]),
      move(3, 'recover', MoveCategory.STATUS, [RECOVERY]),
    ]);

    expect(groups.map((g) => g.specialMoveCategory.name)).toEqual(['hazard', 'recovery', 'set up']);
  });

  it('orders moves alphabetically by name within an inner category', () => {
    const groups = groupMovesBySpecialCategory([
      move(1, 'toxic spikes', MoveCategory.STATUS, [HAZARD]),
      move(2, 'spikes', MoveCategory.STATUS, [HAZARD]),
      move(3, 'sticky web', MoveCategory.STATUS, [HAZARD]),
    ]);

    expect(groups[0].categories[0].moves.map((m) => m.name)).toEqual([
      'spikes',
      'sticky web',
      'toxic spikes',
    ]);
  });

  it('sums totalMoves across inner categories, counting a dual-category move once per group', () => {
    const groups = groupMovesBySpecialCategory([
      move(1, 'stealth rock', MoveCategory.PHYSICAL, [HAZARD]),
      move(2, 'spikes', MoveCategory.STATUS, [HAZARD]),
      move(3, 'shore up', MoveCategory.STATUS, [HAZARD, RECOVERY]),
    ]);

    expect(groups.map((g) => [g.specialMoveCategory.name, g.totalMoves])).toEqual([
      ['hazard', 3],
      ['recovery', 1],
    ]);
  });

  it('skips moves whose specialMoveCategories is undefined or empty', () => {
    const groups = groupMovesBySpecialCategory([
      move(1, 'tackle', MoveCategory.PHYSICAL, undefined),
      move(2, 'splash', MoveCategory.STATUS, []),
      move(3, 'spikes', MoveCategory.STATUS, [HAZARD]),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].categories[0].moves.map((m) => m.name)).toEqual(['spikes']);
  });

  it('groups a move with no pokemonType rather than dropping it', () => {
    const groups = groupMovesBySpecialCategory([
      move(1, 'spikes', MoveCategory.STATUS, [HAZARD], undefined),
    ]);

    expect(groups[0].categories[0].moves.map((m) => m.name)).toEqual(['spikes']);
    expect(groups[0].categories[0].moves[0].pokemonType).toBeUndefined();
  });

  it('returns [] for no moves', () => {
    expect(groupMovesBySpecialCategory([])).toEqual([]);
  });

  it('returns [] when no move has any special category', () => {
    const groups = groupMovesBySpecialCategory([
      move(1, 'tackle', MoveCategory.PHYSICAL),
      move(2, 'growl', MoveCategory.STATUS, []),
    ]);

    expect(groups).toEqual([]);
  });
});

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
