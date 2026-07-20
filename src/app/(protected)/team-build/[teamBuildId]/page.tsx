'use client';

import { Suspense, useCallback, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Check, Pencil, X } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  ErrorAlert,
  Input,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components';
import { useFetch, useMutation } from '@/hooks';
import { buildUrlWithQuery, TeamBuildApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { TeamBuildInput } from '@/types';
import { DraftPrepTab } from './_components/DraftPrepTab';
import { MatchPrepTab } from './_components/MatchPrepTab';

const VALID_TABS = ['draft-prep', 'match-prep'] as const;

function TeamBuildDetailContent() {
  const params = useParams<{ teamBuildId: string }>();
  const teamBuildId = Number(params.teamBuildId);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam as (typeof VALID_TABS)[number])
    ? (tabParam as string)
    : 'draft-prep';

  const {
    data: build,
    loading,
    error,
    refetch,
  } = useFetch<TeamBuildInput>(
    Number.isNaN(teamBuildId)
      ? null
      : buildUrlWithQuery(BASE_ENDPOINTS.TEAM_BUILD_BASE, [teamBuildId], { full: true }),
  );

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const renameMutation = useMutation((name: string) => TeamBuildApi.update(teamBuildId, { name }), {
    onSuccess: () => {
      setEditingName(false);
      refetch();
    },
  });

  const setTab = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === 'draft-prep') next.delete('tab');
      else next.set('tab', value);
      const query = next.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}` as Route, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  if (loading && !build) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  // Builds are private — treat any load failure as "not found" (don't leak existence).
  if (error || !build) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              This team build doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Link href="/team-build" className="text-sm text-primary hover:underline">
              Back to Team Builds
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      {/* Header */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {editingName ? (
            <div className="flex items-center gap-1">
              <Input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="h-9 w-64"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nameDraft.trim()) renameMutation.mutate(nameDraft.trim());
                  if (e.key === 'Escape') setEditingName(false);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={!nameDraft.trim() || renameMutation.loading}
                onClick={() => renameMutation.mutate(nameDraft.trim())}
                aria-label="Save name"
              >
                {renameMutation.loading ? <Spinner size={16} /> : <Check className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setEditingName(false)}
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold">{build.name}</h1>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setNameDraft(build.name);
                  renameMutation.reset();
                  setEditingName(true);
                }}
                aria-label="Rename build"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {renameMutation.error && <ErrorAlert message={renameMutation.error} />}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{build.generation?.name ?? 'Unknown generation'}</Badge>
          {build.season ? (
            <Badge variant="secondary">{build.season.name}</Badge>
          ) : (
            <Badge variant="outline">Standalone</Badge>
          )}
          <Link
            href={`/team-build/compare?sideA=teamBuild:${build.id}` as Route}
            className="text-sm text-primary hover:underline"
          >
            Compare this build
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="draft-prep">Draft Prep</TabsTrigger>
          <TabsTrigger value="match-prep">Match Prep</TabsTrigger>
        </TabsList>

        <TabsContent value="draft-prep">
          <DraftPrepTab build={build} onChanged={refetch} />
        </TabsContent>

        <TabsContent value="match-prep">
          <MatchPrepTab
            build={build}
            onChanged={refetch}
            onGoToDraftPrep={() => setTab('draft-prep')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TeamBuildDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Spinner size={32} />
        </div>
      }
    >
      <TeamBuildDetailContent />
    </Suspense>
  );
}
