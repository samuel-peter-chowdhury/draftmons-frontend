'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLeagueStore, useRecentLeagueStore } from '@/stores';

export default function SeasonLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);
  const fetchLeague = useLeagueStore((s) => s.fetchLeague);
  const fetchSeason = useLeagueStore((s) => s.fetchSeason);
  const league = useLeagueStore((s) => s.league);
  const season = useLeagueStore((s) => s.season);
  const setRecent = useRecentLeagueStore((s) => s.setRecent);

  useEffect(() => {
    if (leagueId) fetchLeague(leagueId);
  }, [leagueId, fetchLeague]);

  useEffect(() => {
    if (leagueId && seasonId) fetchSeason(leagueId, seasonId);
  }, [leagueId, seasonId, fetchSeason]);

  // Remember this season so the sidebar can keep offering its nav after the user
  // navigates to a general page. Guarded on the ids matching the current route so
  // a mid-navigation store still holding the *previous* season isn't cached.
  useEffect(() => {
    if (league?.id === leagueId && season?.id === seasonId) {
      setRecent({
        leagueId,
        leagueAbbreviation: league.abbreviation,
        seasonId,
        seasonName: season.name,
      });
    }
  }, [league, season, leagueId, seasonId, setRecent]);

  return <>{children}</>;
}
