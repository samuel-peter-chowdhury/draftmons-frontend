'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { MessageSquare, Pencil } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  Spinner,
  UserAvatar,
} from '@/components';
import { EditUserModal } from '@/components/modals/EditUserModal';
import { addToast, useApiSWR, useMutation } from '@/hooks';
import { buildUrl, AuthApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatUserDisplayName } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import type { UserInput } from '@/types';

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuthStore();
  const { data, loading, error, refetch } = useApiSWR<UserInput>(
    buildUrl(BASE_ENDPOINTS.USER_BASE, params.id),
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Guard against double-firing in React StrictMode
  const toastFiredRef = useRef(false);

  // Handle OAuth callback query params
  useEffect(() => {
    if (toastFiredRef.current) return;
    const linked = searchParams.get('linked');
    if (linked === null) return;

    toastFiredRef.current = true;

    if (linked === 'true') {
      addToast('Discord account linked!', 'success');
      refetch();
    } else {
      const errorParam = searchParams.get('error');
      const message =
        errorParam === 'already_taken'
          ? 'This Discord account is already linked to another user'
          : 'Linking failed, try again';
      addToast(message, 'error');
    }

    // Strip query params from URL
    router.replace(`/user/${params.id}`);
  }, [searchParams, params.id, router, refetch]);

  // Check if the current user is viewing their own profile
  const isOwnProfile = currentUser?.id === data?.id;

  const isLinked = !!data?.hasDiscordLinked;

  // Unlink mutation
  const unlinkMutation = useMutation<{ message: string }, void>(() => AuthApi.unlinkDiscord(), {
    onSuccess: () => {
      refetch();
      addToast('Discord account unlinked', 'success');
    },
  });

  const handleUnlink = async () => {
    try {
      await unlinkMutation.mutate();
    } catch {
      // error handled by mutation state
    }
  };

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
                <div className="flex items-center gap-3">
                  <UserAvatar
                    avatarUrl={data.avatarUrl}
                    name={displayName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <span>{displayName}</span>
                    {data.isAdmin && (
                      <div className="mt-1 text-sm font-normal text-muted-foreground">
                        Administrator
                      </div>
                    )}
                  </div>
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

                {/* Discord section */}
                {isLinked ? (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Discord</div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-[#5865F2]" />
                      <span>{data.discordUsername}</span>
                      <Badge className="border-transparent bg-[#5865F2]/20 text-[#5865F2]">
                        Linked
                      </Badge>
                      {isOwnProfile && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 text-xs text-muted-foreground"
                            >
                              Unlink
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Unlink Discord Account?</AlertDialogTitle>
                              <AlertDialogDescription>
                                You&apos;ll no longer receive @mentions in league notifications.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleUnlink}
                                disabled={unlinkMutation.loading}
                              >
                                {unlinkMutation.loading ? <Spinner size={14} /> : 'Unlink'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ) : (
                  isOwnProfile && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Discord</div>
                      <div className="mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/10"
                          onClick={() => {
                            window.location.href = AuthApi.getDiscordAuthUrl();
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Link Discord Account
                        </Button>
                      </div>
                    </div>
                  )
                )}
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
