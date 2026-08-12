'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFetch, useDebounce } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type {
  AbilityInput,
  MoveInput,
  PaginatedResponse,
  PokemonInput,
  PokemonTypeInput,
  SpecialMoveCategoryInput,
} from '@/types';
import {
  PokemonFilterPanel,
  type PokemonFilters,
} from '@/components/pokemon/PokemonFilterPanel';

type Props = {
  generationId: number;
  onSelect: (p: PokemonInput) => void;

  className?: string;
  autoFocus?: boolean;

  pageSize?: number;
};

type SortableColumn = 'name';

const DEFAULT_FILTERS: PokemonFilters = {
  nameLike: '',
  minHp: '',
  maxHp: '',
  minAttack: '',
  maxAttack: '',
  minDefense: '',
  maxDefense: '',
  minSpecialAttack: '',
  maxSpecialAttack: '',
  minSpecialDefense: '',
  maxSpecialDefense: '',
  minSpeed: '',
  maxSpeed: '',
  minBaseStatTotal: '',
  maxBaseStatTotal: '',
  minPhysicalBulk: '',
  maxPhysicalBulk: '',
  minSpecialBulk: '',
  maxSpecialBulk: '',
  selectedAbilities: [],
  selectedTypes: [],
  selectedWeakTypes: [],
  selectedNotWeakTypes: [],
  selectedResistedTypes: [],
  selectedImmuneTypes: [],
  selectedMoves: [],
  selectedSpecialMoveCategories: [],
};

