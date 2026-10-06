'use client';

import { useParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { ErrorAlert, PokemonModal, PokemonTable, Spinner } from '@/components';
import { ROSTER_PAGE_SIZE } from '@/components/comparison';
import { useApiSWR, usePokemonModal } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { buildTeamMatchHistory, computePokemonStatRows } from '@/lib/teamStats';
import type {
  PaginatedResponse,
  SeasonPokemonInput,
  SortableColumn,
  TeamInput,
  WeekInput,
} from '@/types';

import {
  CoachCard,
  PokemonStatsTable,
  TeamHeaderCard,
  TeamMatchHistory,
  TopPerformersCard,
} from './_components';

export default function TeamDetailPage() {
  // Pagination & sorting state for the roster table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<SortableColumn>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const params = useParams<{ id: string; seasonId: string; teamId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);
  const teamId = Number(params.teamId);

  // Fetch team data
  const {
    data: team,
    loading: teamLoading,
    error: teamError,
  } = useApiSWR<TeamInput>(buildUrlWithQuery(BASE_ENDPOINTS.TEAM_BASE, [teamId], { full: true }));

  // Fetch season pokemon data for the paginated roster table
  const seasonPokemonUrl = useMemo(
    () =>
      buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_BASE, [], {
        page,
        pageSize,
        sortBy,
        sortOrder,
        teamId,
        full: true,
        activeRelationsOnly: true,
      }),
    [page, pageSize, sortBy, sortOrder, teamId],
  );
  const { data, loading, error } =
    useApiSWR<PaginatedResponse<SeasonPokemonInput>>(seasonPokemonUrl);

  // A second, unpaginated roster fetch feeds the stats sections. Reading them off
  // the table's page would make "top performers" change as you page the table.
  const rosterStatsUrl = useMemo(
    () =>
      buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_BASE, [], {
        teamId,
        full: true,
        activeRelationsOnly: true,
        pageSize: ROSTER_PAGE_SIZE,
      }),
    [teamId],
  );
  const {
    data: rosterStatsData,
    loading: rosterStatsLoading,
    error: rosterStatsError,
  } = useApiSWR<PaginatedResponse<SeasonPokemonInput>>(rosterStatsUrl);

  // The season's full schedule, for match history
  const weeksUrl = useMemo(
    () =>
      buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'week'], {
        seasonId,
        full: true,
        pageSize: 100,
        sortBy: 'weekNumber',
        sortOrder: 'ASC',
      }),
    [leagueId, seasonId],
  );
  const {
    data: weeksData,
    loading: weeksLoading,
    error: weeksError,
  } = useApiSWR<PaginatedResponse<WeekInput>>(weeksUrl);

  const roster = useMemo(
    () =>
      (rosterStatsData?.data ?? []).flatMap((sp) =>
        sp.pokemon ? [{ seasonPokemonId: sp.id, pokemon: sp.pokemon }] : [],
      ),
    [rosterStatsData],
  );

  const rosterGameStats = useMemo(
    () => (rosterStatsData?.data ?? []).flatMap((sp) => sp.gameStats ?? []),
    [rosterStatsData],
  );

  // A SeasonPokemon's gameStats are season-wide, so a mon acquired mid-season
  // arrives carrying kills it earned for its previous team. Restrict to this
  // team's own games. Null until the team loads, which keeps the sections empty
  // rather than briefly crediting every game in the season.
  const teamGameIds = useMemo(() => {
    if (!team) return null;
    return new Set([...(team.wonGames ?? []), ...(team.lostGames ?? [])].map((g) => g.id));
  }, [team]);

  const statRows = useMemo(
    () => (teamGameIds ? computePokemonStatRows(roster, rosterGameStats, teamGameIds) : []),
    [roster, rosterGameStats, teamGameIds],
  );

  const matchRows = useMemo(
    () => buildTeamMatchHistory(weeksData?.data ?? [], teamId),
    [weeksData, teamId],
  );

  // A second modal instance: `PokemonTable` owns its own internally and takes no
  // click handler, so the new sections need their own.
  const {
    pokemonId: modalPokemonId,
    seasonPokemonId: modalSeasonPokemonId,
    open: modalOpen,
    openModal,
    onOpenChange,
  } = usePokemonModal();

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
      {teamError && <ErrorAlert message={teamError} />}
      {error && <ErrorAlert message={error} />}
      {rosterStatsError && <ErrorAlert message={rosterStatsError} />}
      {weeksError && <ErrorAlert message={weeksError} />}

      {teamLoading && !team && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {team && (
        <div className="space-y-4">
          <TeamHeaderCard team={team} />

          <div className="grid gap-4 md:grid-cols-2">
            <CoachCard user={team.user} />
            <TopPerformersCard
              rows={statRows}
              loading={rosterStatsLoading}
              onSpriteClick={openModal}
            />
          </div>

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
              leagueId={leagueId}
            />
          )}

          <PokemonStatsTable
            rows={statRows}
            loading={rosterStatsLoading}
            onSpriteClick={openModal}
          />

          <TeamMatchHistory
            rows={matchRows}
            teamId={teamId}
            leagueId={leagueId}
            seasonId={seasonId}
            loading={weeksLoading}
          />

          <PokemonModal
            pokemonId={modalPokemonId}
            open={modalOpen}
            onOpenChange={onOpenChange}
            seasonPokemonId={modalSeasonPokemonId}
            leagueId={leagueId}
          />
        </div>
      )}
    </div>
  );
}
