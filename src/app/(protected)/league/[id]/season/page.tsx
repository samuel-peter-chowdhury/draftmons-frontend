'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  Spinner,
  Pagination,
  SortControls,
} from '@/components';
import { CreateSeasonModal } from '@/components/modals/CreateSeasonModal';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatGenerationName } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import type { LeagueInput, SeasonInput, PaginatedResponse } from '@/types';

const SEASON_SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created At' },
];

export default function SeasonsPage() {
  const params = useParams<{ id: string }>();
  const leagueId = Number(params.id);
  const { user: currentUser, isAuthenticated, checkAuth } = useAuthStore();

  // Pagination & sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const [isCreateSeasonModalOpen, setIsCreateSeasonModalOpen] = useState(false);

  // Fetch league data for moderator check
  const {
    data: league,
    loading: leagueLoading,
    error: leagueError,
    refetch: refetchLeague,
  } = useFetch<LeagueInput>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId], { full: true }),
  );

  // Build seasons URL with pagination params
  const seasonsUrl = useMemo(
    () =>
      buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season'], {
        page,
        pageSize,
        sortBy,
        sortOrder,
      }),
    [leagueId, page, pageSize, sortBy, sortOrder],
  );

  // Fetch seasons with server-side pagination
  const {
    data: seasonsData,
    loading: seasonsLoading,
    error: seasonsError,
    refetch: refetchSeasons,
  } = useFetch<PaginatedResponse<SeasonInput>>(seasonsUrl);

  // Ensure auth store is populated on mount
  useEffect(() => {
    if (!isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, checkAuth]);

  // Check if the current user is a moderator of this league
  const isModerator =
    league?.leagueUsers?.some(
      (leagueUser) => leagueUser.userId === currentUser?.id && leagueUser.isModerator,
    ) ?? false;

  const handleRefetch = () => {
    refetchLeague();
    refetchSeasons();
  };

  const handleSortChange = (newSortBy: string, newSortOrder: 'ASC' | 'DESC') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const loading = leagueLoading || seasonsLoading;
  const error = leagueError || seasonsError;
  const seasons = seasonsData?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Seasons</h1>
        {isModerator && (
          <Button onClick={() => setIsCreateSeasonModalOpen(true)}>Add Season</Button>
        )}
      </div>

      <CreateSeasonModal
        open={isCreateSeasonModalOpen}
        onOpenChange={setIsCreateSeasonModalOpen}
        leagueId={leagueId}
        onSuccess={handleRefetch}
      />

      <SortControls
        options={SEASON_SORT_OPTIONS}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        disabled={loading}
        className="mb-4"
      />

      {error && <ErrorAlert message={error} />}

      {loading && !seasonsData && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {seasonsData && (
        <>
          {seasons.length === 0 && seasonsData.total === 0 ? (
            <p className="text-sm text-muted-foreground">No seasons created yet.</p>
          ) : (
            <>
              <div className={loading ? 'pointer-events-none opacity-50' : ''}>
                <div className="grid gap-3 md:grid-cols-2">
                  {seasons.map((season) => (
                    <Card key={season.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{season.name}</span>
                          <span className="text-sm font-normal text-muted-foreground">
                            {season.generation?.name
                              ? formatGenerationName(season.generation.name)
                              : 'Unknown Generation'}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>Status: {season.status.replace(/_/g, ' ')}</div>
                          <div>Point Limit: {season.pointLimit}</div>
                          <div>Max Point Value: {season.maxPointValue}</div>
                        </div>
                        <div className="flex items-center justify-end">
                          <Link href={`/league/${leagueId}/season/${season.id}`}>
                            <Button variant="secondary">Open</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Pagination
                page={seasonsData.page}
                pageSize={pageSize}
                totalPages={seasonsData.totalPages}
                total={seasonsData.total}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                disabled={loading}
                className="mt-4"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
