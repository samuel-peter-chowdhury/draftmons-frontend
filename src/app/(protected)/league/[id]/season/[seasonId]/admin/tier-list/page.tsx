'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { X, FileText, Search } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  ErrorAlert,
  Spinner,
  Input,
} from '@/components';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { useCheckAuth, useFetch, useMutation, useDebounce } from '@/hooks';
import { LeagueApi, buildUrlWithQuery } from '@/lib/api';
import { PokemonApi } from '@/lib/api/pokemon.api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useLeagueStore, useIsModerator } from '@/stores/useLeagueStore';
import { useAuthStore } from '@/stores';
import type { SeasonPokemonInput, PaginatedResponse, PokemonInput } from '@/types';

// ─── Draggable Pokemon Row ─────────────────────────────────────────────────────

function DraggablePokemonRow({
  sp,
  onDelete,
  onEditCondition,
  isDrafted,
}: {
  sp: SeasonPokemonInput;
  onDelete: (sp: SeasonPokemonInput) => void;
  onEditCondition: (sp: SeasonPokemonInput) => void;
  isDrafted: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sp-${sp.id}`,
    data: { seasonPokemon: sp },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const pkmn = sp.pokemon!;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'grid grid-cols-[36px_1fr_28px_28px] items-center px-2 py-0.5 transition-colors hover:bg-secondary/50',
        isDragging && 'opacity-30',
      )}
    >
      <div
        {...listeners}
        {...attributes}
        className="col-span-2 flex cursor-grab items-center active:cursor-grabbing"
      >
        <PokemonSprite
          pokemonId={pkmn.id}
          spriteUrl={pkmn.spriteUrl}
          name={pkmn.name}
          className="h-8 w-8 shrink-0 object-contain"
          disableClick
        />
        <span className="truncate pr-1 text-xs capitalize">{pkmn.name}</span>
      </div>
      <button
        className="flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => onEditCondition(sp)}
        aria-label={`Edit condition for ${pkmn.name}`}
      >
        <FileText className="h-3.5 w-3.5" />
      </button>
      <button
        className={cn(
          'flex items-center justify-center text-muted-foreground transition-colors hover:text-destructive',
          isDrafted && 'opacity-50',
        )}
        onClick={() => onDelete(sp)}
        aria-label={`Remove ${pkmn.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Drag Overlay Row (visual clone while dragging) ─────────────────────────

function DragOverlayRow({ sp }: { sp: SeasonPokemonInput }) {
  const pkmn = sp.pokemon!;
  return (
    <div className="grid grid-cols-[36px_1fr] items-center rounded-md border border-border bg-background px-2 py-0.5 shadow-lg">
      <PokemonSprite
        pokemonId={pkmn.id}
        spriteUrl={pkmn.spriteUrl}
        name={pkmn.name}
        className="h-8 w-8 object-contain"
        disableClick
      />
      <span className="truncate pr-1 text-xs capitalize">{pkmn.name}</span>
    </div>
  );
}

// ─── Droppable Tier Column ──────────────────────────────────────────────────

function TierColumn({
  pointValue,
  label,
  pokemon,
  onDelete,
  onEditCondition,
  isLast,
}: {
  pointValue: number;
  label: string;
  pokemon: SeasonPokemonInput[];
  onDelete: (sp: SeasonPokemonInput) => void;
  onEditCondition: (sp: SeasonPokemonInput) => void;
  isLast: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tier-${pointValue}`,
    data: { pointValue },
  });

  const sorted = useMemo(
    () => [...pokemon].sort((a, b) => (a.pokemon?.name ?? '').localeCompare(b.pokemon?.name ?? '')),
    [pokemon],
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-44 shrink-0',
        !isLast && 'border-r border-border',
        isOver && 'bg-accent/20',
      )}
    >
      {/* Header */}
      <div className="border-b border-border bg-secondary/30 px-3 py-1.5 text-center text-sm font-bold">
        {label}
      </div>

      {/* Pokemon rows */}
      <div className="min-h-[40px]">
        {sorted.map((sp) => {
          const isDrafted = (sp.seasonPokemonTeams?.length ?? 0) > 0;
          return (
            <DraggablePokemonRow
              key={sp.id}
              sp={sp}
              onDelete={onDelete}
              onEditCondition={onEditCondition}
              isDrafted={isDrafted}
            />
          );
        })}
        {sorted.length === 0 && (
          <div className="px-2 py-3 text-center text-[11px] text-muted-foreground">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pokemon Search Combobox ────────────────────────────────────────────────

function PokemonSearchCombobox({
  leagueId,
  seasonId,
  generationId,
  existingPokemonIds,
  onSelect,
}: {
  leagueId: number;
  seasonId: number;
  generationId: number;
  existingPokemonIds: Set<number>;
  onSelect: (pokemon: PokemonInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading } = useFetch<PaginatedResponse<PokemonInput>>(
    debouncedSearch.length >= 2
      ? buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_BASE, [], {
          nameLike: debouncedSearch,
          generationIds: generationId,
          pageSize: 20,
          sortBy: 'name',
          sortOrder: 'ASC',
        })
      : null,
  );

  const filteredResults = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((p) => !existingPokemonIds.has(p.id));
  }, [data, existingPokemonIds]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Search className="h-4 w-4" />
          Add Pokemon
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
        <Command shouldFilter={false} loop>
          <CommandInput
            placeholder="Search pokemon..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner size={20} />
              </div>
            ) : (
              <>
                {debouncedSearch.length < 2 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Type at least 2 characters
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No pokemon found.</CommandEmpty>
                    <CommandGroup>
                      {filteredResults.map((pokemon) => (
                        <CommandItem
                          key={pokemon.id}
                          value={String(pokemon.id)}
                          onSelect={() => {
                            onSelect(pokemon);
                            setSearch('');
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <PokemonSprite
                              pokemonId={pokemon.id}
                              spriteUrl={pokemon.spriteUrl}
                              name={pokemon.name}
                              className="h-8 w-8 object-contain"
                              disableClick
                            />
                            <span className="capitalize">{pokemon.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Condition Edit Modal ───────────────────────────────────────────────────

function ConditionModal({
  sp,
  open,
  onOpenChange,
  onSave,
  saving,
}: {
  sp: SeasonPokemonInput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sp: SeasonPokemonInput, condition: string) => void;
  saving: boolean;
}) {
  const [condition, setCondition] = useState('');

  useEffect(() => {
    if (sp) setCondition(sp.condition ?? '');
  }, [sp]);

  if (!sp) return null;

  const pkmn = sp.pokemon!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <PokemonSprite
              pokemonId={pkmn.id}
              spriteUrl={pkmn.spriteUrl}
              name={pkmn.name}
              className="h-10 w-10 object-contain"
              disableClick
            />
            <span className="capitalize">{pkmn.name} — Condition</span>
          </DialogTitle>
        </DialogHeader>
        <Textarea
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="Enter condition notes..."
          rows={4}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => onSave(sp, condition)} disabled={saving}>
            {saving ? <Spinner size={18} /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation Dialog ─────────────────────────────────────────────

function DeleteConfirmDialog({
  sp,
  open,
  onOpenChange,
  onConfirm,
  deleting,
  error,
}: {
  sp: SeasonPokemonInput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting: boolean;
  error: string | null;
}) {
  if (!sp) return null;

  const pkmn = sp.pokemon!;
  const isDrafted = (sp.seasonPokemonTeams?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <PokemonSprite
              pokemonId={pkmn.id}
              spriteUrl={pkmn.spriteUrl}
              name={pkmn.name}
              className="h-10 w-10 object-contain"
              disableClick
            />
            <span className="capitalize">Remove {pkmn.name}?</span>
          </DialogTitle>
        </DialogHeader>
        {isDrafted && (
          <p className="text-sm text-destructive">
            This pokemon has team assignments and cannot be removed until those are cleared.
          </p>
        )}
        {error && <ErrorAlert message={error} />}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? <Spinner size={18} /> : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminTierListPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const router = useRouter();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  useCheckAuth();

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

  // Fetch season pokemon
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

  // Mutations
  const updateMutation = useMutation(
    ({ spId, data }: { spId: number; data: Partial<{ pointValue: number; condition: string }> }) =>
      LeagueApi.updateSeasonPokemon(leagueId, spId, data),
  );

  const createMutation = useMutation((data: { seasonId: number; pokemonId: number; pointValue: number }) =>
    LeagueApi.createSeasonPokemon(leagueId, data),
  );

  const deleteMutation = useMutation((spId: number) =>
    LeagueApi.deleteSeasonPokemon(leagueId, spId),
  );

  // Build tier columns: 0 (Unassigned) + 1..maxPointValue
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
          // Point value beyond maxPointValue — place in existing group or create
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

      // Extract target point value from droppable id (format: "tier-{pointValue}")
      const targetId = String(over.id);
      if (!targetId.startsWith('tier-')) return;
      const targetPointValue = Number(targetId.replace('tier-', ''));

      if (sp.pointValue === targetPointValue) return;

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
        await updateMutation.mutate({ spId: sp.id, data: { pointValue: targetPointValue } });
      } catch {
        // Revert on failure
        refetch();
      }
    },
    [updateMutation, setSpData, refetch],
  );

  // Add pokemon from search
  const handleAddPokemon = useCallback(
    async (pokemon: PokemonInput) => {
      try {
        const created = await createMutation.mutate({
          seasonId,
          pokemonId: pokemon.id,
          pointValue: 0,
        });
        // Refetch to get the full season pokemon with relations
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
        await updateMutation.mutate({ spId: sp.id, data: { condition } });
        setConditionModalOpen(false);
        setConditionSp(null);
        refetch();
      } catch {
        // Error shown via mutation
      }
    },
    [updateMutation, refetch],
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
            leagueId={leagueId}
            seasonId={seasonId}
            generationId={season.generationId}
            existingPokemonIds={existingPokemonIds}
            onSelect={handleAddPokemon}
          />
        )}
      </div>

      {spError && <ErrorAlert message={spError} />}
      {updateMutation.error && <ErrorAlert message={updateMutation.error} />}
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
        saving={updateMutation.loading}
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
