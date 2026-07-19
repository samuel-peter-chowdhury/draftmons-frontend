'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { MatchInput } from '@/types';

interface MatchRowProps {
  match: MatchInput;
  leagueId: number;
  seasonId: number;
}

export function MatchRow({ match, leagueId, seasonId }: MatchRowProps) {
  const [expanded, setExpanded] = useState(false);

  const [teamA, teamB] = match.teams ?? [];
  const hasResult = match.winningTeamId != null && match.losingTeamId != null;
  const winningTeam = match.winningTeam;
  const losingTeam = match.losingTeam;

  const games = [...(match.games ?? [])].sort(
    (a, b) => (a.gameNumber ?? 0) - (b.gameNumber ?? 0),
  );

  return (
    <div className="rounded-md border border-border">
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
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1">
          {hasResult && winningTeam && losingTeam ? (
            <>
              <Link
                href={`/league/${leagueId}/season/${seasonId}/team/${winningTeam.id}`}
                className="font-semibold text-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {winningTeam.name}
              </Link>{' '}
              def.{' '}
              <Link
                href={`/league/${leagueId}/season/${seasonId}/team/${losingTeam.id}`}
                className="text-muted-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {losingTeam.name}
              </Link>
            </>
          ) : (
            <>
              <Link
                href={`/league/${leagueId}/season/${seasonId}/team/${teamA.id}`}
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {teamA.name}
              </Link>{' '}
              vs{' '}
              <Link
                href={`/league/${leagueId}/season/${seasonId}/team/${teamB.id}`}
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {teamB.name}
              </Link>
            </>
          )}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 py-2 pl-9 text-sm text-muted-foreground">
          {games.length === 0 ? (
            <p>No games played yet</p>
          ) : (
            <ul className="space-y-1">
              {games.map((game) => (
                <li key={game.id}>
                  Game {game.gameNumber}: {game.winningTeam?.name} def. {game.losingTeam?.name} (
                  {game.differential})
                  {game.replayLink && (
                    <>
                      {' '}
                      —{' '}
                      <a
                        href={game.replayLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Replay
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
