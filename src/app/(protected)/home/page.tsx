'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components';
import { CreateLeagueModal } from '@/components/modals/CreateLeagueModal';
import { useCheckAuth } from '@/hooks';
import { formatUserDisplayName } from '@/lib/utils';
import type { LeagueInput } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useCheckAuth();

  const handleLeagueCreated = (league?: LeagueInput) => {
    if (league?.id) {
      router.push(`/league/${league.id}`);
    }
  };

  const displayName = formatUserDisplayName(user, '');

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">
        Welcome{displayName ? `, ${displayName}` : ''} 👋
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

        <Card>
          <CardHeader>
            <CardTitle>Pokemon</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Link href="/pokemon">
              <Button>Browse Pokemon</Button>
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
