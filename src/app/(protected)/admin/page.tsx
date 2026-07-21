'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components';
import { useAuthStore } from '@/stores';
import { PokemonSpriteOverrideCard } from './_components';

/**
 * Top-level admin tools page (not league/season-scoped). Admin-only: the edge
 * middleware requires an authenticated session, and this client guard redirects
 * non-admins to /home once auth resolves. Built to hold multiple admin-tool
 * cards; only the Pokemon sprite override exists this pass.
 */
export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && user && !user.isAdmin) {
      router.replace('/home');
    }
  }, [loading, user, router]);

  if (loading || !user || !user.isAdmin) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-semibold">Admin Tools</h1>
      <div className="grid gap-4">
        <PokemonSpriteOverrideCard />
      </div>
    </div>
  );
}
