import { computeTeamRecord, type TeamRecord } from '@/lib/teamStats';
import type { TeamInput } from '@/types';

export interface StandingsRow extends TeamRecord {
  team: TeamInput;
}

function toRow(team: TeamInput): StandingsRow {
  return { team, ...computeTeamRecord(team) };
}

function compareRows(a: StandingsRow, b: StandingsRow): number {
  if (a.matchesPlayed === 0 && b.matchesPlayed === 0) {
    return a.team.name.localeCompare(b.team.name);
  }
  if (a.matchesPlayed === 0) return 1;
  if (b.matchesPlayed === 0) return -1;

  return (
    (b.matchWinPct as number) - (a.matchWinPct as number) ||
    b.matchWins - b.matchLosses - (a.matchWins - a.matchLosses) ||
    (b.gameWinPct as number) - (a.gameWinPct as number) ||
    b.gameWins - b.gameLosses - (a.gameWins - a.gameLosses) ||
    b.differential - a.differential
  );
}

export function computeStandings(teams: TeamInput[]): StandingsRow[] {
  return teams.map(toRow).sort(compareRows);
}
