'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';

import { ErrorAlert, Spinner } from '@/components';
import { PokemonModal } from '@/components/pokemon/PokemonModal';
import { useApiSWR, usePokemonModal } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { useLeagueStore } from '@/stores';
import type { PaginatedResponse, SeasonPokemonInput, TeamInput } from '@/types';

import { TeamRosterCard } from './_components';

export default function SeasonRosterPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  const {
    pokemonId: modalPokemonId,
    seasonPokemonId: modalSeasonPokemonId,
    open: modalOpen,
    openModal,
    onOpenChange,
  } = usePokemonModal();

  const season = useLeagueStore((s) => s.season);
  const seasonLoading = useLeagueStore((s) => s.seasonLoading);
  const seasonError = useLeagueStore((s) => s.seasonError);

  // Fetch teams (with their roster nested) directly instead of pulling every
  // season-pokemon row and grouping client-side — the season-pokemon pool spans
  // the whole eligible dex and can exceed any reasonable pageSize, silently
  // dropping low point-value picks from the response. Team rosters are small
  // and bounded by team count, so a single full=true team fetch can't truncate.
  const teamsUrl = buildUrlWithQuery(BASE_ENDPOINTS.TEAM_BASE, [], {
    seasonId,
    full: true,
    pageSize: 100,
    sortBy: 'name',
    sortOrder: 'ASC',
  });
  const {
    data: teamsData,
    loading: teamsLoading,
    error: teamsError,
  } = useApiSWR<PaginatedResponse<TeamInput>>(teamsUrl);

  const teams = useMemo(
    () => [...(teamsData?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [teamsData],
  );

  // Team's full relations don't support activeRelationsOnly, so drop inactive
  // seasonPokemonTeams (e.g. traded-away pokemon) here — a handful of rows per
  // team, cheap to filter client-side.
  const rosterByTeamId = useMemo(() => {
    const map = new Map<number, SeasonPokemonInput[]>();
    for (const team of teams) {
      const rows = (team.seasonPokemonTeams ?? [])
        .filter((spt) => spt.isActive && spt.seasonPokemon)
        .map((spt) => spt.seasonPokemon!);
      map.set(team.id, rows);
    }
    return map;
  }, [teams]);

  const loading = seasonLoading || teamsLoading;
  const error = seasonError || teamsError;

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Roster</h1>

      {error && <ErrorAlert message={error} />}

      {loading && !season && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {season && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <TeamRosterCard
              key={team.id}
              team={team}
              rosterRows={rosterByTeamId.get(team.id) ?? []}
              season={season}
              onSpriteClick={openModal}
            />
          ))}
        </div>
      )}

      <PokemonModal
        pokemonId={modalPokemonId}
        open={modalOpen}
        onOpenChange={onOpenChange}
        seasonPokemonId={modalSeasonPokemonId}
        leagueId={leagueId}
      />
    </div>
  );
}
