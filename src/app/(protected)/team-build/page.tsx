'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Plus } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  ErrorAlert,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
} from '@/components';
import { useApiSWR, useMutation } from '@/hooks';
import { buildUrlWithQuery, TeamBuildApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { useAuthStore } from '@/stores';
import type { PaginatedResponse, TeamBuildInput } from '@/types';
import { CreateTeamBuildModal } from './_components/CreateTeamBuildModal';
import { DeleteTeamBuildDialog } from './_components/DeleteTeamBuildDialog';

function rosterPoints(build: TeamBuildInput): number {
  return (build.teamBuildSets ?? []).reduce((sum, set) => sum + (set.pointValue ?? 0), 0);
}

export default function TeamBuildListPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamBuildInput | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamBuildInput | null>(null);

  const buildsUrl = user
    ? buildUrlWithQuery(BASE_ENDPOINTS.TEAM_BUILD_BASE, [], {
        userId: user.id,
        full: true,
        pageSize: 100,
        sortBy: 'name',
        sortOrder: 'ASC',
      })
    : null;
  const { data, loading, error, refetch } = useApiSWR<PaginatedResponse<TeamBuildInput>>(buildsUrl);

  const deleteMutation = useMutation((id: number) => TeamBuildApi.delete(id), {
    onSuccess: () => {
      setDeleteTarget(null);
      refetch();
    },
  });

  const handleCreated = useCallback(
    (build: TeamBuildInput) => {
      router.push(`/team-build/${build.id}`);
    },
    [router],
  );

  const builds = data?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Team Builds</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Create Team Build
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {loading && !data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      )}

      {data && builds.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any team builds yet.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Create your first build
            </Button>
          </CardContent>
        </Card>
      )}

      {builds.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {builds.map((build) => {
            const points = rosterPoints(build);
            const rosterCount = build.teamBuildSets?.length ?? 0;
            const pointLimit = build.season?.pointLimit;
            return (
              <Card
                key={build.id}
                className="cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => router.push(`/team-build/${build.id}`)}
              >
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold">{build.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {build.generation?.name ?? 'Unknown generation'}
                      </p>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Build actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        className="w-32 p-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                          onClick={() => setEditTarget(build)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-destructive hover:bg-accent"
                          onClick={() => {
                            deleteMutation.reset();
                            setDeleteTarget(build);
                          }}
                        >
                          Delete
                        </button>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {build.season ? (
                      <Badge variant="secondary">{build.season.name}</Badge>
                    ) : (
                      <Badge variant="outline">Standalone</Badge>
                    )}
                    <Badge variant="secondary">
                      {rosterCount} {rosterCount === 1 ? 'mon' : 'mons'}
                    </Badge>
                    <Badge variant="secondary">
                      {pointLimit != null ? `${points} / ${pointLimit} pts` : `${points} pts`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateTeamBuildModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreated}
      />

      <CreateTeamBuildModal
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        teamBuild={editTarget}
        onSuccess={() => {
          setEditTarget(null);
          refetch();
        }}
      />

      <DeleteTeamBuildDialog
        teamBuild={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        loading={deleteMutation.loading}
        error={deleteMutation.error}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
