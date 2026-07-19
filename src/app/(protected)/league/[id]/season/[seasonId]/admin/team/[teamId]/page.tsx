'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ErrorAlert, Spinner } from '@/components';
import { Badge } from '@/components/ui/badge';
import {
  TeamDetailsCard,
  CurrentRosterSection,
  AddPokemonSection,
  RosterHistorySection,
} from './_components';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { useAuthStore } from '@/stores';
import { useLeagueStore, useIsModerator } from '@/stores/useLeagueStore';
import type { PaginatedResponse, SeasonPokemonInput, SortableColumn } from '@/types';

function rosterCountBadge(count: number, min: number, max: number) {
  if (count > max) {
    return <Badge variant="destructive">{count} / {min}-{max} roster (over max)</Badge>;
  }
  if (count < min) {
    return (
      <Badge className="border-amber-500/50 bg-amber-500/10 text-amber-400">
        {count} / {min}-{max} roster (under min)
      </Badge>
    );
  }
  return <Badge variant="secondary">{count} / {min}-{max} roster</Badge>;
}

function pointTotalBadge(total: number, pointLimit: number) {
  if (total > pointLimit) {
    return <Badge variant="destructive">{total} / {pointLimit} pts (over limit)</Badge>;
  }
  return <Badge variant="secondary">{total} / {pointLimit} pts</Badge>;
}

export default function AdminTeamEditPage() {
  const params = useParams<{ id: string; seasonId: string; teamId: string }>();
  const router = useRouter();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);
  const teamId = Number(params.teamId);

  const { user } = useAuthStore();
  const isModerator = useIsModerator(user?.id);
  const league = useLeagueStore((s) => s.league);
  const season = useLeagueStore((s) => s.season);
  const seasonLoading = useLeagueStore((s) => s.seasonLoading);
  const seasonError = useLeagueStore((s) => s.seasonError);
  const refetchSeason = useLeagueStore((s) => s.refetchSeason);

  useEffect(() => {
    if (!seasonLoading && !isModerator && user) {
      router.replace(`/league/${leagueId}/season/${seasonId}`);
    }
  }, [isModerator, seasonLoading, user, leagueId, seasonId, router]);

  const team = season?.teams?.find((t) => t.id === teamId);

  // Roster table (paginated)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<SortableColumn>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const rosterTableUrl = buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_BASE, [], {
    teamId,
    seasonId,
    full: true,
    activeRelationsOnly: true,
    page,
    pageSize,
    sortBy,
    sortOrder,
  });
  const {
    data: rosterTableData,
    loading: rosterTableLoading,
    error: rosterTableError,
    refetch: refetchRosterTable,
  } = useFetch<PaginatedResponse<SeasonPokemonInput>>(rosterTableUrl);

  // Full-roster fetch (unpaginated) for accurate summary aggregation
  const summaryUrl = buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_BASE, [], {
    teamId,
    seasonId,
    full: true,
    activeRelationsOnly: true,
    pageSize: 9999,
  });
  const { data: summaryData, loading: summaryLoading, refetch: refetchSummary } =
    useFetch<PaginatedResponse<SeasonPokemonInput>>(summaryUrl);

  const [rosterRefreshKey, setRosterRefreshKey] = useState(0);

  const handleRosterChanged = useCallback(() => {
    refetchRosterTable();
    refetchSummary();
    setRosterRefreshKey((k) => k + 1);
  }, [refetchRosterTable, refetchSummary]);

  const handleSort = useCallback(
    (column: SortableColumn) => {
      if (sortBy === column) setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
      else {
        setSortBy(column);
        setSortOrder('DESC');
      }
    },
    [sortBy, sortOrder],
  );

  const summary = useMemo(() => {
    const rows = summaryData?.data ?? [];
    return {
      count: summaryData?.total ?? rows.length,
      points: rows.reduce((sum, sp) => sum + sp.pointValue, 0),
    };
  }, [summaryData]);

  const loading = seasonLoading;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      {seasonError && <ErrorAlert message={seasonError} />}

      {loading && !season && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {season && !team && (
        <ErrorAlert title="Team not found" message="This team could not be found in this season." />
      )}

      {season && team && (
        <>
          <TeamDetailsCard
            leagueId={leagueId}
            teamId={teamId}
            team={team}
            leagueUsers={league?.leagueUsers ?? []}
            onSaved={() => refetchSeason(leagueId, seasonId)}
            onDeleted={() => {
              refetchSeason(leagueId, seasonId);
              router.replace(`/league/${leagueId}/season/${seasonId}/admin/team`);
            }}
          />

          <div className="flex flex-wrap items-center gap-2">
            {summaryLoading && !summaryData ? (
              <Spinner size={16} />
            ) : (
              <>
                {rosterCountBadge(summary.count, season.minRosterSize, season.maxRosterSize)}
                {pointTotalBadge(summary.points, season.pointLimit)}
              </>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">Current Roster</h2>
            <CurrentRosterSection
              leagueId={leagueId}
              teamId={teamId}
              data={rosterTableData}
              loading={rosterTableLoading}
              error={rosterTableError}
              sortBy={sortBy}
              sortOrder={sortOrder}
              page={page}
              pageSize={pageSize}
              onSort={handleSort}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              onChanged={handleRosterChanged}
            />
          </div>

          <AddPokemonSection
            leagueId={leagueId}
            teamId={teamId}
            seasonId={seasonId}
            generationId={season.generationId}
            allowMultiTeamPokemon={season.allowMultiTeamPokemon}
            refreshKey={rosterRefreshKey}
            onChanged={handleRosterChanged}
          />

          <RosterHistorySection
            leagueId={leagueId}
            teamId={teamId}
            seasonId={seasonId}
            refreshKey={rosterRefreshKey}
            onChanged={handleRosterChanged}
          />
        </>
      )}
    </div>
  );
}
