'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, ErrorAlert, Spinner, TeamLogo } from '@/components';
import { CreateTeamModal } from '@/components/modals/CreateTeamModal';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { useApiSWR } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatUserDisplayName } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import { useLeagueStore, useIsModerator } from '@/stores/useLeagueStore';
import type { PaginatedResponse, PokemonInput, SeasonPokemonInput } from '@/types';

function rosterCountBadge(count: number, min: number, max: number) {
  if (count > max) {
    return <Badge variant="destructive">{count} / {min}-{max} (over max)</Badge>;
  }
  if (count < min) {
    return (
      <Badge variant="warning">{count} / {min}-{max} (under min)</Badge>
    );
  }
  return <Badge variant="secondary">{count} / {min}-{max}</Badge>;
}

function pointTotalBadge(total: number, pointLimit: number) {
  if (total > pointLimit) {
    return <Badge variant="destructive">{total} / {pointLimit} pts (over limit)</Badge>;
  }
  return <Badge variant="secondary">{total} / {pointLimit} pts</Badge>;
}

export default function AdminTeamListPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const router = useRouter();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

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

  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);

  const rosterUrl = buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_BASE, [], {
    seasonId,
    full: true,
    activeRelationsOnly: true,
    pageSize: 9999,
  });
  const { data: rosterData, loading: rosterLoading, error: rosterError, refetch: refetchRoster } =
    useApiSWR<PaginatedResponse<SeasonPokemonInput>>(rosterUrl);

  const rosterByTeamId = useMemo(() => {
    const map = new Map<number, { count: number; points: number; pokemons: PokemonInput[] }>();
    for (const sp of rosterData?.data ?? []) {
      if (!sp.pokemon) continue;
      for (const spt of sp.seasonPokemonTeams ?? []) {
        const entry = map.get(spt.teamId) ?? { count: 0, points: 0, pokemons: [] };
        entry.count += 1;
        entry.points += sp.pointValue;
        entry.pokemons.push(sp.pokemon);
        map.set(spt.teamId, entry);
      }
    }
    return map;
  }, [rosterData]);

  const handleCreateSuccess = () => {
    refetchSeason(leagueId, seasonId);
    refetchRoster();
  };

  const loading = seasonLoading;
  const error = seasonError || rosterError;

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{season?.name ?? 'Season'} Teams</h1>
        {isModerator && <Button onClick={() => setIsCreateTeamModalOpen(true)}>Add Team</Button>}
      </div>

      {error && <ErrorAlert message={error} />}

      {loading && !season && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {season && (!season.teams || season.teams.length === 0) && (
        <p className="text-sm text-muted-foreground">No teams in this season yet.</p>
      )}

      {season && season.teams && season.teams.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {season.teams.map((team) => {
            const stats = rosterByTeamId.get(team.id) ?? { count: 0, points: 0, pokemons: [] };
            return (
              <Card key={team.id}>
                <CardHeader className="items-center pb-3 text-center">
                  <CardTitle className="flex flex-col items-center gap-2 text-base">
                    <TeamLogo
                      logoUrl={team.logoUrl}
                      name={team.name}
                      className="h-16 w-16 rounded-lg sm:h-20 sm:w-20"
                    />
                    <div>
                      <div>{team.name}</div>
                      <div className="mt-0.5 text-sm font-normal text-muted-foreground">
                        {formatUserDisplayName(team.user)}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-center">
                    <Link href={`/league/${leagueId}/season/${seasonId}/admin/team/${team.id}`}>
                      <Button variant="secondary" size="sm">
                        Manage
                      </Button>
                    </Link>
                  </div>
                  {rosterLoading && !rosterData ? (
                    <Spinner size={16} />
                  ) : (
                    <>
                      {stats.pokemons.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                          {stats.pokemons.map((pkmn) => (
                            <PokemonSprite
                              key={pkmn.id}
                              pokemonId={pkmn.id}
                              spriteUrl={pkmn.spritePngUrl}
                              name={pkmn.name}
                              className="h-6 w-6 object-contain"
                              disableClick
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {rosterCountBadge(stats.count, season.minRosterSize, season.maxRosterSize)}
                        {pointTotalBadge(stats.points, season.pointLimit)}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isModerator && league?.leagueUsers && (
        <CreateTeamModal
          open={isCreateTeamModalOpen}
          onOpenChange={setIsCreateTeamModalOpen}
          leagueId={leagueId}
          seasonId={seasonId}
          leagueUsers={league.leagueUsers}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
