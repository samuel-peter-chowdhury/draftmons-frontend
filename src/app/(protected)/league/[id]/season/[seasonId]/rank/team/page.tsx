'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  ErrorAlert,
  SortableHeader,
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
import { computeStandings, sortStandings, type TeamRankSortColumn } from '@/lib/standings';
import { formatDifferential, formatWinPct } from '@/lib/teamStats';
import { formatUserDisplayName } from '@/lib/utils';
import type { PaginatedResponse, TeamInput } from '@/types';

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

  const [sortBy, setSortBy] = useState<TeamRankSortColumn | null>(null);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Kept in its own memo so the frozen standings rank is computed once per
  // fetch rather than on every header click.
  const standings = useMemo(() => computeStandings(data?.data ?? []), [data]);
  const sortedStandings = useMemo(
    () => sortStandings(standings, sortBy, sortOrder),
    [standings, sortBy, sortOrder],
  );

  /** Three-state cycle: DESC -> ASC -> default standings order. */
  function handleSort(column: TeamRankSortColumn) {
    if (sortBy !== column) {
      setSortBy(column);
      setSortOrder('DESC');
    } else if (sortOrder === 'DESC') {
      setSortOrder('ASC');
    } else {
      setSortBy(null);
      setSortOrder('DESC');
    }
  }

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
                  <TableHead>#</TableHead>
                  <TableHead>
                    <SortableHeader
                      column="name"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    >
                      Team
                    </SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      column="owner"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    >
                      Owner
                    </SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      column="matchRecord"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    >
                      Match record
                    </SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      column="matchWinPct"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    >
                      Match Win%
                    </SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      column="gameRecord"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    >
                      Game record
                    </SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      column="gameWinPct"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    >
                      Game Win%
                    </SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      column="differential"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    >
                      Differential
                    </SortableHeader>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStandings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No teams in this season yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStandings.map((row) => (
                    <TableRow key={row.team.id}>
                      <TableCell>{row.rank}</TableCell>
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
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
