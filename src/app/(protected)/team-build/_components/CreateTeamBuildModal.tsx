'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ErrorAlert,
  Input,
  Label,
  Select,
  Spinner,
} from '@/components';
import { useApiSWR, useMutation } from '@/hooks';
import { buildUrlWithQuery, TeamBuildApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type {
  GenerationOutput,
  LeagueInput,
  PaginatedResponse,
  SeasonInput,
  TeamBuildInput,
} from '@/types';

const GENERATIONS_URL = buildUrlWithQuery(BASE_ENDPOINTS.GENERATION_BASE, [], { pageSize: 100 });
const LEAGUES_URL = buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [], {
  page: 1,
  pageSize: 100,
  sortBy: 'name',
  sortOrder: 'ASC',
});
const seasonsUrlFor = (leagueId: number) =>
  buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season'], { leagueId, pageSize: 100 });

interface CreateTeamBuildModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the modal edits the given build instead of creating a new one. */
  teamBuild?: TeamBuildInput | null;
  onSuccess?: (build: TeamBuildInput) => void;
}

type LinkType = 'standalone' | 'season';

export function CreateTeamBuildModal({
  open,
  onOpenChange,
  teamBuild,
  onSuccess,
}: CreateTeamBuildModalProps) {
  const isEditMode = !!teamBuild;

  const [name, setName] = useState('');
  const [linkType, setLinkType] = useState<LinkType>('standalone');
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [seasonId, setSeasonId] = useState<number | null>(null);

  // Reference data — fetched while the modal is open
  const { data: generations } = useApiSWR<PaginatedResponse<GenerationOutput>>(
    open ? GENERATIONS_URL : null,
  );
  const { data: leagues } = useApiSWR<PaginatedResponse<LeagueInput>>(open ? LEAGUES_URL : null);
  const seasonsUrl = open && leagueId ? seasonsUrlFor(leagueId) : null;
  const { data: seasons } = useApiSWR<PaginatedResponse<SeasonInput>>(seasonsUrl);

  // Reset form whenever the modal opens or the edit target changes
  useEffect(() => {
    if (!open) return;
    if (teamBuild) {
      setName(teamBuild.name);
      setLinkType(teamBuild.seasonId ? 'season' : 'standalone');
      setGenerationId(teamBuild.generationId);
      setLeagueId(teamBuild.season?.leagueId ?? null);
      setSeasonId(teamBuild.seasonId ?? null);
    } else {
      setName('');
      setLinkType('standalone');
      setGenerationId(null);
      setLeagueId(null);
      setSeasonId(null);
    }
  }, [open, teamBuild]);

  const selectedSeason = useMemo(
    () => seasons?.data.find((s) => s.id === seasonId) ?? teamBuild?.season ?? null,
    [seasons, seasonId, teamBuild],
  );

  // For linked builds the generation is derived from the chosen season on
  // create; on edit the generation is immutable, so only same-generation
  // seasons may be selected.
  const derivedGenerationId = isEditMode
    ? (teamBuild?.generationId ?? null)
    : (selectedSeason?.generationId ?? null);

  const selectableSeasons = useMemo(() => {
    const all = seasons?.data ?? [];
    if (isEditMode && teamBuild) {
      return all.filter((s) => s.generationId === teamBuild.generationId);
    }
    return all;
  }, [seasons, isEditMode, teamBuild]);

  const generationName = useMemo(() => {
    const gid = linkType === 'season' ? derivedGenerationId : generationId;
    return generations?.data.find((g) => g.id === gid)?.name ?? teamBuild?.generation?.name ?? '';
  }, [generations, linkType, derivedGenerationId, generationId, teamBuild]);

  const finish = (result: TeamBuildInput) => {
    onOpenChange(false);
    onSuccess?.(result);
  };

  const createMutation = useMutation(
    (payload: { name: string; generationId: number; seasonId?: number }) =>
      TeamBuildApi.create(payload),
    { onSuccess: (result) => finish(result) },
  );

  const updateMutation = useMutation(
    (payload: { name: string; seasonId: number | null }) =>
      TeamBuildApi.update(teamBuild!.id, payload),
    { onSuccess: (result) => finish(result) },
  );

  const loading = createMutation.loading || updateMutation.loading;
  const error = createMutation.error || updateMutation.error;

  const finalGenerationId = linkType === 'season' ? derivedGenerationId : generationId;

  const canSubmit =
    name.trim().length > 0 &&
    finalGenerationId != null &&
    (linkType === 'standalone' || seasonId != null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || finalGenerationId == null) return;

    if (isEditMode) {
      await updateMutation.mutate({
        name: name.trim(),
        seasonId: linkType === 'season' ? seasonId : null,
      });
    } else {
      await createMutation.mutate({
        name: name.trim(),
        generationId: finalGenerationId,
        ...(linkType === 'season' && seasonId ? { seasonId } : {}),
      });
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (loading) return;
    if (!next) {
      createMutation.reset();
      updateMutation.reset();
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Team Build' : 'Create Team Build'}</DialogTitle>
        </DialogHeader>

        {error && <ErrorAlert message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tb-name">Name</Label>
            <Input
              id="tb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="e.g. Rain Team Gen 9"
            />
          </div>

          <div>
            <Label>Type</Label>
            <div className="mt-1 flex gap-2">
              <Button
                type="button"
                variant={linkType === 'standalone' ? 'default' : 'outline'}
                size="sm"
                disabled={loading}
                onClick={() => {
                  setLinkType('standalone');
                  setSeasonId(null);
                }}
              >
                Standalone
              </Button>
              <Button
                type="button"
                variant={linkType === 'season' ? 'default' : 'outline'}
                size="sm"
                disabled={loading}
                onClick={() => setLinkType('season')}
              >
                Linked to a season
              </Button>
            </div>
          </div>

          {linkType === 'standalone' && (
            <div>
              <Label htmlFor="tb-generation">Generation</Label>
              <Select
                id="tb-generation"
                value={generationId?.toString() ?? ''}
                onChange={(e) => setGenerationId(e.target.value ? Number(e.target.value) : null)}
                disabled={loading || isEditMode}
                required
              >
                <option value="">Select a generation...</option>
                {generations?.data.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
              {isEditMode && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Generation can&apos;t be changed after creation.
                </p>
              )}
            </div>
          )}

          {linkType === 'season' && (
            <>
              <div>
                <Label htmlFor="tb-league">League</Label>
                <Select
                  id="tb-league"
                  value={leagueId?.toString() ?? ''}
                  onChange={(e) => {
                    setLeagueId(e.target.value ? Number(e.target.value) : null);
                    setSeasonId(null);
                  }}
                  disabled={loading}
                >
                  <option value="">Select a league...</option>
                  {leagues?.data.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="tb-season">Season</Label>
                <Select
                  id="tb-season"
                  value={seasonId?.toString() ?? ''}
                  onChange={(e) => setSeasonId(e.target.value ? Number(e.target.value) : null)}
                  disabled={loading || !leagueId}
                >
                  <option value="">Select a season...</option>
                  {selectableSeasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                {isEditMode && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Only seasons in this build&apos;s generation are shown.
                  </p>
                )}
              </div>

              {generationName && (
                <p className="text-xs text-muted-foreground">
                  Generation: <span className="font-medium">{generationName}</span>
                </p>
              )}
            </>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? <Spinner size={18} /> : isEditMode ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
