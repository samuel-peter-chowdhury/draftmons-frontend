'use client';

import { Card, CardHeader, CardTitle, ErrorAlert, PokemonTable, Spinner, TeamLogo } from '@/components';
import { useApiSWR } from '@/hooks';
import { BASE_ENDPOINTS, buildUrlWithQuery, formatUserDisplayName } from '@/lib';
import { PaginatedResponse, SeasonPokemonInput, SortableColumn, TeamInput } from '@/types';
import { useParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

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
  } = useApiSWR<TeamInput>(
    buildUrlWithQuery(BASE_ENDPOINTS.TEAM_BASE, [teamId], { full: true }),
  );

  // Fetch season pokemon data
  const seasonPokemonUrl = useMemo(    
    () => buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_BASE, [], { page, pageSize, sortBy, sortOrder, teamId, full: true }),
    [page, pageSize, sortBy, sortOrder, teamId],
  );
  const { data, loading, error } =
    useApiSWR<PaginatedResponse<SeasonPokemonInput>>(seasonPokemonUrl);

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
      {teamError && <ErrorAlert message={teamError} />}

      {(loading || teamLoading) && !team && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {team && (
        <div className="mb-4">
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle className="flex flex-col items-center gap-3">
                <TeamLogo
                  logoUrl={team.logoUrl}
                  name={team.name}
                  className="h-20 w-20 rounded-xl sm:h-24 sm:w-24 md:h-28 md:w-28"
                />
                <div>
                  <div>{team.name}</div>
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
