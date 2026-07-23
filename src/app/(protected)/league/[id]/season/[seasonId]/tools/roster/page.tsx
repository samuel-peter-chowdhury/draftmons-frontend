'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';

import { ErrorAlert, Spinner } from '@/components';
import { PokemonModal } from '@/components/pokemon/PokemonModal';
import { useApiSWR, usePokemonModal } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { useLeagueStore } from '@/stores';
import type { PaginatedResponse, SeasonPokemonInput } from '@/types';

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

  const rosterUrl = buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_BASE, [], {
    seasonId,
    full: true,
    activeRelationsOnly: true,
    pageSize: 500,
    sortBy: 'pointValue',
    sortOrder: 'DESC',
  });
  const {
    data: rosterData,
    loading: rosterLoading,
    error: rosterError,
  } = useApiSWR<PaginatedResponse<SeasonPokemonInput>>(rosterUrl);

  // Group active roster rows by teamId — a row may belong to more than one
  // team when allowMultiTeamPokemon is enabled for the season.
  const rosterByTeamId = useMemo(() => {
    const map = new Map<number, SeasonPokemonInput[]>();
    for (const row of rosterData?.data ?? []) {
      for (const spt of row.seasonPokemonTeams ?? []) {
        if (!map.has(spt.teamId)) map.set(spt.teamId, []);
        map.get(spt.teamId)!.push(row);
      }
    }
    return map;
  }, [rosterData]);

  const teams = useMemo(
    () => [...(season?.teams ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [season],
  );

  const loading = seasonLoading || rosterLoading;
  const error = seasonError || rosterError;

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
