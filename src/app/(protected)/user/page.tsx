'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { Card, CardContent, CardHeader, CardTitle, Spinner } from '@/components';

export default function UserPage() {
  const { user, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!user) checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`.trim()
    : user?.firstName || user?.lastName || '—';

  return (
    <div className="mx-auto max-w-3xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {user ? (
            <>
              <div><span className="text-muted-foreground">Name:</span> {displayName}</div>
              <div><span className="text-muted-foreground">Timezone:</span> {user.timezone || '—'}</div>
              <div><span className="text-muted-foreground">Showdown:</span> {user.showdownUsername || '—'}</div>
              <div><span className="text-muted-foreground">Discord:</span> {user.discordUsername || '—'}</div>
            </>
          ) : (
            <div>No user information found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
