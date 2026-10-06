import type { GameStatInput, SeasonPokemonInput, TeamInput } from '@/types';

import {
  computePokemonRanks,
  sortPokemonRankRows,
  type PokemonRankRow,
  type RankSortColumn,
} from './pokemonStats';

/**
 * `sortPokemonRankRows` only ever reads `pokemon.name` and `seasonPokemon.id`
 * off the nested entity, so fixtures stub the rest rather than spelling out a
 * full `SeasonPokemonInput` per case. `kda` and `avgKillsPerGame` are derived
 * exactly as `toRow` derives them, so a fixture can never be internally
 * inconsistent with what the page would really show.
 */
const BASE = {
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

let nextId = 1;

function makeTeam(name: string): TeamInput {
  return { ...BASE, id: nextId++, name, seasonId: 1, userId: null };
}

function makeRow(
  name: string,
  {
    team = null,
    gamesPlayed = 1,
    totalKills = 0,
    totalDeaths = 0,
    rank = 0,
  }: {
    team?: string | null;
    gamesPlayed?: number;
    totalKills?: number;
    totalDeaths?: number;
    rank?: number;
  } = {},
): PokemonRankRow {
  return {
    seasonPokemon: {
      ...BASE,
      id: nextId++,
      seasonId: 1,
      pokemonId: 1,
      condition: 'NORMAL',
      pointValue: 10,
      pokemon: { ...BASE, id: nextId++, name } as SeasonPokemonInput['pokemon'],
    },
    gamesPlayed,
    totalKills,
    totalDeaths,
    kda: totalKills / Math.max(totalDeaths, 1),
    avgKillsPerGame: gamesPlayed > 0 ? totalKills / gamesPlayed : 0,
    team: team === null ? null : makeTeam(team),
    rank,
  };
}

/** Reads the sorted result back as names, which is what every assertion compares. */
function names(rows: PokemonRankRow[]): string[] {
  return rows.map((row) => row.seasonPokemon.pokemon!.name);
}

/**
 * Five rows with a distinct value in every one of the seven sortable columns,
 * and deliberately no two columns producing the same ordering — so an
 * assertion can only pass if the function sorted on the column it was asked
 * for.
 */
function makeFixture(): PokemonRankRow[] {
  return [
    makeRow('azumarill', { team: 'Bolt', gamesPlayed: 2, totalKills: 9, totalDeaths: 6 }),
    makeRow('bulbasaur', { team: 'Aqua', gamesPlayed: 5, totalKills: 12, totalDeaths: 3 }),
    makeRow('charizard', { team: 'Delta', gamesPlayed: 1, totalKills: 4, totalDeaths: 8 }),
    makeRow('dragonite', { team: 'Echo', gamesPlayed: 7, totalKills: 20, totalDeaths: 10 }),
    makeRow('eevee', { team: 'Cinder', gamesPlayed: 6, totalKills: 5, totalDeaths: 2 }),
  ];
}

function makeSeasonPokemon(
  name: string,
  {
    games = 1,
    totalKills = 0,
    totalDeaths = 0,
    teamId,
  }: { games?: number; totalKills?: number; totalDeaths?: number; teamId?: number } = {},
): SeasonPokemonInput {
  const seasonPokemonId = nextId++;
  // All of the kills and deaths land on the first game; only the totals and the
  // array length are read back out.
  const gameStats: GameStatInput[] = Array.from({ length: games }, (_, i) => ({
    ...BASE,
    id: nextId++,
    gameId: i + 1,
    seasonPokemonId,
    directKills: i === 0 ? totalKills : 0,
    indirectKills: 0,
    deaths: i === 0 ? totalDeaths : 0,
  }));

  return {
    ...BASE,
    id: seasonPokemonId,
    seasonId: 1,
    pokemonId: 1,
    condition: 'NORMAL',
    pointValue: 10,
    pokemon: { ...BASE, id: nextId++, name } as SeasonPokemonInput['pokemon'],
    gameStats,
    seasonPokemonTeams:
      teamId === undefined ? [] : [{ ...BASE, id: nextId++, seasonPokemonId, teamId }],
  };
}

describe('sortPokemonRankRows', () => {
  /**
   * The expected ordering of `makeFixture()` for each column in each
   * direction. Every list is a permutation unique to its column.
   */
  const cases: { column: RankSortColumn; desc: string[]; asc: string[] }[] = [
    {
      column: 'name',
      desc: ['eevee', 'dragonite', 'charizard', 'bulbasaur', 'azumarill'],
      asc: ['azumarill', 'bulbasaur', 'charizard', 'dragonite', 'eevee'],
    },
    {
      column: 'team',
      desc: ['dragonite', 'charizard', 'eevee', 'azumarill', 'bulbasaur'],
      asc: ['bulbasaur', 'azumarill', 'eevee', 'charizard', 'dragonite'],
    },
    {
      column: 'gamesPlayed',
      desc: ['dragonite', 'eevee', 'bulbasaur', 'azumarill', 'charizard'],
      asc: ['charizard', 'azumarill', 'bulbasaur', 'eevee', 'dragonite'],
    },
    {
      column: 'totalKills',
      desc: ['dragonite', 'bulbasaur', 'azumarill', 'eevee', 'charizard'],
      asc: ['charizard', 'eevee', 'azumarill', 'bulbasaur', 'dragonite'],
    },
    {
      column: 'totalDeaths',
      desc: ['dragonite', 'charizard', 'azumarill', 'bulbasaur', 'eevee'],
      asc: ['eevee', 'bulbasaur', 'azumarill', 'charizard', 'dragonite'],
    },
    {
      column: 'kda',
      desc: ['bulbasaur', 'eevee', 'dragonite', 'azumarill', 'charizard'],
      asc: ['charizard', 'azumarill', 'dragonite', 'eevee', 'bulbasaur'],
    },
    {
      column: 'avgKillsPerGame',
      desc: ['azumarill', 'charizard', 'dragonite', 'bulbasaur', 'eevee'],
      asc: ['eevee', 'bulbasaur', 'dragonite', 'charizard', 'azumarill'],
    },
  ];

  for (const { column, desc, asc } of cases) {
    it(`sorts by ${column} descending`, () => {
      expect(names(sortPokemonRankRows(makeFixture(), column, 'DESC'))).toEqual(desc);
    });

    it(`sorts by ${column} ascending`, () => {
      expect(names(sortPokemonRankRows(makeFixture(), column, 'ASC'))).toEqual(asc);
    });
  }

  it('reproduces the default ranking at the initial totalKills/DESC state', () => {
    // Three rows tie on totalKills so the assertion depends on the whole
    // tiebreak chain, not just the primary key.
    const { main } = computePokemonRanks(
      [
        makeSeasonPokemon('low-kda', { games: 3, totalKills: 10, totalDeaths: 5 }),
        makeSeasonPokemon('kda-tiebreak-winner', { games: 3, totalKills: 10, totalDeaths: 2 }),
        makeSeasonPokemon('kda-tiebreak-loser', { games: 4, totalKills: 10, totalDeaths: 2 }),
        makeSeasonPokemon('kills-leader', { games: 2, totalKills: 25, totalDeaths: 1 }),
        makeSeasonPokemon('fewest-kills', { games: 5, totalKills: 3, totalDeaths: 3 }),
      ],
      new Map(),
    );

    expect(names(main)).toEqual([
      'kills-leader',
      'kda-tiebreak-winner',
      'kda-tiebreak-loser',
      'low-kda',
      'fewest-kills',
    ]);
    // The page opens on ('totalKills', 'DESC'), so that sort must leave the
    // default ranking exactly as `computePokemonRanks` produced it.
    expect(names(sortPokemonRankRows(main, 'totalKills', 'DESC'))).toEqual(names(main));
  });

  it('does not mutate the input array', () => {
    const rows = makeFixture();
    const before = names(rows);

    sortPokemonRankRows(rows, 'kda', 'ASC');

    expect(names(rows)).toEqual(before);
  });

  it('returns an empty array unchanged', () => {
    expect(sortPokemonRankRows([], 'kda', 'DESC')).toEqual([]);
  });

  it('returns a single row unchanged', () => {
    const rows = [makeRow('ditto', { totalKills: 3 })];
    expect(names(sortPokemonRankRows(rows, 'team', 'ASC'))).toEqual(['ditto']);
  });

  it('breaks ties on the sorted column with the default ranking chain', () => {
    const rows = [
      makeRow('low', { gamesPlayed: 4, totalKills: 2, totalDeaths: 1 }),
      makeRow('high', { gamesPlayed: 4, totalKills: 11, totalDeaths: 1 }),
      makeRow('mid', { gamesPlayed: 4, totalKills: 7, totalDeaths: 1 }),
    ];

    expect(names(sortPokemonRankRows(rows, 'gamesPlayed', 'DESC'))).toEqual(['high', 'mid', 'low']);
  });

  it('keeps the tiebreak chain descending even when sortOrder is ASC', () => {
    const rows = [
      makeRow('low', { gamesPlayed: 4, totalKills: 2, totalDeaths: 1 }),
      makeRow('high', { gamesPlayed: 4, totalKills: 11, totalDeaths: 1 }),
      makeRow('mid', { gamesPlayed: 4, totalKills: 7, totalDeaths: 1 }),
    ];

    expect(names(sortPokemonRankRows(rows, 'gamesPlayed', 'ASC'))).toEqual(['high', 'mid', 'low']);
  });

  it('sorts teamless rows last when sorting by team descending', () => {
    const rows = [
      makeRow('teamless-a', { totalKills: 1 }),
      makeRow('zeta', { team: 'Zeta', totalKills: 2 }),
      makeRow('teamless-b', { totalKills: 3 }),
      makeRow('alpha', { team: 'Alpha', totalKills: 4 }),
    ];

    expect(names(sortPokemonRankRows(rows, 'team', 'DESC'))).toEqual([
      'zeta',
      'alpha',
      'teamless-b',
      'teamless-a',
    ]);
  });

  it('sorts teamless rows last when sorting by team ascending', () => {
    const rows = [
      makeRow('teamless-a', { totalKills: 1 }),
      makeRow('zeta', { team: 'Zeta', totalKills: 2 }),
      makeRow('teamless-b', { totalKills: 3 }),
      makeRow('alpha', { team: 'Alpha', totalKills: 4 }),
    ];

    expect(names(sortPokemonRankRows(rows, 'team', 'ASC'))).toEqual([
      'alpha',
      'zeta',
      'teamless-b',
      'teamless-a',
    ]);
  });

  it('falls back to the tiebreak chain for an all-teamless set sorted by team', () => {
    const rows = [
      makeRow('few', { totalKills: 1, totalDeaths: 1 }),
      makeRow('many', { totalKills: 9, totalDeaths: 1 }),
      makeRow('some', { totalKills: 5, totalDeaths: 1 }),
    ];

    expect(names(sortPokemonRankRows(rows, 'team', 'ASC'))).toEqual(['many', 'some', 'few']);
  });

  it('orders rows sharing a kda of 0 deterministically by games played', () => {
    const rows = [
      makeRow('one-game', { gamesPlayed: 1, totalKills: 0, totalDeaths: 3 }),
      makeRow('five-games', { gamesPlayed: 5, totalKills: 0, totalDeaths: 3 }),
      makeRow('three-games', { gamesPlayed: 3, totalKills: 0, totalDeaths: 3 }),
    ];

    expect(rows.every((row) => row.kda === 0)).toBe(true);
    expect(names(sortPokemonRankRows(rows, 'kda', 'DESC'))).toEqual([
      'five-games',
      'three-games',
      'one-game',
    ]);
  });
});

describe('computePokemonRanks rank stamping', () => {
  it('stamps rank as 1..n over main in default ranking order', () => {
    const { main } = computePokemonRanks(
      [
        makeSeasonPokemon('middle', { games: 3, totalKills: 10, totalDeaths: 2 }),
        makeSeasonPokemon('best', { games: 3, totalKills: 30, totalDeaths: 2 }),
        makeSeasonPokemon('worst', { games: 3, totalKills: 1, totalDeaths: 2 }),
      ],
      new Map(),
    );

    expect(names(main)).toEqual(['best', 'middle', 'worst']);
    expect(main.map((row) => row.rank)).toEqual([1, 2, 3]);
  });

  it('restarts rank at 1 for the limited sample size table', () => {
    const { main, limited, threshold } = computePokemonRanks(
      [
        makeSeasonPokemon('established-a', { games: 4, totalKills: 20, totalDeaths: 2 }),
        makeSeasonPokemon('established-b', { games: 4, totalKills: 10, totalDeaths: 2 }),
        makeSeasonPokemon('rookie-strong', { games: 1, totalKills: 6, totalDeaths: 1 }),
        makeSeasonPokemon('rookie-weak', { games: 1, totalKills: 2, totalDeaths: 1 }),
      ],
      new Map(),
    );

    expect(threshold).toBe(2);
    expect(names(main)).toEqual(['established-a', 'established-b']);
    expect(main.map((row) => row.rank)).toEqual([1, 2]);
    expect(names(limited)).toEqual(['rookie-strong', 'rookie-weak']);
    expect(limited.map((row) => row.rank)).toEqual([1, 2]);
  });

  it('leaves limited empty when every Pokemon clears the threshold', () => {
    const { main, limited, threshold } = computePokemonRanks(
      [
        makeSeasonPokemon('veteran-a', { games: 4, totalKills: 8, totalDeaths: 2 }),
        makeSeasonPokemon('veteran-b', { games: 2, totalKills: 3, totalDeaths: 2 }),
      ],
      new Map(),
    );

    expect(threshold).toBe(2);
    expect(limited).toEqual([]);
    expect(main.map((row) => row.rank)).toEqual([1, 2]);
  });

  it('collapses the threshold to 1 when every Pokemon has a single game', () => {
    // `Math.min(2, maxGamesPlayed)` collapses to 1, so every row clears the
    // threshold and the limited table is not rendered at all.
    const { main, limited, threshold } = computePokemonRanks(
      [
        makeSeasonPokemon('rookie-a', { games: 1, totalKills: 4, totalDeaths: 1 }),
        makeSeasonPokemon('rookie-b', { games: 1, totalKills: 1, totalDeaths: 1 }),
      ],
      new Map(),
    );

    expect(threshold).toBe(1);
    expect(names(main)).toEqual(['rookie-a', 'rookie-b']);
    expect(main.map((row) => row.rank)).toEqual([1, 2]);
    expect(limited).toEqual([]);
  });

  it('leaves rank attached to its row after a re-sort', () => {
    const { main } = computePokemonRanks(
      [
        makeSeasonPokemon('kills-leader', { games: 10, totalKills: 30, totalDeaths: 30 }),
        makeSeasonPokemon('kda-leader', { games: 2, totalKills: 20, totalDeaths: 1 }),
      ],
      new Map(),
    );

    expect(names(main)).toEqual(['kills-leader', 'kda-leader']);

    const byKda = sortPokemonRankRows(main, 'kda', 'DESC');

    expect(names(byKda)).toEqual(['kda-leader', 'kills-leader']);
    expect(byKda.map((row) => row.rank)).toEqual([2, 1]);
  });
});
