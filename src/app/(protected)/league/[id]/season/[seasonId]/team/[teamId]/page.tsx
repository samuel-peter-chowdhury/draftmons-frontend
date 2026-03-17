'use client';

import { Card, CardHeader, CardTitle, ErrorAlert, PokemonTable, Spinner } from '@/components';
import { useFetch } from '@/hooks';
import { BASE_ENDPOINTS, buildUrlWithQuery, formatUserDisplayName } from '@/lib';
import { PaginatedResponse, SeasonPokemonInput, TeamInput } from '@/types';
import { useParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

type SortableColumn =
  | 'name'
  | 'hp'
  | 'attack'
  | 'defense'
  | 'specialAttack'
  | 'specialDefense'
  | 'speed'
  | 'baseStatTotal'
  | 'seasonPoints';

export default function TeamDetailPage() {
  // Pagination & sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<SortableColumn>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const params = useParams<{ id: string; seasonId: string; teamId: string }>();
  const teamId = Number(params.teamId);

  // Fetch team data
  const {
    data: team,
    loading: teamLoading,
    error: teamError,
    refetch: refetchSeason,
  } = useFetch<TeamInput>(
    buildUrlWithQuery(BASE_ENDPOINTS.TEAM_BASE, [teamId], { full: true }),
  );

  // Fetch season pokemon data
  const seasonPokemonUrl = useMemo(    
    () => buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_BASE, [], { page, pageSize, sortBy, sortOrder, teamId, full: true }),
    [page, pageSize, sortBy, sortOrder, teamId],
  );
  const { data, loading, error } =
    useFetch<PaginatedResponse<SeasonPokemonInput>>(seasonPokemonUrl);

  const handleSort = useCallback(
    (column: SortableColumn) => {
      if (sortBy === column) {
        setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
      } else {
        setSortBy(column);
        setSortOrder('DESC');
      }
    },
    [sortBy, sortOrder],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  return (
    <div className="mx-auto max-w-7xl p-4">
      {error && <ErrorAlert message={error} />}

      {loading && !team && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {team && (
        <div className="mb-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <span>{team.name}</span>
                  <div className="mt-1 text-sm font-normal text-muted-foreground">
                    {formatUserDisplayName(team.user)}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {data && (
          <PokemonTable
            data={data}
            variant={'seasonPokemon'}
            loading={loading}
            error={error}
            sortBy={sortBy}
            sortOrder={sortOrder}
            page={page}
            pageSize={pageSize}
            onSort={handleSort}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )
      }
    </div>
  );
}
