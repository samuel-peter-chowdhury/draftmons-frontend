import { MatchResultSource } from '@/types';
import type { GameInput, MatchInput, TeamInput, WeekInput } from '@/types';

import {
  buildMatchSummaries,
  computeStandings,
  sortStandings,
  type StandingsRow,
  type TeamRankSortColumn,
} from './standings';

/**
 * The payload this helper reads comes from the standings page's single
 * `full: true` team request, so fixtures carry only the fields
 * `TeamController.getFullRelations()` actually loads — no nested
 * `winningTeam`/`losingTeam` objects, which sit behind the `match.full` group.
 */
const TIMESTAMPS = {
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function makeTeam(id: number, name: string): TeamInput {
  return { ...TIMESTAMPS, id, name, seasonId: 1, userId: null };
}

function makeWeek(weekNumber: number): WeekInput {
  return { ...TIMESTAMPS, id: weekNumber, name: `Week ${weekNumber}`, weekNumber, seasonId: 1 };
}

function makeMatch(
  id: number,
  winningTeamId: number,
  losingTeamId: number,
  week: WeekInput | undefined,
  resultSource: MatchResultSource | null = MatchResultSource.REPLAY,
): MatchInput {
  return {
    ...TIMESTAMPS,
    id,
    weekId: week?.id ?? 0,
    winningTeamId,
    losingTeamId,
    resultSource,
    week,
  };
}

/**
 * `gameNumber` is genuinely nullable — `game.game_number` is a nullable column and
 * only the manual-upload flow populates it, so most rows in a real league carry
 * `null`. `GameInput` types the field as optional rather than nullable, hence the
 * one cast here: the fixture reflects what the API actually sends.
 */
function makeGame(
  id: number,
  matchId: number,
  gameNumber: number | null,
  replayLink = `https://replay.pokemonshowdown.com/g${id}`,
): GameInput {
  return {
    ...TIMESTAMPS,
    id,
    matchId,
    winningTeamId: 0,
    losingTeamId: 0,
    differential: 1,
    replayLink,
    gameNumber,
  } as GameInput;
}

const SUBJECT = makeTeam(1, 'Thunder Bolts');
const ROCKETS = makeTeam(2, 'Rocket Grunts');
const VIPERS = makeTeam(3, 'Viridian Vipers');
const TIDE = makeTeam(4, 'Cerulean Tide');

const teamsById = new Map<number, TeamInput>(
  [SUBJECT, ROCKETS, VIPERS, TIDE].map((team) => [team.id, team]),
);

describe('buildMatchSummaries', () => {
  it('orders matches by week and scopes each score to its own match', () => {
    // Weeks arrive out of order (3, 1) in wonMatches to prove the sort.
    const team: TeamInput = {
      ...SUBJECT,
      wonMatches: [
        makeMatch(30, SUBJECT.id, TIDE.id, makeWeek(3)),
        makeMatch(10, SUBJECT.id, ROCKETS.id, makeWeek(1)),
      ],
      lostMatches: [makeMatch(20, VIPERS.id, SUBJECT.id, makeWeek(2))],
      wonGames: [
        makeGame(101, 10, 1),
        makeGame(102, 10, 2),
        makeGame(103, 10, 4),
        makeGame(201, 20, 2),
        makeGame(301, 30, 1),
        makeGame(302, 30, 2),
      ],
      lostGames: [
        makeGame(104, 10, 3),
        makeGame(202, 20, 1),
        makeGame(203, 20, 3),
        makeGame(204, 20, 4),
      ],
    };

    const summaries = buildMatchSummaries(team, teamsById);

    expect(summaries).toHaveLength(3);

    expect(summaries[0]).toMatchObject({
      matchId: 10,
      outcome: 'W',
      weekName: 'Week 1',
      weekNumber: 1,
      opponentId: ROCKETS.id,
      opponent: ROCKETS,
      gameWins: 3,
      gameLosses: 1,
      hasGames: true,
    });

    expect(summaries[1]).toMatchObject({
      matchId: 20,
      outcome: 'L',
      weekName: 'Week 2',
      weekNumber: 2,
      opponentId: VIPERS.id,
      opponent: VIPERS,
      gameWins: 1,
      gameLosses: 3,
      hasGames: true,
    });

    expect(summaries[2]).toMatchObject({
      matchId: 30,
      outcome: 'W',
      weekName: 'Week 3',
      weekNumber: 3,
      opponentId: TIDE.id,
      opponent: TIDE,
      gameWins: 2,
      gameLosses: 0,
      hasGames: true,
    });
  });

  it('breaks a week tie by ascending match id', () => {
    const week = makeWeek(1);
    const team: TeamInput = {
      ...SUBJECT,
      wonMatches: [
        makeMatch(42, SUBJECT.id, TIDE.id, week),
        makeMatch(7, SUBJECT.id, ROCKETS.id, week),
      ],
    };

    expect(buildMatchSummaries(team, teamsById).map((s) => s.matchId)).toEqual([7, 42]);
  });

  it('reports a zero-game forfeit as having no games rather than 0-0', () => {
    const team: TeamInput = {
      ...SUBJECT,
      wonMatches: [makeMatch(50, SUBJECT.id, ROCKETS.id, makeWeek(1), MatchResultSource.FORFEIT)],
      wonGames: [],
      lostGames: [],
    };

    const [summary] = buildMatchSummaries(team, teamsById);

    expect(summary.hasGames).toBe(false);
    expect(summary.gameWins).toBe(0);
    expect(summary.gameLosses).toBe(0);
    expect(summary.resultSource).toBe(MatchResultSource.FORFEIT);
    expect(summary.replays).toEqual([]);
  });

  it('keeps two matches against the same opponent as separate entries', () => {
    const team: TeamInput = {
      ...SUBJECT,
      wonMatches: [makeMatch(60, SUBJECT.id, ROCKETS.id, makeWeek(1))],
      lostMatches: [makeMatch(61, ROCKETS.id, SUBJECT.id, makeWeek(4))],
      wonGames: [makeGame(601, 60, 1)],
      lostGames: [makeGame(611, 61, 1)],
    };

    const summaries = buildMatchSummaries(team, teamsById);

    expect(summaries).toHaveLength(2);
    expect(summaries.map((s) => [s.outcome, s.weekName, s.gameWins, s.gameLosses])).toEqual([
      ['W', 'Week 1', 1, 0],
      ['L', 'Week 4', 0, 1],
    ]);
    expect(summaries.every((s) => s.opponentId === ROCKETS.id)).toBe(true);
  });

  it('returns a null opponent without throwing when the id is not in the map', () => {
    const team: TeamInput = {
      ...SUBJECT,
      wonMatches: [makeMatch(70, SUBJECT.id, 999, makeWeek(1))],
    };

    const [summary] = buildMatchSummaries(team, teamsById);

    expect(summary.opponent).toBeNull();
    expect(summary.opponentId).toBe(999);
  });

  it('derives the opponent from the team ids, not from the outcome bucket', () => {
    // Malformed: the subject is the winner but the match sits in lostMatches.
    // Deriving from ids keeps the opponent from pointing back at the subject.
    const team: TeamInput = {
      ...SUBJECT,
      lostMatches: [makeMatch(80, SUBJECT.id, VIPERS.id, makeWeek(1))],
    };

    const [summary] = buildMatchSummaries(team, teamsById);

    expect(summary.opponentId).toBe(VIPERS.id);
    expect(summary.outcome).toBe('L');
  });

  it('returns an empty list when the relation arrays are absent', () => {
    expect(buildMatchSummaries(SUBJECT, teamsById)).toEqual([]);
  });

  it('sorts a match with no week after every match that has one', () => {
    const team: TeamInput = {
      ...SUBJECT,
      wonMatches: [
        makeMatch(90, SUBJECT.id, ROCKETS.id, undefined),
        makeMatch(91, SUBJECT.id, TIDE.id, makeWeek(5)),
      ],
    };

    const summaries = buildMatchSummaries(team, teamsById);

    expect(summaries.map((s) => s.matchId)).toEqual([91, 90]);
    expect(summaries[1].weekName).toBeNull();
    expect(summaries[1].weekNumber).toBeNull();
  });

  it('keeps only games with a replay link, ascending by game number', () => {
    const team: TeamInput = {
      ...SUBJECT,
      wonMatches: [makeMatch(100, SUBJECT.id, ROCKETS.id, makeWeek(1))],
      wonGames: [
        makeGame(1003, 100, 3, 'https://replay.example/g3'),
        makeGame(1001, 100, 1, 'https://replay.example/g1'),
      ],
      lostGames: [makeGame(1002, 100, 2, '')],
    };

    const [summary] = buildMatchSummaries(team, teamsById);

    expect(summary.replays).toEqual([
      { gameNumber: 1, replayLink: 'https://replay.example/g1' },
      { gameNumber: 3, replayLink: 'https://replay.example/g3' },
    ]);
    expect(summary.gameWins).toBe(2);
    expect(summary.gameLosses).toBe(1);
  });

  // game.game_number is a nullable column that only the manual-upload flow
  // populates, so most games in a real league have no number at all.
  it('leaves an unrecorded game number null rather than reporting it as game 0', () => {
    const team: TeamInput = {
      ...SUBJECT,
      wonMatches: [makeMatch(120, SUBJECT.id, ROCKETS.id, makeWeek(1))],
      wonGames: [makeGame(1202, 120, null), makeGame(1201, 120, null)],
      lostGames: [],
    };

    const [summary] = buildMatchSummaries(team, teamsById);

    expect(summary.replays.map((r) => r.gameNumber)).toEqual([null, null]);
  });

  it('orders unnumbered games by game id so their display position is deterministic', () => {
    const team: TeamInput = {
      ...SUBJECT,
      wonMatches: [makeMatch(130, SUBJECT.id, ROCKETS.id, makeWeek(1))],
      // Deliberately supplied newest-first, and split across the two arrays the
      // way the API returns them (won games first, then lost).
      wonGames: [
        makeGame(1303, 130, null, 'https://r/3'),
        makeGame(1301, 130, null, 'https://r/1'),
      ],
      lostGames: [makeGame(1302, 130, null, 'https://r/2')],
    };

    const [summary] = buildMatchSummaries(team, teamsById);

    expect(summary.replays.map((r) => r.replayLink)).toEqual([
      'https://r/1',
      'https://r/2',
      'https://r/3',
    ]);
  });

  it('sorts numbered games ahead of unnumbered ones', () => {
    const team: TeamInput = {
      ...SUBJECT,
      wonMatches: [makeMatch(140, SUBJECT.id, ROCKETS.id, makeWeek(1))],
      wonGames: [
        makeGame(1402, 140, null, 'https://r/none'),
        makeGame(1401, 140, 2, 'https://r/g2'),
      ],
      lostGames: [makeGame(1400, 140, 1, 'https://r/g1')],
    };

    const [summary] = buildMatchSummaries(team, teamsById);

    expect(summary.replays).toEqual([
      { gameNumber: 1, replayLink: 'https://r/g1' },
      { gameNumber: 2, replayLink: 'https://r/g2' },
      { gameNumber: null, replayLink: 'https://r/none' },
    ]);
  });

  it('tolerates a null result source and a team with only losses', () => {
    const team: TeamInput = {
      ...SUBJECT,
      lostMatches: [makeMatch(110, VIPERS.id, SUBJECT.id, makeWeek(1), null)],
    };

    const [summary] = buildMatchSummaries(team, teamsById);

    expect(summary.resultSource).toBeNull();
    expect(summary.outcome).toBe('L');
  });
});

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

function makeStandingsTeam({
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
    makeStandingsTeam({
      name: 'Delta',
      owner: { firstName: 'Zoe', lastName: 'Zhang' },
      matchWins: 8,
      matchLosses: 1,
      gameWins: 20,
      gameLosses: 5,
      differential: 50,
    }),
    makeStandingsTeam({
      name: 'Charlie',
      owner: { firstName: 'Mia', lastName: 'Moore' },
      matchWins: 8,
      matchLosses: 3,
      gameWins: 18,
      gameLosses: 9,
      differential: 30,
    }),
    makeStandingsTeam({
      name: 'Bravo',
      owner: { firstName: 'Ada', lastName: 'Adams' },
      matchWins: 5,
      matchLosses: 0,
      gameWins: 12,
      gameLosses: 2,
      differential: 40,
    }),
    makeStandingsTeam({
      name: 'Alpha',
      owner: null,
      matchWins: 5,
      matchLosses: 2,
      gameWins: 10,
      gameLosses: 10,
      differential: -10,
    }),
    makeStandingsTeam({ name: 'Echo', owner: { firstName: 'Ben', lastName: 'Brown' } }),
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
      makeStandingsTeam({
        name: 'TiedFirst',
        matchWins: 4,
        matchLosses: 0,
        gameWins: 5,
        gameLosses: 1,
        differential: 7,
      }),
      makeStandingsTeam({
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
      makeStandingsTeam({
        name: 'Played',
        matchWins: 3,
        matchLosses: 1,
        gameWins: 6,
        gameLosses: 2,
        differential: 5,
      }),
      makeStandingsTeam({
        name: 'AlsoPlayed',
        matchWins: 1,
        matchLosses: 3,
        gameWins: 2,
        gameLosses: 6,
        differential: -5,
      }),
      makeStandingsTeam({ name: 'Idle' }),
      makeStandingsTeam({ name: 'AlsoIdle' }),
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
      makeStandingsTeam({
        name: 'Zed',
        owner: { firstName: 'Zoe', lastName: 'Zhang' },
        matchWins: 1,
        matchLosses: 3,
        gameWins: 2,
        gameLosses: 6,
      }),
      makeStandingsTeam({
        name: 'Ann',
        owner: { firstName: 'Ada', lastName: 'Adams' },
        matchWins: 3,
        matchLosses: 1,
        gameWins: 6,
        gameLosses: 2,
      }),
      makeStandingsTeam({
        name: 'OrphanA',
        owner: null,
        matchWins: 2,
        matchLosses: 2,
        gameWins: 4,
      }),
      makeStandingsTeam({
        name: 'OrphanB',
        owner: null,
        matchWins: 2,
        matchLosses: 2,
        gameWins: 4,
      }),
    ]);

    expect(names(sortStandings(rows, 'owner', 'DESC')).slice(-2)).toEqual(['OrphanA', 'OrphanB']);
    expect(names(sortStandings(rows, 'owner', 'ASC')).slice(-2)).toEqual(['OrphanA', 'OrphanB']);
  });
});

