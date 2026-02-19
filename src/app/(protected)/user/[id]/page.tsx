'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Pencil } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  Spinner,
} from '@/components';
import { EditUserModal } from '@/components/modals/EditUserModal';
import { useCheckAuth, useFetch } from '@/hooks';
import { buildUrl } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatUserDisplayName } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import type { UserInput } from '@/types';

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const { data, loading, error, refetch } = useFetch<UserInput>(
    buildUrl(BASE_ENDPOINTS.USER_BASE, params.id),
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useCheckAuth();

  // Check if the current user is viewing their own profile
  const isOwnProfile = currentUser?.id === data?.id;

  const displayName = formatUserDisplayName(data);

  return (
    <div className="mx-auto max-w-7xl p-4">
      {error && <ErrorAlert message={error} />}

      {loading && !data && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <span>{displayName}</span>
                  {data.isAdmin && (
                    <div className="mt-1 text-sm font-normal text-muted-foreground">Administrator</div>
                  )}
                </div>
                {isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    aria-label="Edit profile"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div className="text-sm">{data.email || '—'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Timezone</div>
                  <div className="text-sm">{data.timezone || '—'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Showdown Username</div>
                  <div className="text-sm">{data.showdownUsername || '—'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Discord Username</div>
                  <div className="text-sm">{data.discordUsername || '—'}</div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="text-sm font-medium text-muted-foreground">Account Created</div>
                <div className="text-sm">
                  {new Date(data.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isOwnProfile && (
        <EditUserModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          user={data}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
