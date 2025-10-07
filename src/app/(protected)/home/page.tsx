'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components';
import { ENDPOINTS } from '@/lib/constants';

export default function HomePage() {
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, checkAuth]);

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Welcome{user ? `, ${user.fullName || user.firstName}` : ''} 👋</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leagues</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Link href="/league">
              <Button>Browse Leagues</Button>
            </Link>
            <Link href="/league/create">
              <Button variant="secondary">Create League</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Link href="/user">
              <Button>View User</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
