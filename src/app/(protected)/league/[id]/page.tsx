'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { X, Pencil } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  Spinner,
} from '@/components';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddLeagueUsersModal } from '@/components/modals/AddLeagueUsersModal';
import { CreateSeasonModal } from '@/components/modals/CreateSeasonModal';
import { CreateLeagueModal } from '@/components/modals/CreateLeagueModal';
import { useFetch } from '@/hooks';
import { Api } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatGenerationName } from '@/lib/utils';
import type { LeagueInputDto } from '@/types';

export default function LeagueDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useFetch<LeagueInputDto>(
    `${BASE_ENDPOINTS.LEAGUE_BASE}/${params.id}?full=true`,
  );

  const [isAddUsersModalOpen, setIsAddUsersModalOpen] = useState(false);
  const [isCreateSeasonModalOpen, setIsCreateSeasonModalOpen] = useState(false);
  const [isEditLeagueModalOpen, setIsEditLeagueModalOpen] = useState(false);
  const [leagueUserToDelete, setLeagueUserToDelete] = useState<number | null>(null);
  const [deletingLeagueUser, setDeletingLeagueUser] = useState(false);

  const handleDeleteLeagueUser = async () => {
    if (!leagueUserToDelete) return;

    setDeletingLeagueUser(true);
    try {
      await Api.delete(`${BASE_ENDPOINTS.LEAGUE_USER_BASE}/${leagueUserToDelete}`);
      await refetch();
      setLeagueUserToDelete(null);
    } catch (e) {
      console.error('Failed to delete league user:', e);
    } finally {
      setDeletingLeagueUser(false);
    }
  };

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
                  <span>{data.name}</span>
                  <div className="mt-1 text-sm font-normal text-muted-foreground">
                    {data.abbreviation}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditLeagueModalOpen(true)}
                  aria-label="Edit league"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>
                Created:{' '}
                {new Date(data.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>League Users</span>
                <Button onClick={() => setIsAddUsersModalOpen(true)} size="sm">
                  Add Users
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!data.leagueUsers || data.leagueUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users in this league yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.leagueUsers.map((leagueUser) => {
                    const user = leagueUser.user;
                    const displayName =
                      user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`.trim()
                        : user?.firstName || user?.lastName || user?.email || 'Unknown User';

                    return (
                      <div
                        key={leagueUser.id}
                        className="flex items-center justify-between rounded-md border border-border bg-card p-3"
                      >
                        <div>
                          <div className="text-sm font-medium">{displayName}</div>
                          {leagueUser.isModerator && (
                            <div className="text-xs text-muted-foreground">Moderator</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLeagueUserToDelete(leagueUser.id)}
                          aria-label={`Remove ${displayName}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Seasons</span>
                <Button onClick={() => setIsCreateSeasonModalOpen(true)} size="sm">
                  Add Season
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!data.seasons || data.seasons.length === 0 ? (
                <p className="text-sm text-muted-foreground">No seasons created yet.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {data.seasons.map((season) => (
                    <div key={season.id} className="rounded-md border border-border bg-card p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="font-medium">{season.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {season.generation?.name ? formatGenerationName(season.generation.name) : 'Unknown Generation'}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Status: {season.status.replace(/_/g, ' ')}</div>
                        <div>Point Limit: {season.pointLimit}</div>
                        <div>Max Point Value: {season.maxPointValue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <CreateLeagueModal
        open={isEditLeagueModalOpen}
        onOpenChange={setIsEditLeagueModalOpen}
        league={data}
        onSuccess={refetch}
      />

      <AddLeagueUsersModal
        open={isAddUsersModalOpen}
        onOpenChange={setIsAddUsersModalOpen}
        leagueId={Number(params.id)}
        existingLeagueUsers={data?.leagueUsers || []}
        onSuccess={refetch}
      />

      <CreateSeasonModal
        open={isCreateSeasonModalOpen}
        onOpenChange={setIsCreateSeasonModalOpen}
        leagueId={Number(params.id)}
        onSuccess={refetch}
      />

      <AlertDialog
        open={leagueUserToDelete !== null}
        onOpenChange={(open) => !open && setLeagueUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove League User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user from the league? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingLeagueUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLeagueUser} disabled={deletingLeagueUser}>
              {deletingLeagueUser ? <Spinner size={18} /> : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
