'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ErrorAlert, LeagueSearch, MyLeagueCard, Skeleton } from '@/components';
import { CreateLeagueModal } from '@/components/modals/CreateLeagueModal';
import { useApiSWR } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatUserDisplayName } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import type { LeagueInput, LeagueUserInput, PaginatedResponse } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleLeagueCreated = (league?: LeagueInput) => {
    if (league?.id) {
      router.push(`/league/${league.id}`);
    }
  };

  const displayName = formatUserDisplayName(user, '');

  const leagueUsersUrl = user
    ? buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_USER_BASE, [], {
        userId: user.id,
        full: true,
        pageSize: 100,
      })
    : null;
  const {
    data: leagueUsersResp,
    loading: leagueUsersLoading,
    error: leagueUsersError,
  } = useApiSWR<PaginatedResponse<LeagueUserInput>>(leagueUsersUrl);

  const leagueUsers = leagueUsersResp?.data ?? [];
  const hasLeagues = leagueUsers.length > 0;

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-6 text-2xl font-semibold">
        Welcome{displayName ? `, ${displayName}` : ''} 👋
      </h1>

      {leagueUsersLoading && (
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      )}

      {leagueUsersError && (
        <div className="mb-8">
          <ErrorAlert message={leagueUsersError} />
        </div>
      )}

      {!leagueUsersLoading && !leagueUsersError && hasLeagues && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">My Leagues</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leagueUsers.map((leagueUser) => (
              <MyLeagueCard key={leagueUser.id} leagueUser={leagueUser} userId={user!.id} />
            ))}
          </div>
        </section>
      )}

      {!leagueUsersLoading && (
        <section className="mb-8">
          <LeagueSearch variant={hasLeagues ? 'secondary' : 'primary'} />
        </section>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t pt-4 text-sm text-muted-foreground">
        <Link href="/league" className="hover:underline">
          Browse Leagues
        </Link>
        <Link href="/user" className="hover:underline">
          Browse Users
        </Link>
        <Link href="/pokemon" className="hover:underline">
          Browse Pokemon
        </Link>
        <Link href="/team-build" className="hover:underline">
          Team Builds
        </Link>
        <button type="button" onClick={() => setIsCreateModalOpen(true)} className="hover:underline">
          Create League
        </button>
        {user?.isAdmin && (
          <Link href="/admin" className="hover:underline">
            Admin
          </Link>
        )}
      </div>

      <CreateLeagueModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleLeagueCreated}
      />
    </div>
  );
}
