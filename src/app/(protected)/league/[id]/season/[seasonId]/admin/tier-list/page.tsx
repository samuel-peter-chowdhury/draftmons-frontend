'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Card, CardContent, ErrorAlert, Spinner } from '@/components';
import {
  TierColumn,
  DragOverlayRow,
  PokemonSearchCombobox,
  ConditionModal,
  DeleteConfirmDialog,
} from './_components';
import { useFetch, useMutation } from '@/hooks';
import { LeagueApi, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { useLeagueStore, useIsModerator } from '@/stores/useLeagueStore';
import { useAuthStore } from '@/stores';
import type { SeasonPokemonInput, PaginatedResponse, PokemonInput } from '@/types';

export default function AdminTierListPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const router = useRouter();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  const { user } = useAuthStore();
  const isModerator = useIsModerator(user?.id);
  const season = useLeagueStore((s) => s.season);
  const seasonLoading = useLeagueStore((s) => s.seasonLoading);

  // Redirect non-moderators
  useEffect(() => {
    if (!seasonLoading && !isModerator && user) {
      router.replace(`/league/${leagueId}/season/${seasonId}`);
    }
  }, [isModerator, seasonLoading, user, leagueId, seasonId, router]);

  // Fetch all season pokemon (pageSize covers entire pool for drag-and-drop tier management)
  const {
    data: spData,
    loading: spLoading,
    error: spError,
    refetch,
    setData: setSpData,
  } = useFetch<PaginatedResponse<SeasonPokemonInput>>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season-pokemon'], {
      seasonId,
      full: true,
      activeRelationsOnly: true,
      pageSize: 9999,
    }),
  );

  // DnD state
  const [activeDragSp, setActiveDragSp] = useState<SeasonPokemonInput | null>(null);

  // Modal state
  const [conditionSp, setConditionSp] = useState<SeasonPokemonInput | null>(null);
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [deleteSp, setDeleteSp] = useState<SeasonPokemonInput | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Separate mutation instances to avoid shared loading/error state conflicts
  const tierMutation = useMutation(
    ({ spId, data }: { spId: number; data: { pointValue: number } }) =>
      LeagueApi.updateSeasonPokemon(leagueId, spId, data),
  );

  const conditionMutation = useMutation(
    ({ spId, data }: { spId: number; data: { condition: string } }) =>
      LeagueApi.updateSeasonPokemon(leagueId, spId, data),
  );

  const createMutation = useMutation(
    (data: { seasonId: number; pokemonId: number; pointValue: number }) =>
      LeagueApi.createSeasonPokemon(leagueId, data),
  );

  const deleteMutation = useMutation((spId: number) =>
    LeagueApi.deleteSeasonPokemon(leagueId, spId),
  );

  // Build tier columns: 0 (Unassigned) + maxPointValue..1
  const maxPointValue = season?.maxPointValue ?? 0;

  const tierColumns = useMemo(() => {
    const columns: { pointValue: number; label: string }[] = [
      { pointValue: 0, label: 'Unassigned' },
    ];
    for (let i = maxPointValue; i >= 1; i--) {
      columns.push({ pointValue: i, label: String(i) });
    }
    return columns;
  }, [maxPointValue]);

  // Group pokemon by point value
  const grouped = useMemo(() => {
    const map = new Map<number, SeasonPokemonInput[]>();
    for (const col of tierColumns) {
      map.set(col.pointValue, []);
    }
    if (spData?.data) {
      for (const sp of spData.data) {
        if (!sp.pokemon) continue;
        const pv = sp.pointValue ?? 0;
        const group = map.get(pv);
        if (group) {
          group.push(sp);
        } else {
          map.set(pv, [sp]);
        }
      }
    }
    return map;
  }, [spData, tierColumns]);

  // Set of existing pokemon IDs for search exclusion
  const existingPokemonIds = useMemo(() => {
    const ids = new Set<number>();
    if (spData?.data) {
      for (const sp of spData.data) {
        ids.add(sp.pokemonId);
      }
    }
    return ids;
  }, [spData]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const sp = event.active.data.current?.seasonPokemon as SeasonPokemonInput;
    setActiveDragSp(sp ?? null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDragSp(null);
      const { active, over } = event;
      if (!over) return;

      const sp = active.data.current?.seasonPokemon as SeasonPokemonInput;
      if (!sp) return;

      const targetId = String(over.id);
      if (!targetId.startsWith('tier-')) return;
      const targetPointValue = Number(targetId.replace('tier-', ''));

      if (sp.pointValue === targetPointValue) return;

      const previousPointValue = sp.pointValue;

      // Optimistic update
      setSpData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((item) =>
            item.id === sp.id ? { ...item, pointValue: targetPointValue } : item,
          ),
        };
      });

      try {
        await tierMutation.mutate({ spId: sp.id, data: { pointValue: targetPointValue } });
      } catch {
        // Revert to previous state directly instead of refetching
        setSpData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            data: prev.data.map((item) =>
              item.id === sp.id ? { ...item, pointValue: previousPointValue } : item,
            ),
          };
        });
      }
    },
    [tierMutation, setSpData],
  );

  // Add pokemon from search
  const handleAddPokemon = useCallback(
    async (pokemon: PokemonInput) => {
      try {
        await createMutation.mutate({
          seasonId,
          pokemonId: pokemon.id,
          pointValue: 0,
        });
        refetch();
      } catch {
        // Error is shown by mutation
      }
    },
    [createMutation, seasonId, refetch],
  );

  // Delete pokemon
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteSp) return;
    try {
      await deleteMutation.mutate(deleteSp.id);
      setDeleteModalOpen(false);
      setDeleteSp(null);
      refetch();
    } catch {
      // Error stays in the modal via deleteMutation.error
    }
  }, [deleteSp, deleteMutation, refetch]);

  // Condition save
  const handleConditionSave = useCallback(
    async (sp: SeasonPokemonInput, condition: string) => {
      try {
        await conditionMutation.mutate({ spId: sp.id, data: { condition } });
        setConditionModalOpen(false);
        setConditionSp(null);
        refetch();
      } catch {
        // Error shown via mutation
      }
    },
    [conditionMutation, refetch],
  );

  const handleDeleteClick = useCallback((sp: SeasonPokemonInput) => {
    setDeleteSp(sp);
    setDeleteModalOpen(true);
  }, []);

  const handleEditConditionClick = useCallback((sp: SeasonPokemonInput) => {
    setConditionSp(sp);
    setConditionModalOpen(true);
  }, []);

  if (!isModerator && !seasonLoading) return null;

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Tier List</h1>
        {season && (
          <PokemonSearchCombobox
            generationId={season.generationId}
            existingPokemonIds={existingPokemonIds}
            onSelect={handleAddPokemon}
          />
        )}
      </div>

      {spError && <ErrorAlert message={spError} />}
      {tierMutation.error && <ErrorAlert message={tierMutation.error} />}
      {createMutation.error && <ErrorAlert message={createMutation.error} />}

      {(spLoading || seasonLoading) && !spData && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {spData && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="flex">
                  {tierColumns.map((col, idx) => (
                    <TierColumn
                      key={col.pointValue}
                      pointValue={col.pointValue}
                      label={col.label}
                      pokemon={grouped.get(col.pointValue) ?? []}
                      onDelete={handleDeleteClick}
                      onEditCondition={handleEditConditionClick}
                      isLast={idx === tierColumns.length - 1}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <DragOverlay>
            {activeDragSp ? <DragOverlayRow sp={activeDragSp} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <ConditionModal
        sp={conditionSp}
        open={conditionModalOpen}
        onOpenChange={setConditionModalOpen}
        onSave={handleConditionSave}
        saving={conditionMutation.loading}
      />

      <DeleteConfirmDialog
        sp={deleteSp}
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        deleting={deleteMutation.loading}
        error={deleteMutation.error}
      />
    </div>
  );
}
