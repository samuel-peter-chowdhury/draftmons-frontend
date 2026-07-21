'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge, Card, CardContent, CardHeader, CardTitle, ErrorAlert, LeagueLogo, Skeleton, TeamLogo } from '@/components';
import type { ApiError } from '@/lib/api';
import { LeagueApi } from '@/lib/api';
import { formatSeasonStatus } from '@/lib/utils';
import type { LeagueUserInput, SeasonInput, TeamInput } from '@/types';

interface MyLeagueCardState {
  loading: boolean;
  error: string | null;
  hasSeasons: boolean;
  season: SeasonInput | null;
  team: TeamInput | null;
  opponentTeamName: string | null;
  opponentTeamId: number | null;
}

const INITIAL_STATE: MyLeagueCardState = {
  loading: true,
  error: null,
  hasSeasons: true,
  season: null,
  team: null,
  opponentTeamName: null,
  opponentTeamId: null,
};

function useMyLeagueCardData(leagueId: number, userId: number): MyLeagueCardState {
  const [state, setState] = useState<MyLeagueCardState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const seasonsResp = await LeagueApi.getSeasons(leagueId);
        if (cancelled) return;

        if (seasonsResp.data.length === 0) {
          setState({ ...INITIAL_STATE, loading: false, hasSeasons: false });
          return;
        }

        const currentSeason = seasonsResp.data.reduce((latest, s) => (s.id > latest.id ? s : latest));

        const teamsResp = await LeagueApi.getTeams(leagueId, { seasonId: currentSeason.id, userId });
        if (cancelled) return;

        const myTeam = teamsResp.data.length > 0 ? teamsResp.data[0] : null;

        let opponentTeamName: string | null = null;
        let opponentTeamId: number | null = null;

        if (myTeam) {
          const weeksResp = await LeagueApi.getWeeks(leagueId, {
            seasonId: currentSeason.id,
            full: true,
          });
          if (cancelled) return;

          const myMatches = (weeksResp.data ?? []).flatMap((week) =>
            (week.matches ?? [])
              .filter((match) => (match.teams ?? []).some((t) => t.id === myTeam.id))
              .map((match) => ({ match, weekNumber: week.weekNumber })),
          );

          if (myMatches.length > 0) {
            const latest = myMatches.reduce((a, b) => (b.weekNumber > a.weekNumber ? b : a));
            const isUnplayed = !latest.match.winningTeamId && !latest.match.losingTeamId;
            if (isUnplayed) {
              const opponent = (latest.match.teams ?? []).find((t) => t.id !== myTeam.id);
              if (opponent) {
                opponentTeamName = opponent.name;
                opponentTeamId = opponent.id;
              }
            }
          }
        }

        setState({
          loading: false,
          error: null,
          hasSeasons: true,
          season: currentSeason,
          team: myTeam,
          opponentTeamName,
          opponentTeamId,
        });
      } catch (e) {
        if (cancelled) return;
        const apiError = e as ApiError;
        setState((s) => ({
          ...s,
          loading: false,
          error: apiError?.body?.message || apiError?.message || 'Failed to load league',
        }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [leagueId, userId]);

  return state;
}

interface MyLeagueCardProps {
  leagueUser: LeagueUserInput;
  userId: number;
}

export function MyLeagueCard({ leagueUser, userId }: MyLeagueCardProps) {
  const leagueId = leagueUser.leagueId;
  const league = leagueUser.league;
  const { loading, error, hasSeasons, season, team, opponentTeamName, opponentTeamId } =
    useMyLeagueCardData(leagueId, userId);

  let teamMatchupHref = season ? `/league/${leagueId}/season/${season.id}/team-matchup` : '';
  if (season && team) {
    const qp = new URLSearchParams();
    qp.set('teamAId', String(team.id));
    if (opponentTeamId) qp.set('teamBId', String(opponentTeamId));
    teamMatchupHref += `?${qp.toString()}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-lg">
          <LeagueLogo
            logoUrl={league?.logoUrl}
            name={league?.name ?? ''}
            className="h-6 w-6 shrink-0 object-contain"
          />
          <span>
            {league?.name ?? `League #${leagueId}`}
            {league?.abbreviation ? (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                ({league.abbreviation})
              </span>
            ) : null}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        )}

        {error && <ErrorAlert message={error} />}

        {!loading && !error && !hasSeasons && (
          <p className="text-sm text-muted-foreground">No seasons yet</p>
        )}

        {!loading && !error && hasSeasons && season && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{season.name}</span>
              <Badge variant="secondary">{formatSeasonStatus(season.status)}</Badge>
            </div>

            {team && (
              <div className="text-sm">
                <p className="flex items-center gap-1.5 font-medium">
                  <TeamLogo logoUrl={team.logoUrl} name={team.name} className="h-5 w-5 object-contain" />
                  <span>Your team: {team.name}</span>
                </p>
                {opponentTeamName && (
                  <p className="text-muted-foreground">This week vs. {opponentTeamName}</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm">
              <Link
                href={`/league/${leagueId}/season/${season.id}/tiers`}
                className="text-primary hover:underline"
              >
                Tier List
              </Link>
              <Link href={teamMatchupHref as Route} className="text-primary hover:underline">
                Team Matchup
              </Link>
              <Link
                href={`/league/${leagueId}/season/${season.id}/rank/team`}
                className="text-primary hover:underline"
              >
                Standings
              </Link>
              <Link
                href={`/league/${leagueId}/season/${season.id}/rank/pokemon`}
                className="text-primary hover:underline"
              >
                Pokemon Rank
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
