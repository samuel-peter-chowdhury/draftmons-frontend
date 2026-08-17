import type { TeamInput } from '@/types';

export interface StandingsRow {
  team: TeamInput;
  matchWins: number;
  matchLosses: number;
  matchesPlayed: number;
  matchWinPct: number | null;
  gameWins: number;
  gameLosses: number;
  gamesPlayed: number;
  gameWinPct: number | null;
  differential: number;
}

function toRow(team: TeamInput): StandingsRow {
  const matchWins = team.wonMatches?.length ?? 0;
  const matchLosses = team.lostMatches?.length ?? 0;
  const matchesPlayed = matchWins + matchLosses;
  const gameWins = team.wonGames?.length ?? 0;
  const gameLosses = team.lostGames?.length ?? 0;
  const gamesPlayed = gameWins + gameLosses;
  const differential =
    (team.wonGames ?? []).reduce((sum, g) => sum + g.differential, 0) -
    (team.lostGames ?? []).reduce((sum, g) => sum + g.differential, 0);

  return {
    team,
    matchWins,
    matchLosses,
    matchesPlayed,
    matchWinPct: matchesPlayed > 0 ? matchWins / matchesPlayed : null,
    gameWins,
    gameLosses,
    gamesPlayed,
    gameWinPct: gamesPlayed > 0 ? gameWins / gamesPlayed : null,
    differential,
  };
}

function compareRows(a: StandingsRow, b: StandingsRow): number {
  if (a.matchesPlayed === 0 && b.matchesPlayed === 0) {
    return a.team.name.localeCompare(b.team.name);
  }
  if (a.matchesPlayed === 0) return 1;
  if (b.matchesPlayed === 0) return -1;

  return (
    (b.matchWinPct as number) - (a.matchWinPct as number) ||
    (b.matchWins - b.matchLosses) - (a.matchWins - a.matchLosses) ||
    (b.gameWinPct as number) - (a.gameWinPct as number) ||
    (b.gameWins - b.gameLosses) - (a.gameWins - a.gameLosses) ||
    b.differential - a.differential
  );
}

export function computeStandings(teams: TeamInput[]): StandingsRow[] {
  return teams.map(toRow).sort(compareRows);
}
