'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorAlert,
  Input,
  Select,
  Spinner,
} from '@/components';
import { Pagination } from '@/components/ui/pagination';
import { PokemonFilterPanel } from '@/components/pokemon/PokemonFilterPanel';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { useApiSWR, useMutation, usePokemonSearch } from '@/hooks';
import { addToast } from '@/hooks/useToast';
import { buildUrlWithQuery, TeamBuildSetApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type {
  PaginatedResponse,
  PokemonInput,
  SeasonPokemonInput,
  SeasonPokemonTeamInput,
  TeamBuildInput,
  TeamBuildSetInput,
} from '@/types';

interface DraftPrepTabProps {
  build: TeamBuildInput;
  onChanged: () => void;
}

function pointsBadge(total: number, pointLimit?: number | null) {
  if (pointLimit == null) {
    return <Badge variant="secondary">{total} pts</Badge>;
  }
  if (total > pointLimit) {
    return (
      <Badge variant="destructive">
        {total} / {pointLimit} pts (over limit)
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      {total} / {pointLimit} pts
    </Badge>
  );
}

function rosterBadge(count: number, min?: number | null, max?: number | null) {
  if (min == null || max == null) {
    return (
      <Badge variant="secondary">
        {count} {count === 1 ? 'mon' : 'mons'}
      </Badge>
    );
  }
  if (count > max) {
    return (
      <Badge variant="destructive">
        {count} / {min}-{max} roster (over max)
      </Badge>
    );
  }
  if (count < min) {
    return (
      <Badge variant="warning">
        {count} / {min}-{max} roster (under min)
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      {count} / {min}-{max} roster
    </Badge>
  );
}

/** A single roster entry with inline-editable point value and condition. */
function RosterEntry({
  set,
  onChanged,
  onRemove,
}: {
  set: TeamBuildSetInput;
  onChanged: () => void;
  onRemove: (set: TeamBuildSetInput) => void;
}) {
  const [pointValue, setPointValue] = useState(set.pointValue?.toString() ?? '');
  const [condition, setCondition] = useState(set.condition ?? '');

  useEffect(() => {
    setPointValue(set.pointValue?.toString() ?? '');
    setCondition(set.condition ?? '');
  }, [set.pointValue, set.condition]);

  const updateMutation = useMutation(
    (data: { pointValue?: number | null; condition?: string | null }) =>
      TeamBuildSetApi.update(set.id, data),
    { onSuccess: () => onChanged() },
  );

  const savePoints = () => {
    const parsed = pointValue.trim() === '' ? null : Number(pointValue);
    if (parsed === (set.pointValue ?? null)) return;
    updateMutation.mutate({ pointValue: parsed });
  };

  const saveCondition = () => {
    const next = condition.trim() === '' ? null : condition;
    if (next === (set.condition ?? null)) return;
    updateMutation.mutate({ condition: next });
  };

  const pkmn = set.pokemon;
  if (!pkmn) return null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-2">
      <div className="flex items-center gap-2">
        <PokemonSprite
          pokemonId={pkmn.id}
          spriteUrl={pkmn.spritePngUrl}
          name={pkmn.name}
          className="h-12 w-12 object-contain"
          disableClick
        />
        <span className="flex-1 truncate text-sm font-medium capitalize">{pkmn.name}</span>
        {updateMutation.loading && <Spinner size={14} />}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-muted-foreground">Points</label>
          <Input
            type="number"
            min={0}
            value={pointValue}
            onChange={(e) => setPointValue(e.target.value)}
            onBlur={savePoints}
            className="h-8"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Condition</label>
          <Input
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            onBlur={saveCondition}
            className="h-8"
            placeholder="—"
          />
        </div>
      </div>
      {updateMutation.error && <ErrorAlert message={updateMutation.error} />}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 self-end px-2 text-xs"
        onClick={() => onRemove(set)}
      >
        Remove
      </Button>
    </div>
  );
}

export function DraftPrepTab({ build, onChanged }: DraftPrepTabProps) {
  const sets = useMemo(
    () => [...(build.teamBuildSets ?? [])].sort((a, b) => (b.pointValue ?? 0) - (a.pointValue ?? 0)),
    [build.teamBuildSets],
  );
  const existingPokemonIds = useMemo(
    () => new Set((build.teamBuildSets ?? []).map((s) => s.pokemonId)),
    [build.teamBuildSets],
  );

  const totalPoints = useMemo(
    () => (build.teamBuildSets ?? []).reduce((sum, s) => sum + (s.pointValue ?? 0), 0),
    [build.teamBuildSets],
  );

  const [removeTarget, setRemoveTarget] = useState<TeamBuildSetInput | null>(null);

  const removeMutation = useMutation((id: number) => TeamBuildSetApi.delete(id), {
    onSuccess: () => {
      setRemoveTarget(null);
      onChanged();
    },
  });

  const isSeasonLinked = build.seasonId != null;

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap items-center gap-2">
        {pointsBadge(totalPoints, isSeasonLinked ? build.season?.pointLimit : undefined)}
        {rosterBadge(
          build.teamBuildSets?.length ?? 0,
          isSeasonLinked ? build.season?.minRosterSize : undefined,
          isSeasonLinked ? build.season?.maxRosterSize : undefined,
        )}
      </div>

      {/* Current roster */}
      {sets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sets.map((set) => (
                <RosterEntry
                  key={set.id}
                  set={set}
                  onChanged={onChanged}
                  onRemove={(s) => {
                    removeMutation.reset();
                    setRemoveTarget(s);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Copy roster from a team (season-linked only) */}
      {isSeasonLinked && (
        <CopyRosterSection build={build} onChanged={onChanged} />
      )}

      {/* Add Pokemon search */}
      <AddPokemonSearch
        build={build}
        existingPokemonIds={existingPokemonIds}
        onChanged={onChanged}
      />

      {/* Remove confirm dialog */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(o) => !removeMutation.loading && !o && setRemoveTarget(null)}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="capitalize">
              Remove {removeTarget?.pokemon?.name} from this build?
            </DialogTitle>
          </DialogHeader>
          {removeMutation.error && <ErrorAlert message={removeMutation.error} />}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRemoveTarget(null)}
              disabled={removeMutation.loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
              disabled={removeMutation.loading}
            >
              {removeMutation.loading ? <Spinner size={18} /> : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Copy an entire season Team's active roster into this build. */
function CopyRosterSection({
  build,
  onChanged,
}: {
  build: TeamBuildInput;
  onChanged: () => void;
}) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  // Season teams come from the season loaded full on the build.
  const teams = build.season?.teams ?? [];

  // If the build's season wasn't loaded with teams, fetch it directly.
  const seasonUrl =
    build.seasonId && teams.length === 0
      ? buildUrlWithQuery(BASE_ENDPOINTS.SEASON_BASE, [build.seasonId], { full: true })
      : null;
  const { data: seasonFull } = useApiSWR<{ teams?: { id: number; name: string }[] }>(seasonUrl);
  const availableTeams = teams.length > 0 ? teams : (seasonFull?.teams ?? []);

  const rosterUrl = selectedTeamId
    ? buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_TEAM_BASE, [], {
        teamId: selectedTeamId,
        isActive: true,
        full: true,
        pageSize: 100,
      })
    : null;
  const { data: rosterData, loading: rosterLoading } =
    useApiSWR<PaginatedResponse<SeasonPokemonTeamInput>>(rosterUrl);

  const copyMutation = useMutation<{ added: number; skipped: number }, void>(
    async () => {
      const roster = rosterData?.data ?? [];
      const existing = new Set((build.teamBuildSets ?? []).map((s) => s.pokemonId));
      let added = 0;
      let skipped = 0;
      for (const spt of roster) {
        const sp = spt.seasonPokemon;
        const pokemonId = sp?.pokemon?.id;
        if (!pokemonId) continue;
        if (existing.has(pokemonId)) {
          skipped += 1;
          continue;
        }
        await TeamBuildSetApi.create({
          teamBuildId: build.id,
          pokemonId,
          pointValue: sp?.pointValue,
          condition: sp?.condition,
        });
        added += 1;
      }
      return { added, skipped };
    },
    {
      onSuccess: ({ added, skipped }) => {
        addToast(
          `Copied ${added} Pokémon${skipped > 0 ? `, skipped ${skipped} already present` : ''}.`,
          'success',
        );
        onChanged();
      },
    },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Copy Roster From Team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-64">
            <label className="mb-1 block text-xs text-muted-foreground">Team</label>
            <Select
              value={selectedTeamId?.toString() ?? ''}
              onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Select a team...</option>
              {availableTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={() => copyMutation.mutate()}
            disabled={!selectedTeamId || rosterLoading || copyMutation.loading}
          >
            {copyMutation.loading ? <Spinner size={18} /> : 'Copy'}
          </Button>
        </div>
        {copyMutation.error && <ErrorAlert message={copyMutation.error} />}
      </CardContent>
    </Card>
  );
}

/** Search + add Pokemon, using the season pool or the plain generation pool. */
function AddPokemonSearch({
  build,
  existingPokemonIds,
  onChanged,
}: {
  build: TeamBuildInput;
  existingPokemonIds: Set<number>;
  onChanged: () => void;
}) {
  const isSeasonLinked = build.seasonId != null;

  const {
    data,
    loading,
    error,
    filters,
    types,
    specialMoveCategories,
    abilitySearchResults,
    moveSearchResults,
    abilitySearchLoading,
    moveSearchLoading,
    pageSize,
    resetGeneration,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    setAbilitySearch,
    setMoveSearch,
  } = usePokemonSearch({
    endpoint: isSeasonLinked ? BASE_ENDPOINTS.SEASON_POKEMON_BASE : BASE_ENDPOINTS.POKEMON_BASE,
    extraParams: isSeasonLinked ? { seasonId: build.seasonId, full: true } : undefined,
    initialSortBy: 'name',
    initialPageSize: 5,
  });

  useEffect(() => {
    resetGeneration(build.generationId);
  }, [build.generationId, resetGeneration]);

  const addMutation = useMutation(
    (payload: { pokemonId: number; pointValue?: number | null; condition?: string | null }) =>
      TeamBuildSetApi.create({ teamBuildId: build.id, ...payload }),
    { onSuccess: () => onChanged() },
  );

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <h2 className="text-lg font-semibold">Add Pokémon</h2>

        <PokemonFilterPanel
          filters={filters}
          variant={isSeasonLinked ? 'seasonPokemon' : 'pokemon'}
          onFilterChange={handleFilterChange}
          types={types}
          specialMoveCategories={specialMoveCategories}
          abilitySearchResults={abilitySearchResults}
          moveSearchResults={moveSearchResults}
          onAbilitySearchChange={setAbilitySearch}
          onMoveSearchChange={setMoveSearch}
          abilitySearchLoading={abilitySearchLoading}
          moveSearchLoading={moveSearchLoading}
        />

        {error && <ErrorAlert message={error} />}
        {addMutation.error && <ErrorAlert message={addMutation.error} />}

        {loading && !data && (
          <div className="flex items-center justify-center py-6">
            <Spinner size={28} />
          </div>
        )}

        {data && (
          <ul className="divide-y divide-border rounded-md border border-border">
            {data.data.length === 0 && (
              <li className="p-3 text-sm text-muted-foreground">
                No Pokémon found matching your filters.
              </li>
            )}
            {data.data.map((raw) => {
              // In season mode results are SeasonPokemon; in standalone mode they're Pokemon.
              const sp = isSeasonLinked ? (raw as unknown as SeasonPokemonInput) : null;
              const pkmn: PokemonInput | undefined = isSeasonLinked
                ? sp?.pokemon
                : (raw as unknown as PokemonInput);
              if (!pkmn) return null;
              const alreadyAdded = existingPokemonIds.has(pkmn.id);
              return (
                <li key={sp ? sp.id : pkmn.id} className="flex items-center justify-between gap-3 p-2">
                  <div className="flex items-center gap-3">
                    <PokemonSprite
                      pokemonId={pkmn.id}
                      spriteUrl={pkmn.spritePngUrl}
                      name={pkmn.name}
                      className="h-10 w-10 object-contain"
                      disableClick
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{pkmn.name}</span>
                      {sp != null && (
                        <span className="text-xs text-muted-foreground">{sp.pointValue} pts</span>
                      )}
                    </div>
                  </div>
                  {alreadyAdded ? (
                    <Badge variant="outline">Already added</Badge>
                  ) : (
                    <Button
                      size="sm"
                      disabled={addMutation.loading}
                      onClick={() =>
                        addMutation.mutate(
                          sp != null
                            ? { pokemonId: pkmn.id, pointValue: sp.pointValue, condition: sp.condition }
                            : { pokemonId: pkmn.id },
                        )
                      }
                    >
                      {addMutation.loading ? <Spinner size={16} /> : 'Add'}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {data && (
          <Pagination
            page={data.page}
            pageSize={pageSize}
            totalPages={data.totalPages}
            total={data.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            disabled={loading}
          />
        )}
      </CardContent>
    </Card>
  );
}
