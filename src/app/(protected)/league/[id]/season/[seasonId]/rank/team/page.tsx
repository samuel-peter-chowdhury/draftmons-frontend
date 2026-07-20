'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import { Card, CardContent, ErrorAlert, Spinner } from '@/components';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { computeStandings } from '@/lib/standings';
import { formatUserDisplayName } from '@/lib/utils';
import type { PaginatedResponse, TeamInput } from '@/types';

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
  const { data, loading, error } = useFetch<PaginatedResponse<TeamInput>>(teamsUrl);

  const standings = useMemo(() => computeStandings(data?.data ?? []), [data]);

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
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No teams in this season yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  standings.map((row, index) => (
                    <TableRow key={row.team.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/league/${leagueId}/season/${seasonId}/team/${row.team.id}`}
                          className="hover:underline"
                        >
                          {row.team.name}
                        </Link>
                      </TableCell>
                      <TableCell>{formatUserDisplayName(row.team.user)}</TableCell>
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
