'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components';
import { CreateLeagueModal } from '@/components/modals/CreateLeagueModal';
import type { LeagueInput } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, checkAuth]);

  const handleLeagueCreated = (league?: LeagueInput) => {
    if (league?.id) {
      router.push(`/league/${league.id}`);
    }
  };

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user?.firstName || user?.lastName || '';

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">
        Welcome{displayName ? `, ${displayName}` : ''} 👋
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leagues</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Link href="/league">
              <Button>Browse Leagues</Button>
            </Link>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(true)}>
              Create League
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Link href="/user">
              <Button>Browse Users</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <CreateLeagueModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleLeagueCreated}
      />
    </div>
  );
}
