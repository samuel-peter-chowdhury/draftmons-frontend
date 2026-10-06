import type { TeamInput } from '@/types';

import {
  computeStandings,
  sortStandings,
  type StandingsRow,
  type TeamRankSortColumn,
} from './standings';

/**
 * `toRow()` derives every counting stat from relation array lengths and from
 * `wonGames[].differential`, so a fixture only needs arrays of the right length
 * with the whole differential parked on one game.
 */
interface TeamFixture {
  name: string;
  owner?: { firstName?: string | null; lastName?: string | null; email?: string } | null;
  matchWins?: number;
  matchLosses?: number;
  gameWins?: number;
  gameLosses?: number;
  differential?: number;
}

let nextTeamId = 1;

function makeTeam({
  name,
  owner = { firstName: 'Default', lastName: 'Owner' },
  matchWins = 0,
  matchLosses = 0,
  gameWins = 0,
  gameLosses = 0,
  differential = 0,
}: TeamFixture): TeamInput {
  if (differential !== 0 && gameWins === 0 && gameLosses === 0) {
    throw new Error(`fixture "${name}" cannot carry a differential with no games`);
  }

  return {
    id: nextTeamId++,
    name,
    user: owner ?? undefined,
    wonMatches: Array.from({ length: matchWins }, () => ({})),
    lostMatches: Array.from({ length: matchLosses }, () => ({})),
    wonGames: Array.from({ length: gameWins }, (_, i) => ({
      differential: i === 0 ? differential : 0,
    })),
    lostGames: Array.from({ length: gameLosses }, (_, i) => ({
      differential: gameWins === 0 && i === 0 ? -differential : 0,
    })),
  } as unknown as TeamInput;
}

function names(rows: StandingsRow[]): string[] {
  return rows.map((row) => row.team.name);
}

/**
 * Five teams whose seven sort keys all disagree, so a comparator reading the
 * wrong field cannot accidentally produce the right order. Echo has played
 * nothing, which makes it the null-win% row.
 */
function makeFixture(): TeamInput[] {
  return [
    makeTeam({
      name: 'Delta',
      owner: { firstName: 'Zoe', lastName: 'Zhang' },
      matchWins: 8,
      matchLosses: 1,
      gameWins: 20,
      gameLosses: 5,
      differential: 50,
    }),
    makeTeam({
      name: 'Charlie',
      owner: { firstName: 'Mia', lastName: 'Moore' },
      matchWins: 8,
      matchLosses: 3,
      gameWins: 18,
      gameLosses: 9,
      differential: 30,
    }),
    makeTeam({
      name: 'Bravo',
      owner: { firstName: 'Ada', lastName: 'Adams' },
      matchWins: 5,
      matchLosses: 0,
      gameWins: 12,
      gameLosses: 2,
      differential: 40,
    }),
    makeTeam({
      name: 'Alpha',
      owner: null,
      matchWins: 5,
      matchLosses: 2,
      gameWins: 10,
      gameLosses: 10,
      differential: -10,
    }),
    makeTeam({ name: 'Echo', owner: { firstName: 'Ben', lastName: 'Brown' } }),
  ];
}

/** Match win% first, zero-match teams last — the `compareRows` chain. */
const DEFAULT_ORDER = ['Bravo', 'Delta', 'Charlie', 'Alpha', 'Echo'];

