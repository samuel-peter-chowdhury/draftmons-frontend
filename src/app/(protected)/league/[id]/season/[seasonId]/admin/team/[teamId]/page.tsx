'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ErrorAlert, Spinner } from '@/components';
import {
  TeamDetailsCard,
  CurrentRosterSection,
  AddPokemonSection,
  RosterHistorySection,
} from './_components';
import { useApiSWR } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { useAuthStore } from '@/stores';
import { useLeagueStore, useIsModerator } from '@/stores/useLeagueStore';
import type { PaginatedResponse, SeasonPokemonInput } from '@/types';

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

  // Full active roster, unpaginated — team rosters are bounded by maxRosterSize.
  const rosterUrl = buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_BASE, [], {
    teamId,
    seasonId,
    full: true,
    activeRelationsOnly: true,
    pageSize: 9999,
  });
  const {
    data: rosterData,
    loading: rosterLoading,
    error: rosterError,
    refetch: refetchRoster,
  } = useApiSWR<PaginatedResponse<SeasonPokemonInput>>(rosterUrl);

  const [rosterRefreshKey, setRosterRefreshKey] = useState(0);

  const handleRosterChanged = useCallback(() => {
    refetchRoster();
    setRosterRefreshKey((k) => k + 1);
  }, [refetchRoster]);

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
          <CurrentRosterSection
            leagueId={leagueId}
            teamId={teamId}
            data={rosterData?.data ?? []}
            loading={rosterLoading}
            error={rosterError}
            minRosterSize={season.minRosterSize}
            maxRosterSize={season.maxRosterSize}
            pointLimit={season.pointLimit}
            onChanged={handleRosterChanged}
          />

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
        </>
      )}
    </div>
  );
}
