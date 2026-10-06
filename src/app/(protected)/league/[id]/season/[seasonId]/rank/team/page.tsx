'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Fragment, useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  ErrorAlert,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TeamLogo,
} from '@/components';
import { useApiSWR } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { buildMatchSummaries, computeStandings } from '@/lib/standings';
import { formatUserDisplayName } from '@/lib/utils';
import type { PaginatedResponse, TeamInput } from '@/types';

import { StandingsExpansionRow } from './_components';

/** Chevron + the eight data columns — kept in one place so the expansion and empty-state cells agree. */
const STANDINGS_COLUMN_COUNT = 9;

function formatWinPct(pct: number | null): string {
  return pct === null ? '—' : `${(pct * 100).toFixed(1)}%`;
}

function formatDifferential(differential: number): string {
  return differential > 0 ? `+${differential}` : String(differential);
}

export default function SeasonTeamRankPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  const teamsUrl = buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'team'], {
    seasonId,
    full: true,
    pageSize: 100,
  });
  const { data, loading, error } = useApiSWR<PaginatedResponse<TeamInput>>(teamsUrl);

  // Keyed by team id, not row index, so a background SWR revalidation — or a
  // future re-sort of the columns — leaves each open detail row with its team.
  const [expandedTeamIds, setExpandedTeamIds] = useState<Set<number>>(new Set());

  const standings = useMemo(() => computeStandings(data?.data ?? []), [data]);

  // Every team in the season arrives in this one page of results, so opponent
  // ids resolve locally — the nested winningTeam/losingTeam objects are not in
  // this payload.
  const teamsById = useMemo(
    () => new Map<number, TeamInput>((data?.data ?? []).map((team) => [team.id, team])),
    [data],
  );

  const summariesByTeamId = useMemo(
    () =>
      new Map((data?.data ?? []).map((team) => [team.id, buildMatchSummaries(team, teamsById)])),
    [data, teamsById],
  );

  const toggleTeam = (teamId: number) => {
    setExpandedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Team Rankings</h1>

      {error && <ErrorAlert message={error} />}

      {loading && !data && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {data && (
        <Card>
          <CardContent className="p-0">
            <Table className="[&_td]:p-2 [&_th]:h-8 [&_th]:px-2 [&_th]:py-1">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <span className="sr-only">Expand</span>
                  </TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Match record</TableHead>
                  <TableHead>Match Win%</TableHead>
                  <TableHead>Game record</TableHead>
                  <TableHead>Game Win%</TableHead>
                  <TableHead>Differential</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={STANDINGS_COLUMN_COUNT}
                      className="text-center text-muted-foreground"
                    >
                      No teams in this season yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  standings.map((row, index) => {
                    const isExpanded = expandedTeamIds.has(row.team.id);

                    return (
                      <Fragment key={row.team.id}>
                        <TableRow
                          onClick={() => toggleTeam(row.team.id)}
                          className="cursor-pointer"
                        >
                          <TableCell>
                            {/*
                              The expand affordance is a real button rather than
                              role="button" on the <tr>: that would replace the
                              row's implicit `row` role, collapsing all nine cells
                              into one accessible name with no header association.
                              The row keeps its onClick, so clicking anywhere in it
                              still toggles.
                            */}
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              aria-controls={`team-matches-${row.team.id}`}
                              aria-label={`Show matches for ${row.team.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTeam(row.team.id);
                              }}
                              className="flex items-center rounded-sm text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            <span className="flex items-center gap-2">
                              <TeamLogo
                                logoUrl={row.team.logoUrl}
                                name={row.team.name}
                                className="h-7 w-7"
                              />
                              <Link
                                href={`/league/${leagueId}/season/${seasonId}/team/${row.team.id}`}
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {row.team.name}
                              </Link>
                            </span>
                          </TableCell>
                          <TableCell>{formatUserDisplayName(row.team.user, 'Unclaimed')}</TableCell>
                          <TableCell>
                            {row.matchWins}-{row.matchLosses}
                          </TableCell>
                          <TableCell>{formatWinPct(row.matchWinPct)}</TableCell>
                          <TableCell>
                            {row.gameWins}-{row.gameLosses}
                          </TableCell>
                          <TableCell>{formatWinPct(row.gameWinPct)}</TableCell>
                          <TableCell>{formatDifferential(row.differential)}</TableCell>
                        </TableRow>

                        {isExpanded && (
                          <StandingsExpansionRow
                            id={`team-matches-${row.team.id}`}
                            summaries={summariesByTeamId.get(row.team.id) ?? []}
                            leagueId={leagueId}
                            seasonId={seasonId}
                            colSpan={STANDINGS_COLUMN_COUNT}
                          />
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
