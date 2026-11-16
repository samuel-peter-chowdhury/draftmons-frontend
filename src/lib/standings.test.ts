import { MatchResultSource } from '@/types';
import type { GameInput, MatchInput, TeamInput, WeekInput } from '@/types';

import { buildMatchSummaries } from './standings';

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