describe('computeStandings', () => {
  it('orders by the standings tiebreaker chain and pins zero-match teams last', () => {
    expect(names(computeStandings(makeFixture()))).toEqual(DEFAULT_ORDER);
  });

  it('assigns rank 1..n in standings order', () => {
    expect(computeStandings(makeFixture()).map((row) => row.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns an empty array for no teams', () => {
    expect(computeStandings([])).toEqual([]);
  });
});

describe('sortStandings', () => {
  it('returns the default standings order unchanged when sortBy is null', () => {
    const rows = computeStandings(makeFixture());
    expect(names(sortStandings(rows, null, 'DESC'))).toEqual(DEFAULT_ORDER);
    expect(names(sortStandings(rows, null, 'ASC'))).toEqual(DEFAULT_ORDER);
  });

  it('does not mutate the rows it is given', () => {
    const rows = computeStandings(makeFixture());
    const sorted = sortStandings(rows, 'differential', 'DESC');

    expect(sorted).not.toBe(rows);
    expect(names(rows)).toEqual(DEFAULT_ORDER);
  });

  it('returns an empty array for empty input', () => {
    expect(sortStandings([], 'differential', 'DESC')).toEqual([]);
  });

  it('carries the frozen standings rank through a re-sort', () => {
    const rows = computeStandings(makeFixture());
    // name ASC is Alpha, Bravo, Charlie, Delta, Echo — ranks 4, 1, 3, 2, 5.
    expect(sortStandings(rows, 'name', 'ASC').map((row) => row.rank)).toEqual([4, 1, 3, 2, 5]);
  });

  it('keeps the incoming relative order of rows that tie on the active column', () => {
    const rows = computeStandings([
      makeTeam({
        name: 'TiedFirst',
        matchWins: 4,
        matchLosses: 0,
        gameWins: 5,
        gameLosses: 1,
        differential: 7,
      }),
      makeTeam({
        name: 'TiedSecond',
        matchWins: 1,
        matchLosses: 3,
        gameWins: 2,
        gameLosses: 6,
        differential: 7,
      }),
    ]);

    expect(names(rows)).toEqual(['TiedFirst', 'TiedSecond']);
    expect(names(sortStandings(rows, 'differential', 'DESC'))).toEqual(['TiedFirst', 'TiedSecond']);
    expect(names(sortStandings(rows, 'differential', 'ASC'))).toEqual(['TiedFirst', 'TiedSecond']);
  });
});

describe('sortStandings per column', () => {
  const columnOrders: Array<{ column: TeamRankSortColumn; desc: string[]; asc: string[] }> = [
    {
      column: 'name',
      desc: ['Echo', 'Delta', 'Charlie', 'Bravo', 'Alpha'],
      asc: ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'],
    },
    {
      // Alpha is unclaimed, so it pins last in both directions.
      column: 'owner',
      desc: ['Delta', 'Charlie', 'Echo', 'Bravo', 'Alpha'],
      asc: ['Bravo', 'Echo', 'Charlie', 'Delta', 'Alpha'],
    },
    {
      column: 'matchRecord',
      desc: ['Delta', 'Charlie', 'Bravo', 'Alpha', 'Echo'],
      asc: ['Echo', 'Alpha', 'Bravo', 'Charlie', 'Delta'],
    },
    {
      // Echo has no matches, so its null win% pins last in both directions.
      column: 'matchWinPct',
      desc: ['Bravo', 'Delta', 'Charlie', 'Alpha', 'Echo'],
      asc: ['Alpha', 'Charlie', 'Delta', 'Bravo', 'Echo'],
    },
    {
      column: 'gameRecord',
      desc: ['Delta', 'Charlie', 'Bravo', 'Alpha', 'Echo'],
      asc: ['Echo', 'Alpha', 'Bravo', 'Charlie', 'Delta'],
    },
    {
      column: 'gameWinPct',
      desc: ['Bravo', 'Delta', 'Charlie', 'Alpha', 'Echo'],
      asc: ['Alpha', 'Charlie', 'Delta', 'Bravo', 'Echo'],
    },
    {
      // Echo's differential of 0 is a real value, so it sorts mid-table.
      column: 'differential',
      desc: ['Delta', 'Bravo', 'Charlie', 'Echo', 'Alpha'],
      asc: ['Alpha', 'Echo', 'Charlie', 'Bravo', 'Delta'],
    },
  ];

  it.each(columnOrders)('sorts $column DESC', ({ column, desc }) => {
    expect(names(sortStandings(computeStandings(makeFixture()), column, 'DESC'))).toEqual(desc);
  });

  it.each(columnOrders)('sorts $column ASC', ({ column, asc }) => {
    expect(names(sortStandings(computeStandings(makeFixture()), column, 'ASC'))).toEqual(asc);
  });
});

describe('sortStandings record columns', () => {
  it('sorts by wins rather than rate, breaking ties on fewer losses', () => {
    const rows = sortStandings(computeStandings(makeFixture()), 'matchRecord', 'DESC');

    // 8-1 above 5-0 proves wins beat rate; 8-1 above 8-3 proves the loss tiebreak.
    expect(rows.map((row) => `${row.matchWins}-${row.matchLosses}`)).toEqual([
      '8-1',
      '8-3',
      '5-0',
      '5-2',
      '0-0',
    ]);
  });

  it('does not pin a team with no games played on the record columns', () => {
    const rows = computeStandings(makeFixture());

    expect(names(sortStandings(rows, 'matchRecord', 'ASC'))[0]).toBe('Echo');
    expect(names(sortStandings(rows, 'gameRecord', 'ASC'))[0]).toBe('Echo');
  });
});

describe('sortStandings pinning', () => {
  it('pins null win% rows last under both directions', () => {
    const rows = computeStandings([
      makeTeam({
        name: 'Played',
        matchWins: 3,
        matchLosses: 1,
        gameWins: 6,
        gameLosses: 2,
        differential: 5,
      }),
      makeTeam({
        name: 'AlsoPlayed',
        matchWins: 1,
        matchLosses: 3,
        gameWins: 2,
        gameLosses: 6,
        differential: -5,
      }),
      makeTeam({ name: 'Idle' }),
      makeTeam({ name: 'AlsoIdle' }),
    ]);

    // The pinned group keeps its incoming default-standings order (name-sorted).
    expect(names(sortStandings(rows, 'matchWinPct', 'DESC')).slice(-2)).toEqual([
      'AlsoIdle',
      'Idle',
    ]);
    expect(names(sortStandings(rows, 'matchWinPct', 'ASC')).slice(-2)).toEqual([
      'AlsoIdle',
      'Idle',
    ]);
    expect(names(sortStandings(rows, 'gameWinPct', 'DESC')).slice(-2)).toEqual([
      'AlsoIdle',
      'Idle',
    ]);
    expect(names(sortStandings(rows, 'gameWinPct', 'ASC')).slice(-2)).toEqual(['AlsoIdle', 'Idle']);
  });

  it('pins unclaimed-owner rows last under both directions', () => {
    const rows = computeStandings([
      makeTeam({
        name: 'Zed',
        owner: { firstName: 'Zoe', lastName: 'Zhang' },
        matchWins: 1,
        matchLosses: 3,
        gameWins: 2,
        gameLosses: 6,
      }),
      makeTeam({
        name: 'Ann',
        owner: { firstName: 'Ada', lastName: 'Adams' },
        matchWins: 3,
        matchLosses: 1,
        gameWins: 6,
        gameLosses: 2,
      }),
      makeTeam({ name: 'OrphanA', owner: null, matchWins: 2, matchLosses: 2, gameWins: 4 }),
      makeTeam({ name: 'OrphanB', owner: null, matchWins: 2, matchLosses: 2, gameWins: 4 }),
    ]);

    expect(names(sortStandings(rows, 'owner', 'DESC')).slice(-2)).toEqual(['OrphanA', 'OrphanB']);
    expect(names(sortStandings(rows, 'owner', 'ASC')).slice(-2)).toEqual(['OrphanA', 'OrphanB']);
  });
});

describe('sortStandings name keys', () => {
  it('sorts the team column case-insensitively', () => {
    const rows = computeStandings([
      makeTeam({ name: 'Banana', matchWins: 1, gameWins: 1 }),
      makeTeam({ name: 'apple', matchWins: 1, gameWins: 1 }),
    ]);

    expect(names(sortStandings(rows, 'name', 'ASC'))).toEqual(['apple', 'Banana']);
  });

  it('sorts the owner column on the rendered display name for every name shape', () => {
    const rows = computeStandings([
      makeTeam({
        name: 'FullName',
        owner: { firstName: 'Zoe', lastName: 'Zhang' },
        matchWins: 3,
        matchLosses: 1,
        gameWins: 1,
      }),
      makeTeam({
        name: 'EmailOnly',
        owner: { email: 'ada@example.com' },
        matchWins: 2,
        matchLosses: 2,
        gameWins: 1,
      }),
      makeTeam({ name: 'Unclaimed', owner: null, matchWins: 1, matchLosses: 3, gameWins: 1 }),
    ]);

    // 'ada@example.com' sorts before 'Zoe Zhang'; the unclaimed row pins last.
    expect(names(sortStandings(rows, 'owner', 'ASC'))).toEqual([
      'EmailOnly',
      'FullName',
      'Unclaimed',
    ]);
  });
});
