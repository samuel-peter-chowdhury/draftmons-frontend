'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { Check, Pencil, Plus, X } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  Input,
  Pagination,
  Select,
  Spinner,
} from '@/components';
import { toTypeEffPokemon, TypeEffectivenessColumn } from '@/components/comparison';
import { PokemonFilterPanel } from '@/components/pokemon/PokemonFilterPanel';
import { PokemonModal } from '@/components/pokemon/PokemonModal';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { useApiSWR, useDebounce, useMutation, usePokemonModal, usePokemonSearch } from '@/hooks';
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
  TeamBuildSetOutput,
} from '@/types';
import { TeamBuildTierBrowser } from './TeamBuildTierBrowser';

interface DraftPrepTabProps {
  build: TeamBuildInput;
  onChanged: () => void;
  setBuild: Dispatch<SetStateAction<TeamBuildInput | null>>;
}

/** Payload shape shared by every add path in this tab (typeahead, tier browser, advanced search). */
interface AddPokemonPayload {
  pokemonId: number;
  pointValue?: number | null;
  condition?: string | null;
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

export function DraftPrepTab({ build, onChanged, setBuild }: DraftPrepTabProps) {
  const isSeasonLinked = build.seasonId != null;

  // Sort by points descending with a name tiebreaker — without the tiebreaker,
  // equal-point rows reshuffle on every refetch, which is very visible in a
  // fast add/remove row list.
  const sets = useMemo(
    () =>
      [...(build.teamBuildSets ?? [])].sort(
        (a, b) =>
          (b.pointValue ?? 0) - (a.pointValue ?? 0) ||
          (a.pokemon?.name ?? '').localeCompare(b.pokemon?.name ?? ''),
      ),
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

  // ---- One modal for the whole tab ----
  const { pokemonId, seasonPokemonId, open, openModal, onOpenChange } = usePokemonModal();

  // ---- One add mutation, gated per Pokemon ID ----
  // A shared `loading` flag would disable every one of the tier browser's ~1000
  // rows during any add, so in-flight adds are tracked per ID instead. The ref
  // mirrors the state so a double-click in the same tick can't create a
  // duplicate (team_build_set is unique on [teamBuildId, pokemonId]).
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
  const addingRef = useRef<Set<number>>(new Set());

  const addMutation = useMutation((payload: AddPokemonPayload) =>
    TeamBuildSetApi.create({ teamBuildId: build.id, ...payload }),
  );
  const { mutate: mutateAdd, error: addError } = addMutation;

  const addPokemon = useCallback(
    (payload: AddPokemonPayload) => {
      const id = payload.pokemonId;
      if (addingRef.current.has(id)) return;
      addingRef.current.add(id);
      setAddingIds(new Set(addingRef.current));
      // Adds are intentionally not optimistic: the create response carries no
      // typeEffectiveness, so an optimistic insert would render the coverage
      // panel with a wrong all-neutral row until the refetch landed.
      mutateAdd(payload)
        .then(() => onChanged())
        .catch(() => {
          /* surfaced via addMutation.error */
        })
        .finally(() => {
          addingRef.current.delete(id);
          setAddingIds(new Set(addingRef.current));
        });
    },
    [mutateAdd, onChanged],
  );

  // ---- Instant remove with undo ----
  const removeMutation = useMutation((id: number) => TeamBuildSetApi.delete(id));
  const restoreMutation = useMutation((snapshot: TeamBuildSetOutput) =>
    TeamBuildSetApi.create(snapshot),
  );
  const { mutate: mutateRemove, error: removeError } = removeMutation;
  const { mutate: mutateRestore, error: restoreError } = restoreMutation;

  const handleRemove = useCallback(
    (set: TeamBuildSetInput) => {
      const name = set.pokemon?.name ?? 'Pokémon';
      // A set carries the whole Match Prep competitive build, so capture every
      // field up front — undo re-POSTs it verbatim (with a fresh id).
      const snapshot: TeamBuildSetOutput = {
        teamBuildId: set.teamBuildId,
        pokemonId: set.pokemonId,
        pointValue: set.pointValue,
        condition: set.condition,
        itemId: set.itemId,
        abilityId: set.abilityId,
        move1Id: set.move1Id,
        move2Id: set.move2Id,
        move3Id: set.move3Id,
        move4Id: set.move4Id,
        natureId: set.natureId,
        hpEv: set.hpEv,
        attackEv: set.attackEv,
        defenseEv: set.defenseEv,
        specialAttackEv: set.specialAttackEv,
        specialDefenseEv: set.specialDefenseEv,
        speedEv: set.speedEv,
        hpIv: set.hpIv,
        attackIv: set.attackIv,
        defenseIv: set.defenseIv,
        specialAttackIv: set.specialAttackIv,
        specialDefenseIv: set.specialDefenseIv,
        speedIv: set.speedIv,
      };

      // Removal needs no data the client doesn't already have, so it's safe to
      // apply optimistically (unlike add).
      setBuild(
        (prev) =>
          prev && {
            ...prev,
            teamBuildSets: (prev.teamBuildSets ?? []).filter((s) => s.id !== set.id),
          },
      );

      mutateRemove(set.id)
        .then(() => {
          onChanged();
          addToast(
            `Removed ${name} from roster.`,
            'success',
            {
              label: 'Undo',
              altText: `Undo removing ${name}`,
              onClick: () => {
                mutateRestore(snapshot)
                  .then(() => onChanged())
                  .catch(() => {
                    /* surfaced via restoreMutation.error */
                  });
              },
            },
            8000,
          );
        })
        .catch(() => {
          // Roll the optimistic edit back; the error renders below the roster.
          onChanged();
        });
    },
    [mutateRemove, mutateRestore, onChanged, setBuild],
  );

  // ---- Live type coverage over the in-memory roster (no extra request) ----
  const coveragePokemon = useMemo(
    () =>
      toTypeEffPokemon(
        (build.teamBuildSets ?? [])
          .flatMap((s) => (s.pokemon ? [s.pokemon] : []))
          .sort((a, b) => b.speed - a.speed),
      ),
    [build.teamBuildSets],
  );

  return (
    <div className="space-y-3">
      {/* Sticky summary + name typeahead */}
      <div className="sticky top-[var(--header-h)] z-20 -mx-1 rounded-xl border border-border/[0.08] bg-background/90 px-3 py-2 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          {pointsBadge(totalPoints, isSeasonLinked ? build.season?.pointLimit : undefined)}
          {rosterBadge(
            build.teamBuildSets?.length ?? 0,
            isSeasonLinked ? build.season?.minRosterSize : undefined,
            isSeasonLinked ? build.season?.maxRosterSize : undefined,
          )}
        </div>
        <div className="mt-2">
          <NameTypeahead
            build={build}
            isSeasonLinked={isSeasonLinked}
            existingPokemonIds={existingPokemonIds}
            addingIds={addingIds}
            onAdd={addPokemon}
          />
        </div>
        {addError && (
          <div className="mt-2">
            <ErrorAlert message={addError} />
          </div>
        )}
      </div>

      {/* Current roster */}
      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Current Roster</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          {sets.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No Pokémon yet — search above or browse the tier list below.
            </p>
          ) : (
            // Two columns from `md` up — a single full-width column leaves a large
            // dead gap between the name and the points input on desktop.
            <div className="grid grid-cols-1 gap-1 md:grid-cols-2 md:gap-x-3">
              {sets.map((set) => (
                <RosterRow key={set.id} set={set} onChanged={onChanged} onRemove={handleRemove} />
              ))}
            </div>
          )}
          {removeError && (
            <div className="p-2">
              <ErrorAlert message={removeError} />
            </div>
          )}
          {restoreError && (
            <div className="p-2">
              <ErrorAlert message={restoreError} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live type coverage */}
      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Live Type Coverage</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {coveragePokemon.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Add Pokémon to see type coverage.
            </p>
          ) : (
            <TypeEffectivenessColumn
              teamName={build.name}
              pokemon={coveragePokemon}
              loading={false}
              error={null}
              onSpriteClick={openModal}
            />
          )}
        </CardContent>
      </Card>

      {/* Tier list browser (season-linked builds only) */}
      {isSeasonLinked && (
        <TeamBuildTierBrowser
          build={build}
          existingPokemonIds={existingPokemonIds}
          addingIds={addingIds}
          onAdd={addPokemon}
          onSpriteClick={openModal}
        />
      )}

      {/* Copy roster from a team (season-linked only) */}
      {isSeasonLinked && (
        <Card>
          <Accordion type="single" collapsible>
            <AccordionItem value="copy-roster" className="border-b-0">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                Copy Roster From Team
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <CopyRosterSection build={build} onChanged={onChanged} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      )}

      {/* Advanced search — a separate component so Radix's unmount-when-closed
          keeps usePokemonSearch's five reference-data fetches lazy. */}
      <Card>
        <Accordion type="single" collapsible>
          <AccordionItem value="advanced-search" className="border-b-0">
            <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
              Advanced search
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <AdvancedPokemonSearch
                build={build}
                isSeasonLinked={isSeasonLinked}
                existingPokemonIds={existingPokemonIds}
                addingIds={addingIds}
                onAdd={addPokemon}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      <PokemonModal
        pokemonId={pokemonId}
        open={open}
        onOpenChange={onOpenChange}
        seasonPokemonId={seasonPokemonId}
        leagueId={build.season?.leagueId}
      />
    </div>
  );
}

/** A single compact roster row: inline points, disclosure-revealed condition, instant remove. */
function RosterRow({
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
  const [expanded, setExpanded] = useState(false);
  const conditionId = useId();

  useEffect(() => {
    setPointValue(set.pointValue?.toString() ?? '');
    setCondition(set.condition ?? '');
  }, [set.pointValue, set.condition]);

  const updateMutation = useMutation(
    (data: { pointValue?: number | null; condition?: string | null }) =>
      TeamBuildSetApi.update(set.id, data),
    { onSuccess: () => onChanged() },
  );
  const { mutate: mutateUpdate } = updateMutation;

  const savePoints = () => {
    const parsed = pointValue.trim() === '' ? null : Number(pointValue);
    if (parsed === (set.pointValue ?? null)) return;
    mutateUpdate({ pointValue: parsed }).catch(() => {
      /* surfaced via updateMutation.error */
    });
  };

  const saveCondition = () => {
    const next = condition.trim() === '' ? null : condition;
    if (next === (set.condition ?? null)) return;
    mutateUpdate({ condition: next }).catch(() => {
      /* surfaced via updateMutation.error */
    });
  };

  const pkmn = set.pokemon;
  if (!pkmn) return null;

  // Self-contained bordered row rather than a shared bottom border — in a
  // two-column grid a bottom border reads as a broken list.
  return (
    <div className="rounded-md border border-border/[0.08]">
      <div className="flex h-10 items-center gap-2 px-1">
        <PokemonSprite
          pokemonId={pkmn.id}
          spriteUrl={pkmn.spritePngUrl}
          name={pkmn.name}
          className="h-8 w-8 object-contain"
          disableClick
        />
        <span className="flex-1 truncate text-xs font-medium capitalize">{pkmn.name}</span>
        {updateMutation.loading && <Spinner size={12} />}
        <Input
          type="number"
          min={0}
          value={pointValue}
          onChange={(e) => setPointValue(e.target.value)}
          onBlur={savePoints}
          className="h-7 w-16 px-2 text-xs"
          aria-label={`Points for ${pkmn.name}`}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={`Edit condition for ${pkmn.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(set)}
          aria-label={`Remove ${pkmn.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {expanded && (
        <div className="flex items-center gap-2 px-1 pb-2">
          <label htmlFor={conditionId} className="text-[11px] text-muted-foreground">
            Condition
          </label>
          <Input
            id={conditionId}
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            onBlur={saveCondition}
            className="h-7 flex-1 text-xs"
            placeholder="—"
          />
        </div>
      )}
      {updateMutation.error && (
        <div className="px-1 pb-2">
          <ErrorAlert message={updateMutation.error} />
        </div>
      )}
    </div>
  );
}

interface TypeaheadRow {
  key: string;
  pkmn: PokemonInput;
  sp: SeasonPokemonInput | null;
}

/**
 * Name-only debounced typeahead. Deliberately assembles its own URL instead of
 * reusing `usePokemonSearch` — that hook mounts `usePokemonReferenceData`
 * unconditionally (five extra requests), which is too much for an
 * always-visible search box.
 */
function NameTypeahead({
  build,
  isSeasonLinked,
  existingPokemonIds,
  addingIds,
  onAdd,
}: {
  build: TeamBuildInput;
  isSeasonLinked: boolean;
  existingPokemonIds: Set<number>;
  addingIds: Set<number>;
  onAdd: (payload: AddPokemonPayload) => void;
}) {
  const [nameQuery, setNameQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listId = useId();

  const debouncedName = useDebounce(nameQuery, 300);

  const searchUrl = useMemo(() => {
    if (!debouncedName.trim()) return null; // no query → no request
    return buildUrlWithQuery(
      isSeasonLinked ? BASE_ENDPOINTS.SEASON_POKEMON_BASE : BASE_ENDPOINTS.POKEMON_BASE,
      [],
      {
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
        // Not optional: TeamBuildSetService rejects any Pokemon whose generation
        // differs from the build's, so an unfiltered search would mostly return
        // unaddable results.
        generationIds: [build.generationId],
        nameLike: debouncedName.trim(),
        ...(isSeasonLinked ? { seasonId: build.seasonId, full: true } : {}),
      },
    );
  }, [debouncedName, isSeasonLinked, build.generationId, build.seasonId]);

  const { data, loading } = useApiSWR<PaginatedResponse<SeasonPokemonInput | PokemonInput>>(
    searchUrl,
  );

  const rows = useMemo<TypeaheadRow[]>(
    () =>
      (data?.data ?? []).flatMap((raw) => {
        // In season mode rows are SeasonPokemon; in standalone mode they're Pokemon.
        const sp = isSeasonLinked ? (raw as SeasonPokemonInput) : null;
        const pkmn = isSeasonLinked ? sp?.pokemon : (raw as PokemonInput);
        if (!pkmn) return [];
        return [{ key: sp ? `sp-${sp.id}` : `p-${pkmn.id}`, pkmn, sp }];
      }),
    [data, isSeasonLinked],
  );

  useEffect(() => {
    setHighlight(0);
  }, [rows]);

  const hasQuery = nameQuery.trim().length > 0;
  const showDropdown = focused && hasQuery && !dismissed;

  const select = (row: TypeaheadRow) => {
    if (existingPokemonIds.has(row.pkmn.id) || addingIds.has(row.pkmn.id)) return;
    onAdd(
      row.sp
        ? { pokemonId: row.pkmn.id, pointValue: row.sp.pointValue, condition: row.sp.condition }
        : { pokemonId: row.pkmn.id },
    );
    setNameQuery('');
    setDismissed(false);
  };

  return (
    <div className="relative">
      <Input
        value={nameQuery}
        onChange={(e) => {
          setNameQuery(e.target.value);
          setDismissed(false);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setDismissed(true);
            return;
          }
          if (!showDropdown || rows.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, rows.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const row = rows[highlight];
            if (row) select(row);
          }
        }}
        className="h-8 text-xs"
        placeholder="Add a Pokémon by name..."
        aria-label="Add a Pokémon by name"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
      />

      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Pokémon search results"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border/[0.08] bg-popover p-1 shadow-md backdrop-blur-md"
        >
          {loading && rows.length === 0 && (
            <li className="flex items-center justify-center py-3">
              <Spinner size={16} />
            </li>
          )}
          {!loading && rows.length === 0 && (
            <li className="px-2 py-1.5 text-xs text-muted-foreground">No Pokémon found.</li>
          )}
          {rows.map((row, idx) => {
            const alreadyAdded = existingPokemonIds.has(row.pkmn.id);
            const adding = addingIds.has(row.pkmn.id);
            // Drafted by another team this season: dimmed, but still addable —
            // builds are practice/planning tools.
            const isDrafted = (row.sp?.seasonPokemonTeams?.length ?? 0) > 0;
            return (
              <li
                key={row.key}
                role="option"
                aria-selected={idx === highlight}
                aria-disabled={alreadyAdded}
                // onMouseDown + preventDefault: with onClick the input's blur
                // closes the dropdown first and the click never lands.
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(row);
                }}
                className={`flex h-9 cursor-pointer items-center gap-2 rounded-md px-1 text-xs${
                  idx === highlight ? ' bg-accent text-accent-foreground' : ''
                }${alreadyAdded ? ' cursor-default opacity-60' : ''}`}
              >
                <PokemonSprite
                  pokemonId={row.pkmn.id}
                  spriteUrl={row.pkmn.spritePngUrl}
                  name={row.pkmn.name}
                  className={`h-8 w-8 object-contain${isDrafted ? ' grayscale' : ''}`}
                  disableClick
                />
                <span
                  className={`flex-1 truncate capitalize${isDrafted ? ' text-muted-foreground line-through' : ''}`}
                >
                  {row.pkmn.name}
                </span>
                {row.sp != null && (
                  <span className="text-[11px] text-muted-foreground">{row.sp.pointValue} pts</span>
                )}
                {adding ? (
                  <Spinner size={12} />
                ) : alreadyAdded ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
              </li>
            );
          })}
        </ul>
      )}
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
    <div className="space-y-3">
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
          onClick={() =>
            copyMutation.mutate().catch(() => {
              /* surfaced via copyMutation.error */
            })
          }
          disabled={!selectedTeamId || rosterLoading || copyMutation.loading}
        >
          {copyMutation.loading ? <Spinner size={18} /> : 'Copy'}
        </Button>
      </div>
      {copyMutation.error && <ErrorAlert message={copyMutation.error} />}
    </div>
  );
}

/**
 * The full filter-panel search, now behind a disclosure. Kept as its own
 * component so `usePokemonSearch`'s reference-data fetches only fire once the
 * user opens the section (Radix unmounts closed accordion content).
 */
function AdvancedPokemonSearch({
  build,
  isSeasonLinked,
  existingPokemonIds,
  addingIds,
  onAdd,
}: {
  build: TeamBuildInput;
  isSeasonLinked: boolean;
  existingPokemonIds: Set<number>;
  addingIds: Set<number>;
  onAdd: (payload: AddPokemonPayload) => void;
}) {
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
    initialPageSize: 10,
  });

  useEffect(() => {
    resetGeneration(build.generationId);
  }, [build.generationId, resetGeneration]);

  return (
    <div className="space-y-4">
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

      {loading && !data && (
        <div className="flex items-center justify-center py-6">
          <Spinner size={28} />
        </div>
      )}

      {data && (
        <ul className="divide-y divide-border/[0.08] rounded-lg border border-border/[0.08]">
          {data.data.length === 0 && (
            <li className="p-3 text-xs text-muted-foreground">
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
            const adding = addingIds.has(pkmn.id);
            return (
              <li key={sp ? sp.id : pkmn.id} className="flex items-center gap-2 p-2">
                <PokemonSprite
                  pokemonId={pkmn.id}
                  spriteUrl={pkmn.spritePngUrl}
                  name={pkmn.name}
                  className="h-8 w-8 object-contain"
                  disableClick
                />
                <span className="flex-1 truncate text-xs font-medium capitalize">{pkmn.name}</span>
                {sp != null && (
                  <span className="text-[11px] text-muted-foreground">{sp.pointValue} pts</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  disabled={alreadyAdded || adding}
                  onClick={() =>
                    onAdd(
                      sp != null
                        ? { pokemonId: pkmn.id, pointValue: sp.pointValue, condition: sp.condition }
                        : { pokemonId: pkmn.id },
                    )
                  }
                  aria-label={
                    alreadyAdded
                      ? `${pkmn.name} is already in this build`
                      : `Add ${pkmn.name} to this build`
                  }
                >
                  {adding ? (
                    <Spinner size={12} />
                  ) : alreadyAdded ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </Button>
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
    </div>
  );
}
