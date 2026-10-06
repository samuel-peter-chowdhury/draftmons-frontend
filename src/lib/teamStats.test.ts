import { MatchResultSource } from '@/types';
import type {
  GameInput,
  GameStatInput,
  MatchInput,
  PokemonInput,
  TeamInput,
  WeekInput,
} from '@/types';

import { buildTeamMatchHistory, computePokemonStatRows, computeTeamRecord } from './teamStats';

/**
 * These are pure data-in/data-out functions, so the fixtures are plain object
 * literals rather than mocks. The factories below fill in the
 * `BaseApplicationEntity` fields every `*Input` inherits, so each test only
 * states the fields it actually cares about.
 */
const BASE = {
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function makePokemon(id: number, name: string): PokemonInput {
  return {
    ...BASE,
    id,
    dexId: id,
    name,
    hp: 100,
    attack: 100,
    defense: 100,
    specialAttack: 100,
    specialDefense: 100,
    speed: 100,
    baseStatTotal: 600,
    height: 1,
    weight: 1,
    spriteGifUrl: '',
    spritePngUrl: '',
    generationId: 1,
    pokemonTypes: [],
    abilities: [],
  };
}

function makeGame(overrides: Partial<GameInput> & { id: number }): GameInput {
  return {
    ...BASE,
    matchId: 1,
    winningTeamId: 1,
    losingTeamId: 2,
    differential: 0,
    replayLink: '',
    ...overrides,
  };
}

function makeGameStat(
  overrides: Partial<GameStatInput> & { id: number; gameId: number; seasonPokemonId: number },
): GameStatInput {
  return { ...BASE, directKills: 0, indirectKills: 0, deaths: 0, ...overrides };
}

function makeTeam(overrides: Partial<TeamInput> & { id: number }): TeamInput {
  return { ...BASE, name: `Team ${overrides.id}`, seasonId: 1, userId: null, ...overrides };
}

/**
 * `winningTeamId` / `losingTeamId` are declared `number` on `MatchInput`, but the
 * API really sends null for a match with no result yet — which is exactly the
 * UPCOMING case. The cast keeps the fixture honest about the wire shape.
 */
function makeMatch(
  overrides: Partial<Omit<MatchInput, 'winningTeamId' | 'losingTeamId'>> & {
    id: number;
    winningTeamId?: number | null;
    losingTeamId?: number | null;
  },
): MatchInput {
  return {
    ...BASE,
    weekId: 1,
    winningTeamId: null,
    losingTeamId: null,
    ...overrides,
  } as MatchInput;
}

function makeWeek(overrides: Partial<WeekInput> & { id: number; weekNumber: number }): WeekInput {
  return {
    ...BASE,
    name: `Week ${overrides.weekNumber}`,
    seasonId: 1,
    ...overrides,
  };
}

describe('computeTeamRecord', () => {
  it('computes match and game records with win percentages', () => {
    const team = makeTeam({
      id: 1,
      wonMatches: Array.from({ length: 4 }, (_, i) => makeMatch({ id: 100 + i })),
      lostMatches: Array.from({ length: 2 }, (_, i) => makeMatch({ id: 200 + i })),
      wonGames: Array.from({ length: 9 }, (_, i) => makeGame({ id: 300 + i })),
      lostGames: Array.from({ length: 5 }, (_, i) => makeGame({ id: 400 + i })),
    });

    const record = computeTeamRecord(team);

    expect(record.matchWins).toBe(4);
    expect(record.matchLosses).toBe(2);
    expect(record.matchesPlayed).toBe(6);
    expect(record.matchWinPct).toBeCloseTo(4 / 6);
    expect(record.gameWins).toBe(9);
    expect(record.gameLosses).toBe(5);
    expect(record.gamesPlayed).toBe(14);
    expect(record.gameWinPct).toBeCloseTo(9 / 14);
  });

  it('returns null win percentages for a team that has not played', () => {
    const team = makeTeam({
      id: 1,
      wonMatches: [],
      lostMatches: [],
      wonGames: [],
      lostGames: [],
    });

    const record = computeTeamRecord(team);

    expect(record.matchesPlayed).toBe(0);
    expect(record.gamesPlayed).toBe(0);
    expect(record.matchWinPct).toBeNull();
    expect(record.gameWinPct).toBeNull();
    expect(record.differential).toBe(0);
  });

  it('computes differential as won-game margins minus lost-game margins, and allows it to go negative', () => {
    const team = makeTeam({
      id: 1,
      wonGames: [makeGame({ id: 1, differential: 2 })],
      lostGames: [makeGame({ id: 2, differential: 5 }), makeGame({ id: 3, differential: 4 })],
    });

    expect(computeTeamRecord(team).differential).toBe(2 - 9);
  });

  it('treats missing relations from a non-full fetch as zeros instead of throwing', () => {
    const team = makeTeam({ id: 1, wonMatches: [makeMatch({ id: 1 })] });

    const record = computeTeamRecord(team);

    expect(record.matchWins).toBe(1);
    expect(record.matchLosses).toBe(0);
    expect(record.gameWins).toBe(0);
    expect(record.gameLosses).toBe(0);
    expect(record.gamesPlayed).toBe(0);
    expect(record.gameWinPct).toBeNull();
    expect(record.differential).toBe(0);
  });
});

describe('computePokemonStatRows', () => {
  const dragapult = makePokemon(1, 'dragapult');
  const kingambit = makePokemon(2, 'kingambit');

  it('aggregates kills, deaths and games per pokemon and sorts the biggest killer first', () => {
    const roster = [
      { seasonPokemonId: 10, pokemon: dragapult },
      { seasonPokemonId: 11, pokemon: kingambit },
    ];
    const gameStats = [
      makeGameStat({
        id: 1,
        gameId: 1,
        seasonPokemonId: 10,
        directKills: 3,
        indirectKills: 1,
        deaths: 1,
      }),
      makeGameStat({ id: 2, gameId: 2, seasonPokemonId: 10, directKills: 2, deaths: 2 }),
      makeGameStat({ id: 3, gameId: 1, seasonPokemonId: 11, directKills: 1, deaths: 1 }),
    ];

    const rows = computePokemonStatRows(roster, gameStats, new Set([1, 2]));

    expect(rows).toHaveLength(2);
    expect(rows[0].seasonPokemonId).toBe(10);
    expect(rows[0].pokemon.name).toBe('dragapult');
    expect(rows[0].gamesPlayed).toBe(2);
    expect(rows[0].directKills).toBe(5);
    expect(rows[0].indirectKills).toBe(1);
    expect(rows[0].totalKills).toBe(6);
    expect(rows[0].totalDeaths).toBe(3);
    expect(rows[0].kda).toBeCloseTo(2);
    expect(rows[0].killsPerGame).toBeCloseTo(3);
    expect(rows[1].seasonPokemonId).toBe(11);
    expect(rows[1].totalKills).toBe(1);
  });

  it('excludes stats whose gameId is outside teamGameIds', () => {
    const roster = [{ seasonPokemonId: 10, pokemon: dragapult }];
    const gameStats = [
      makeGameStat({
        id: 1,
        gameId: 1,
        seasonPokemonId: 10,
        directKills: 2,
        indirectKills: 1,
        deaths: 1,
      }),
      makeGameStat({
        id: 2,
        gameId: 99,
        seasonPokemonId: 10,
        directKills: 5,
        indirectKills: 5,
        deaths: 5,
      }),
    ];

    const rows = computePokemonStatRows(roster, gameStats, new Set([1]));

    expect(rows).toHaveLength(1);
    expect(rows[0].gamesPlayed).toBe(1);
    expect(rows[0].totalKills).toBe(3);
    expect(rows[0].totalDeaths).toBe(1);
  });

  it('counts every stat in the pool when teamGameIds is null', () => {
    const roster = [{ seasonPokemonId: 10, pokemon: dragapult }];
    const gameStats = [
      makeGameStat({
        id: 1,
        gameId: 1,
        seasonPokemonId: 10,
        directKills: 2,
        indirectKills: 1,
        deaths: 1,
      }),
      makeGameStat({
        id: 2,
        gameId: 99,
        seasonPokemonId: 10,
        directKills: 5,
        indirectKills: 5,
        deaths: 5,
      }),
    ];

    const rows = computePokemonStatRows(roster, gameStats, null);

    expect(rows[0].gamesPlayed).toBe(2);
    expect(rows[0].totalKills).toBe(13);
    expect(rows[0].totalDeaths).toBe(6);
  });

  it('omits a pokemon with no matching stats rather than returning a zero row', () => {
    const roster = [
      { seasonPokemonId: 10, pokemon: dragapult },
      { seasonPokemonId: 11, pokemon: kingambit },
    ];
    const gameStats = [makeGameStat({ id: 1, gameId: 1, seasonPokemonId: 10, directKills: 1 })];

    const rows = computePokemonStatRows(roster, gameStats, new Set([1]));

    expect(rows).toHaveLength(1);
    expect(rows[0].seasonPokemonId).toBe(10);
  });

  it('does not divide by zero when a pokemon has never fainted', () => {
    const roster = [{ seasonPokemonId: 10, pokemon: dragapult }];
    const gameStats = [
      makeGameStat({ id: 1, gameId: 1, seasonPokemonId: 10, directKills: 5, deaths: 0 }),
    ];

    const rows = computePokemonStatRows(roster, gameStats, new Set([1]));

    expect(rows[0].totalDeaths).toBe(0);
    expect(rows[0].kda).toBe(5);
  });

  it('breaks a tie on total kills by kda', () => {
    const roster = [
      { seasonPokemonId: 11, pokemon: kingambit },
      { seasonPokemonId: 10, pokemon: dragapult },
    ];
    const gameStats = [
      // kingambit: 4 kills over 2 games, 4 deaths -> kda 1
      makeGameStat({ id: 1, gameId: 1, seasonPokemonId: 11, directKills: 2, deaths: 2 }),
      makeGameStat({ id: 2, gameId: 2, seasonPokemonId: 11, directKills: 2, deaths: 2 }),
      // dragapult: 4 kills over 2 games, 2 deaths -> kda 2
      makeGameStat({ id: 3, gameId: 1, seasonPokemonId: 10, directKills: 2, deaths: 1 }),
      makeGameStat({ id: 4, gameId: 2, seasonPokemonId: 10, directKills: 2, deaths: 1 }),
    ];

    const rows = computePokemonStatRows(roster, gameStats, new Set([1, 2]));

    expect(rows.map((r) => r.totalKills)).toEqual([4, 4]);
    expect(rows[0].seasonPokemonId).toBe(10);
    expect(rows[1].seasonPokemonId).toBe(11);
  });

  it('returns a short array when fewer than three pokemon qualify, so slice(0, 3) is safe', () => {
    const roster = [
      { seasonPokemonId: 10, pokemon: dragapult },
      { seasonPokemonId: 11, pokemon: kingambit },
    ];
    const gameStats = [
      makeGameStat({ id: 1, gameId: 1, seasonPokemonId: 10, directKills: 2 }),
      makeGameStat({ id: 2, gameId: 1, seasonPokemonId: 11, directKills: 1 }),
    ];

    const rows = computePokemonStatRows(roster, gameStats, new Set([1]));

    expect(rows).toHaveLength(2);
    expect(rows.slice(0, 3)).toHaveLength(2);
  });

  it('returns an empty array when the stat pool is empty', () => {
    const roster = [{ seasonPokemonId: 10, pokemon: dragapult }];

    expect(computePokemonStatRows(roster, [], new Set([1]))).toEqual([]);
  });
});

describe('buildTeamMatchHistory', () => {
  const TEAM_ID = 1;
  const us = makeTeam({ id: TEAM_ID, name: 'Thunder Bolts' });
  const rivals = makeTeam({ id: 2, name: 'Rivals' });
  const smashers = makeTeam({ id: 3, name: 'Smashers' });

  it('builds one row per match involving the team, with opponent, outcome and game score', () => {
    const weeks = [
      makeWeek({
        id: 1,
        weekNumber: 1,
        matches: [
          makeMatch({
            id: 101,
            winningTeamId: TEAM_ID,
            losingTeamId: 2,
            teams: [us, rivals],
            games: [
              makeGame({ id: 1, gameNumber: 1, winningTeamId: TEAM_ID, losingTeamId: 2 }),
              makeGame({ id: 2, gameNumber: 2, winningTeamId: 2, losingTeamId: TEAM_ID }),
              makeGame({ id: 3, gameNumber: 3, winningTeamId: TEAM_ID, losingTeamId: 2 }),
            ],
          }),
        ],
      }),
      makeWeek({
        id: 2,
        weekNumber: 2,
        matches: [
          makeMatch({
            id: 102,
            winningTeamId: 3,
            losingTeamId: TEAM_ID,
            teams: [us, smashers],
            games: [
              makeGame({ id: 4, gameNumber: 1, winningTeamId: 3, losingTeamId: TEAM_ID }),
              makeGame({ id: 5, gameNumber: 2, winningTeamId: 3, losingTeamId: TEAM_ID }),
            ],
          }),
        ],
      }),
    ];

    const rows = buildTeamMatchHistory(weeks, TEAM_ID);

    expect(rows).toHaveLength(2);
    expect(rows[0].week.weekNumber).toBe(1);
    expect(rows[0].opponent?.name).toBe('Rivals');
    expect(rows[0].outcome).toBe('WIN');
    expect(rows[0].gameWins).toBe(2);
    expect(rows[0].gameLosses).toBe(1);
    expect(rows[1].opponent?.name).toBe('Smashers');
    expect(rows[1].outcome).toBe('LOSS');
    expect(rows[1].gameWins).toBe(0);
    expect(rows[1].gameLosses).toBe(2);
  });

  it('orders rows by weekNumber, not by week name', () => {
    const weeks = [
      makeWeek({
        id: 10,
        weekNumber: 10,
        matches: [makeMatch({ id: 110, teams: [us, rivals] })],
      }),
      makeWeek({
        id: 2,
        weekNumber: 2,
        matches: [makeMatch({ id: 102, teams: [us, rivals] })],
      }),
      makeWeek({
        id: 1,
        weekNumber: 1,
        matches: [makeMatch({ id: 101, teams: [us, rivals] })],
      }),
    ];

    const rows = buildTeamMatchHistory(weeks, TEAM_ID);

    expect(rows.map((r) => r.week.weekNumber)).toEqual([1, 2, 10]);
    expect(rows.map((r) => r.week.name)).toEqual(['Week 1', 'Week 2', 'Week 10']);
  });

  it('orders two matches in the same week by match id', () => {
    const weeks = [
      makeWeek({
        id: 1,
        weekNumber: 1,
        matches: [
          makeMatch({ id: 205, teams: [us, smashers] }),
          makeMatch({ id: 104, teams: [us, rivals] }),
        ],
      }),
    ];

    expect(buildTeamMatchHistory(weeks, TEAM_ID).map((r) => r.match.id)).toEqual([104, 205]);
  });

  it('keeps a forfeited match, which has a result but no games', () => {
    const weeks = [
      makeWeek({
        id: 3,
        weekNumber: 3,
        matches: [
          makeMatch({
            id: 103,
            winningTeamId: TEAM_ID,
            losingTeamId: 2,
            resultSource: MatchResultSource.FORFEIT,
            teams: [us, rivals],
            games: [],
          }),
        ],
      }),
    ];

    const rows = buildTeamMatchHistory(weeks, TEAM_ID);

    expect(rows).toHaveLength(1);
    expect(rows[0].outcome).toBe('WIN');
    expect(rows[0].games).toEqual([]);
    expect(rows[0].gameWins).toBe(0);
    expect(rows[0].gameLosses).toBe(0);
    expect(rows[0].match.resultSource).toBe(MatchResultSource.FORFEIT);
  });

  it('marks a match with no winner or loser as upcoming', () => {
    const weeks = [
      makeWeek({
        id: 4,
        weekNumber: 4,
        matches: [makeMatch({ id: 104, teams: [us, rivals], games: [] })],
      }),
    ];

    expect(buildTeamMatchHistory(weeks, TEAM_ID)[0].outcome).toBe('UPCOMING');
  });

  it('excludes matches the team is not playing in', () => {
    const weeks = [
      makeWeek({
        id: 1,
        weekNumber: 1,
        matches: [
          makeMatch({ id: 101, teams: [us, rivals] }),
          makeMatch({ id: 102, teams: [rivals, smashers] }),
        ],
      }),
    ];

    const rows = buildTeamMatchHistory(weeks, TEAM_ID);

    expect(rows).toHaveLength(1);
    expect(rows[0].match.id).toBe(101);
  });

  it('sorts games by gameNumber, treating a missing gameNumber as first', () => {
    const weeks = [
      makeWeek({
        id: 1,
        weekNumber: 1,
        matches: [
          makeMatch({
            id: 101,
            winningTeamId: TEAM_ID,
            losingTeamId: 2,
            teams: [us, rivals],
            games: [
              makeGame({ id: 30, gameNumber: 3 }),
              makeGame({ id: 20 }),
              makeGame({ id: 10, gameNumber: 1 }),
            ],
          }),
        ],
      }),
    ];

    expect(buildTeamMatchHistory(weeks, TEAM_ID)[0].games.map((g) => g.id)).toEqual([20, 10, 30]);
  });

  it('returns null for the opponent when the match has fewer than two teams', () => {
    const weeks = [
      makeWeek({ id: 1, weekNumber: 1, matches: [makeMatch({ id: 101, teams: [us] })] }),
    ];

    expect(buildTeamMatchHistory(weeks, TEAM_ID)[0].opponent).toBeNull();
  });

  it('does not throw on a week whose matches were not hydrated', () => {
    const weeks = [makeWeek({ id: 1, weekNumber: 1 })];

    expect(buildTeamMatchHistory(weeks, TEAM_ID)).toEqual([]);
  });
});