export default function PokemonSlotSearch({
  generationId,
  onSelect,
  className,
  autoFocus,
  pageSize = 24,
}: Props) {
  const inputAutofocusRef = useRef<HTMLInputElement | null>(null);

  const [page, setPage] = useState(1);
  const [sortBy] = useState<SortableColumn>('name');
  const [sortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const [filters, setFilters] = useState<PokemonFilters>(DEFAULT_FILTERS);
  const [abilitySearch, setAbilitySearch] = useState('');
  const [moveSearch, setMoveSearch] = useState('');

  const debouncedNameLike = useDebounce(filters.nameLike, 300);
  const debouncedAbilitySearch = useDebounce(abilitySearch, 300);
  const debouncedMoveSearch = useDebounce(moveSearch, 300);

  // static dropdown data
  const typesUrl = useMemo(
    () => buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_TYPE_BASE, [], { page: 1, pageSize: 100 }),
    [],
  );
  const specialMoveCategoriesUrl = useMemo(
    () =>
      buildUrlWithQuery(BASE_ENDPOINTS.SPECIAL_MOVE_CATEGORY_BASE, [], {
        page: 1,
        pageSize: 100,
      }),
    [],
  );

  const { data: typesData } = useFetch<PaginatedResponse<PokemonTypeInput>>(typesUrl);
  const { data: specialMoveCategoriesData } = useFetch<
    PaginatedResponse<SpecialMoveCategoryInput>
  >(specialMoveCategoriesUrl);

  const types = typesData?.data || [];
  const specialMoveCategories = specialMoveCategoriesData?.data || [];

  // ability search URL (exactly like PokemonPage)
  const abilitySearchUrl = useMemo(() => {
    const params: Parameters<typeof buildUrlWithQuery>[2] = {
      page: 1,
      pageSize: 10,
      generationIds: [generationId],
      sortBy: 'name',
      sortOrder: 'ASC',
    };
    if (debouncedAbilitySearch.trim()) params.nameLike = debouncedAbilitySearch.trim();
    return buildUrlWithQuery(BASE_ENDPOINTS.ABILITY_BASE, [], params);
  }, [generationId, debouncedAbilitySearch]);

  // move search URL (exactly like PokemonPage)
  const moveSearchUrl = useMemo(() => {
    const params: Parameters<typeof buildUrlWithQuery>[2] = {
      page: 1,
      pageSize: 10,
      generationIds: [generationId],
      sortBy: 'name',
      sortOrder: 'ASC',
    };
    if (debouncedMoveSearch.trim()) params.nameLike = debouncedMoveSearch.trim();
    return buildUrlWithQuery(BASE_ENDPOINTS.MOVE_BASE, [], params);
  }, [generationId, debouncedMoveSearch]);

  const { data: abilitySearchData, loading: abilitySearchLoading } =
    useFetch<PaginatedResponse<AbilityInput>>(abilitySearchUrl);
  const { data: moveSearchData, loading: moveSearchLoading } =
    useFetch<PaginatedResponse<MoveInput>>(moveSearchUrl);

  const abilitySearchResults = abilitySearchData?.data || [];
  const moveSearchResults = moveSearchData?.data || [];

  // Build pokemon params EXACTLY like PokemonPage
  const params = useMemo(() => {
    const p: any = { page, pageSize, sortBy, sortOrder };

    if (debouncedNameLike.trim()) p.nameLike = debouncedNameLike.trim();
    if (filters.minHp) p.minHp = parseInt(filters.minHp);
    if (filters.maxHp) p.maxHp = parseInt(filters.maxHp);
    if (filters.minAttack) p.minAttack = parseInt(filters.minAttack);
    if (filters.maxAttack) p.maxAttack = parseInt(filters.maxAttack);
    if (filters.minDefense) p.minDefense = parseInt(filters.minDefense);
    if (filters.maxDefense) p.maxDefense = parseInt(filters.maxDefense);
    if (filters.minSpecialAttack) p.minSpecialAttack = parseInt(filters.minSpecialAttack);
    if (filters.maxSpecialAttack) p.maxSpecialAttack = parseInt(filters.maxSpecialAttack);
    if (filters.minSpecialDefense) p.minSpecialDefense = parseInt(filters.minSpecialDefense);
    if (filters.maxSpecialDefense) p.maxSpecialDefense = parseInt(filters.maxSpecialDefense);
    if (filters.minSpeed) p.minSpeed = parseInt(filters.minSpeed);
    if (filters.maxSpeed) p.maxSpeed = parseInt(filters.maxSpeed);
    if (filters.minBaseStatTotal) p.minBaseStatTotal = parseInt(filters.minBaseStatTotal);
    if (filters.maxBaseStatTotal) p.maxBaseStatTotal = parseInt(filters.maxBaseStatTotal);
    if (filters.minPhysicalBulk) p.minPhysicalBulk = parseInt(filters.minPhysicalBulk);
    if (filters.maxPhysicalBulk) p.maxPhysicalBulk = parseInt(filters.maxPhysicalBulk);
    if (filters.minSpecialBulk) p.minSpecialBulk = parseInt(filters.minSpecialBulk);
    if (filters.maxSpecialBulk) p.maxSpecialBulk = parseInt(filters.maxSpecialBulk);

    if (filters.selectedAbilities.length > 0) p.abilityIds = filters.selectedAbilities.map((a) => a.id);
    if (filters.selectedTypes.length > 0) p.pokemonTypeIds = filters.selectedTypes.map((t) => t.id);
    if (filters.selectedWeakTypes.length > 0) p.weakPokemonTypeIds = filters.selectedWeakTypes.map((t) => t.id);
    if (filters.selectedNotWeakTypes.length > 0) p.notWeakPokemonTypeIds = filters.selectedNotWeakTypes.map((t) => t.id);
    if (filters.selectedResistedTypes.length > 0) p.resistedPokemonTypeIds = filters.selectedResistedTypes.map((t) => t.id);
    if (filters.selectedImmuneTypes.length > 0) p.immunePokemonTypeIds = filters.selectedImmuneTypes.map((t) => t.id);
    if (filters.selectedMoves.length > 0) p.moveIds = filters.selectedMoves.map((m) => m.id);

    p.generationIds = [generationId];

    if (filters.selectedSpecialMoveCategories.length > 0) {
      p.specialMoveCategoryIds = filters.selectedSpecialMoveCategories.map((smc) => smc.id);
    }

    return p;
  }, [page, pageSize, sortBy, sortOrder, filters, generationId, debouncedNameLike]);

  const pokemonUrl = useMemo(() => buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_BASE, [], params), [params]);
  const { data, loading, error } = useFetch<PaginatedResponse<PokemonInput>>(pokemonUrl);
  const results = data?.data || [];

  // When filters change, reset page (same behavior as you want in editor)
  const handleFilterChange = useCallback((newFilters: Partial<PokemonFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  // when generation changes, clear dependent filters (matches PokemonPage intent)
  useEffect(() => {
    setFilters((prev) => ({ ...prev, selectedAbilities: [], selectedMoves: [] }));
    setAbilitySearch('');
    setMoveSearch('');
    setPage(1);
  }, [generationId]);

  // editor nicety: focus the name input inside the panel
  useEffect(() => {
    if (!autoFocus) return;
    // PokemonFilterPanel uses Input id="nameLike" so we can query it
    const el = document.getElementById('nameLike') as HTMLInputElement | null;
    if (el) el.focus();
  }, [autoFocus]);

  const selectFirst = useCallback(() => {
    if (results.length > 0) onSelect(results[0]);
  }, [results, onSelect]);

  return (
    <div className={className}>
      <PokemonFilterPanel
        filters={filters}
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

      <div className="mt-3 text-xs text-muted-foreground">
        {loading ? 'Loading…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
        {error ? ' • error' : ''}
        {/* Enter-to-select convenience */}
        <button
          type="button"
          onClick={selectFirst}
          className="ml-3 underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-muted-foreground"
        >
          Select first
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-border bg-background px-3 py-3 text-sm">
          <div className="font-medium">Couldn’t load Pokémon</div>
          <div className="mt-1 text-muted-foreground">
            {typeof error === 'string' ? error : 'Unknown error'}
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((p) => (
          <button
            key={String(p.id)}
            type="button"
            onClick={() => onSelect(p)}
            className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
          >
            {p.spriteUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.spriteUrl} alt={p.name} className="h-8 w-8" />
            ) : (
              <div className="h-8 w-8 rounded bg-muted" />
            )}

            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <div className="truncate text-sm font-medium">{p.name}</div>
                {'dexId' in p && typeof (p as any).dexId === 'number' ? (
                  <div className="shrink-0 text-xs text-muted-foreground">#{(p as any).dexId}</div>
                ) : null}
              </div>

              {Array.isArray((p as any).pokemonTypes) && (p as any).pokemonTypes.length > 0 ? (
                <div className="truncate text-xs text-muted-foreground">
                  {(p as any).pokemonTypes.map((t: any) => t.name).join(' / ')}
                </div>
              ) : null}

              {'baseStatTotal' in p ? (
                <div className="truncate text-xs text-muted-foreground">
                  BST {(p as any).baseStatTotal} • Spe {(p as any).speed}
                </div>
              ) : null}
            </div>
          </button>
        ))}
      </div>

      {!loading && !error && results.length === 0 ? (
        <div className="mt-6 rounded-md border border-border bg-background px-3 py-8 text-center text-sm text-muted-foreground">
          No results.
        </div>
      ) : null}
    </div>
  );
}