'use client';

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ErrorAlert, Spinner } from '@/components';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { useAuthStore } from '@/stores';
import { useLeagueStore, useIsModerator } from '@/stores/useLeagueStore';
import type { PaginatedResponse, WeekInput } from '@/types';

import { AutoGenerateSection, ManualScheduleEditor, TeamSkillLevels } from './_components';

export default function AdminSchedulePage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const router = useRouter();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  const { user } = useAuthStore();
  const isModerator = useIsModerator(user?.id);
  const season = useLeagueStore((s) => s.season);
  const seasonLoading = useLeagueStore((s) => s.seasonLoading);
  const seasonError = useLeagueStore((s) => s.seasonError);
  const refetchSeason = useLeagueStore((s) => s.refetchSeason);

  useEffect(() => {
    if (!seasonLoading && !isModerator && user) {
      router.replace(`/league/${leagueId}/season/${seasonId}`);
    }
  }, [isModerator, seasonLoading, user, leagueId, seasonId, router]);

  const weeksUrl = buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'week'], {
    seasonId,
    full: true,
    pageSize: 100,
    sortBy: 'weekNumber',
    sortOrder: 'ASC',
  });
  const {
    data: weeksData,
    loading: weeksLoading,
    error: weeksError,
    refetch: refetchWeeks,
  } = useFetch<PaginatedResponse<WeekInput>>(weeksUrl);

  const weeks = useMemo(
    () => [...(weeksData?.data ?? [])].sort((a, b) => a.weekNumber - b.weekNumber),
    [weeksData],
  );

  const teams = season?.teams ?? [];

  const handleTeamsChanged = () => refetchSeason(leagueId, seasonId);
  const handleWeeksChanged = () => refetchWeeks();

  if (!isModerator && !seasonLoading) return null;

  const loading = seasonLoading;
  const error = seasonError || weeksError;

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">{season?.name ?? 'Season'} Schedule</h1>

      {error && <ErrorAlert message={error} />}

      {loading && !season && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {season && (
        <div className="flex flex-col gap-6">
          <TeamSkillLevels leagueId={leagueId} teams={teams} onChanged={handleTeamsChanged} />

          <ManualScheduleEditor
            leagueId={leagueId}
            seasonId={seasonId}
            teams={teams}
            weeks={weeks}
            loading={weeksLoading}
            onChanged={handleWeeksChanged}
          />

          <AutoGenerateSection
            leagueId={leagueId}
            seasonId={seasonId}
            numberOfWeeks={season.numberOfWeeks}
            teams={teams}
            weeks={weeks}
            weeksLoading={weeksLoading}
            onScheduleSaved={handleWeeksChanged}
          />
        </div>
      )}
    </div>
  );
}
