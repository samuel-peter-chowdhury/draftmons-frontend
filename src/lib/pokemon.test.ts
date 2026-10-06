import { MoveCategory, type MoveInput, type SpecialMoveCategoryInput } from '@/types';

import { groupMovesBySpecialCategory } from './pokemon';

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
