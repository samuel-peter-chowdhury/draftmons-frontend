'use client';

import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge, Card, CardContent, CardHeader, CardTitle, Spinner, TeamLogo } from '@/components';
import type { TeamMatchRow } from '@/lib/teamStats';
import { MatchResultSource } from '@/types';

// Only non-replay results get a badge — a REPLAY (or not-yet-recorded) result is
// the unremarkable default. Mirrors `tools/schedule/_components/MatchRow.tsx`.
const RESULT_SOURCE_LABELS: Partial<Record<MatchResultSource, string>> = {
  [MatchResultSource.MANUAL]: 'Manual',
  [MatchResultSource.FORFEIT]: 'Forfeit',
};

const OUTCOME_STYLES: Record<TeamMatchRow['outcome'], string> = {
  WIN: 'border-l-success bg-success/5',
  LOSS: 'border-l-destructive bg-destructive/5',
  UPCOMING: 'border-l-border/[0.15]',
};

function OutcomeMarker({ outcome }: { outcome: TeamMatchRow['outcome'] }) {
  if (outcome === 'UPCOMING') {
    return <span className="w-3 shrink-0 text-xs text-muted-foreground">·</span>;
  }
  return (
    <span
      className={`w-3 shrink-0 text-xs font-semibold ${
        outcome === 'WIN' ? 'text-success' : 'text-destructive'
      }`}
    >
      {outcome === 'WIN' ? 'W' : 'L'}
    </span>
  );
}

function MatchHistoryRow({
  row,
  teamId,
  leagueId,
  seasonId,
}: {
  row: TeamMatchRow;
  teamId: number;
  leagueId: number;
  seasonId: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const resultSourceLabel = row.match.resultSource
    ? (RESULT_SOURCE_LABELS[row.match.resultSource] ?? null)
    : null;

  return (
    <div
      className={`rounded-md border border-l-4 border-border/[0.08] ${OUTCOME_STYLES[row.outcome]}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        className="flex w-full cursor-pointer items-center gap-2 p-3 text-sm"
      >
        {expanded ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="shrink-0 font-medium">{row.week.name}</span>
        <OutcomeMarker outcome={row.outcome} />
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-muted-foreground">vs</span>
          {row.opponent ? (
            <>
              <TeamLogo
                logoUrl={row.opponent.logoUrl}
                name={row.opponent.name}
                className="size-6 shrink-0"
              />
              <Link
                href={`/league/${leagueId}/season/${seasonId}/team/${row.opponent.id}`}
                className="truncate hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {row.opponent.name}
              </Link>
            </>
          ) : (
            <span className="text-muted-foreground">Unknown</span>
          )}
        </span>
        {resultSourceLabel && (
          <Badge variant="secondary" className="shrink-0">
            {resultSourceLabel}
          </Badge>
        )}
        {/*
         * Keyed on the games, not the outcome: a forfeit has a result but no games,
         * and `0-0` next to a W reads as "won a scoreless series" — the badge alone
         * says it better. Conversely a match with games but no recorded winner still
         * shows its score, so this cell never contradicts the expanded body.
         */}
        {row.games.length > 0 ? (
          <span className="shrink-0 font-mono text-sm font-semibold">
            {row.gameWins}-{row.gameLosses}
          </span>
        ) : (
          row.outcome === 'UPCOMING' && (
            <span className="shrink-0 text-xs text-muted-foreground">Upcoming</span>
          )
        )}
      </div>

      {expanded && (
        <div className="border-t border-border/[0.08] px-3 py-2 pl-9 text-sm">
          {row.games.length === 0 ? (
            <p className="text-muted-foreground">No games played.</p>
          ) : (
            <ul className="space-y-1">
              {row.games.map((game) => {
                const gameWon = game.winningTeamId === teamId;
                return (
                  <li key={game.id} className="flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        gameWon ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {gameWon ? '+' : '-'}
                      {game.differential}
                    </span>
                    {game.replayLink && (
                      <a
                        href={game.replayLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Replay
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface TeamMatchHistoryProps {
  rows: TeamMatchRow[];
  teamId: number;
  leagueId: number;
  seasonId: number;
  /** True while the season's weeks are still being fetched. */
  loading?: boolean;
}

export function TeamMatchHistory({
  rows,
  teamId,
  leagueId,
  seasonId,
  loading,
}: TeamMatchHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Match History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner size={20} />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matches scheduled.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <MatchHistoryRow
                key={row.match.id}
                row={row}
                teamId={teamId}
                leagueId={leagueId}
                seasonId={seasonId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