describe('sortStandings name keys', () => {
  it('sorts the team column case-insensitively', () => {
    const rows = computeStandings([
      makeStandingsTeam({ name: 'Banana', matchWins: 1, gameWins: 1 }),
      makeStandingsTeam({ name: 'apple', matchWins: 1, gameWins: 1 }),
    ]);

    expect(names(sortStandings(rows, 'name', 'ASC'))).toEqual(['apple', 'Banana']);
  });

  it('sorts the owner column on the rendered display name for every name shape', () => {
    const rows = computeStandings([
      makeStandingsTeam({
        name: 'FullName',
        owner: { firstName: 'Zoe', lastName: 'Zhang' },
        matchWins: 3,
        matchLosses: 1,
        gameWins: 1,
      }),
      makeStandingsTeam({
        name: 'EmailOnly',
        owner: { email: 'ada@example.com' },
        matchWins: 2,
        matchLosses: 2,
        gameWins: 1,
      }),
      makeStandingsTeam({
        name: 'Unclaimed',
        owner: null,
        matchWins: 1,
        matchLosses: 3,
        gameWins: 1,
      }),
    ]);

    // 'ada@example.com' sorts before 'Zoe Zhang'; the unclaimed row pins last.
    expect(names(sortStandings(rows, 'owner', 'ASC'))).toEqual([
      'EmailOnly',
      'FullName',
      'Unclaimed',
    ]);
  });
});
