'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLeagueStore } from '@/stores';

export default function SeasonLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);
  const fetchLeague = useLeagueStore((s) => s.fetchLeague);
  const fetchSeason = useLeagueStore((s) => s.fetchSeason);

  useEffect(() => {
    if (leagueId) fetchLeague(leagueId);
  }, [leagueId, fetchLeague]);

  useEffect(() => {
    if (leagueId && seasonId) fetchSeason(leagueId, seasonId);
  }, [leagueId, seasonId, fetchSeason]);

  return <>{children}</>;
}
