'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle, ErrorAlert, Spinner } from '@/components';
import { Badge } from '@/components/ui/badge';
import { CreateTeamModal } from '@/components/modals/CreateTeamModal';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatUserDisplayName } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import { useLeagueStore, useIsModerator } from '@/stores/useLeagueStore';
import type { PaginatedResponse, SeasonPokemonInput } from '@/types';

function rosterCountBadge(count: number, min: number, max: number) {
  if (count > max) {
    return <Badge variant="destructive">{count} / {min}-{max} (over max)</Badge>;
  }
  if (count < min) {
    return (
      <Badge className="border-amber-500/50 bg-amber-500/10 text-amber-400">
        {count} / {min}-{max} (under min)
      </Badge>
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
    useFetch<PaginatedResponse<SeasonPokemonInput>>(rosterUrl);

  const rosterByTeamId = useMemo(() => {
    const map = new Map<number, { count: number; points: number }>();
    for (const sp of rosterData?.data ?? []) {
      for (const spt of sp.seasonPokemonTeams ?? []) {
        const entry = map.get(spt.teamId) ?? { count: 0, points: 0 };
        entry.count += 1;
        entry.points += sp.pointValue;
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
            const stats = rosterByTeamId.get(team.id) ?? { count: 0, points: 0 };
            return (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <div>
                      <div>{team.name}</div>
                      <div className="mt-1 text-sm font-normal text-muted-foreground">
                        {formatUserDisplayName(team.user)}
                      </div>
                    </div>
                    <Link href={`/league/${leagueId}/season/${seasonId}/admin/team/${team.id}`}>
                      <Button variant="secondary" size="sm">
                        Manage
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {rosterLoading && !rosterData ? (
                    <Spinner size={16} />
                  ) : (
                    <>
                      {rosterCountBadge(stats.count, season.minRosterSize, season.maxRosterSize)}
                      {pointTotalBadge(stats.points, season.pointLimit)}
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
