'use client';

import Link from 'next/link';

import { Badge, TableCell, TableRow, TeamLogo } from '@/components';
import type { MatchSummary } from '@/lib/standings';
import { cn } from '@/lib/utils';
import { MatchResultSource } from '@/types';

// Only non-replay results get a badge — a REPLAY (or not-yet-recorded) result is
// the unremarkable default. Same idiom as the schedule page's MatchRow.
const RESULT_SOURCE_LABELS: Partial<Record<MatchResultSource, string>> = {
  [MatchResultSource.MANUAL]: 'Manual',
  [MatchResultSource.FORFEIT]: 'Forfeit',
};

interface StandingsExpansionRowProps {
  /** Target of the triggering button's `aria-controls`. */
  id: string;
  summaries: MatchSummary[];
  leagueId: number;
  seasonId: number;
  /** Number of columns in the standings table, so the detail cell spans all of them. */
  colSpan: number;
}

/**
 * The detail row rendered directly beneath an expanded standings row: one line
 * per decided match, chronologically. Indentation and padding live on an inner
 * div because the page's `Table` sets `[&_td]:p-2`, which outranks a utility
 * class on the cell itself.
 */
export function StandingsExpansionRow({
  id,
  summaries,
  leagueId,
  seasonId,
  colSpan,
}: StandingsExpansionRowProps) {
  return (
    <TableRow id={id} className="bg-muted/20 hover:bg-muted/20">
      <TableCell colSpan={colSpan}>
        <div className="pl-6 text-sm">
          {summaries.length === 0 ? (
            <p className="text-muted-foreground">No matches played yet</p>
          ) : (
            <ul className="space-y-1">
              {summaries.map((summary) => {
                const resultSourceLabel = summary.resultSource
                  ? (RESULT_SOURCE_LABELS[summary.resultSource] ?? null)
                  : null;

                return (
                  <li key={summary.matchId} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'w-4 shrink-0 font-mono text-xs font-semibold',
                        summary.outcome === 'W' ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {summary.outcome}
                    </span>
                    <span
                      className="w-28 shrink-0 truncate text-xs text-muted-foreground"
                      title={summary.weekName ?? undefined}
                    >
                      {summary.weekName ?? '—'}
                    </span>
                    {/* Fixed width rather than flex-1: keeps the score and replay
                        columns aligned across lines without stretching them to
                        the far edge of a nine-column table. */}
                    <span className="flex w-64 shrink-0 items-center gap-1.5">
                      <span className="shrink-0 text-muted-foreground">
                        {summary.outcome === 'W' ? 'def.' : 'lost to'}
                      </span>
                      {summary.opponent ? (
                        <>
                          <TeamLogo
                            logoUrl={summary.opponent.logoUrl}
                            name={summary.opponent.name}
                            className="h-5 w-5"
                          />
                          <Link
                            href={`/league/${leagueId}/season/${seasonId}/team/${summary.opponent.id}`}
                            className="truncate font-medium hover:underline"
                            // Defensive: keeps the link inert to any row-level
                            // click handler, as the standings row itself does.
                            onClick={(e) => e.stopPropagation()}
                          >
                            {summary.opponent.name}
                          </Link>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Unknown team</span>
                      )}
                    </span>
                    <span className="w-10 shrink-0 font-mono text-xs">
                      {summary.hasGames ? `${summary.gameWins}-${summary.gameLosses}` : '—'}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {resultSourceLabel && <Badge variant="secondary">{resultSourceLabel}</Badge>}
                      {summary.replays.map((replay, index) => (
                        <a
                          key={replay.replayLink}
                          href={replay.replayLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          // Most games have no recorded gameNumber, so fall back
                          // to the replay's position — which keeps every label
                          // distinct instead of rendering "R0" several times.
                          aria-label={
                            replay.gameNumber === null
                              ? `Replay ${index + 1} of this match`
                              : `Replay for game ${replay.gameNumber}`
                          }
                          className="font-mono text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          R{replay.gameNumber ?? index + 1}
                        </a>
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
