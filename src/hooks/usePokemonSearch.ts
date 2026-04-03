'use client';

import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useFetch } from '@/hooks/useFetch';
import { usePokemonReferenceData } from '@/hooks/usePokemonReferenceData';
import { buildUrlWithQuery } from '@/lib/api';
import { NAT_DEX_GENERATION_ID } from '@/lib/constants';
import type { PaginatedResponse, PokemonInput, SortableColumn } from '@/types';
import type { PokemonFilters } from '@/components/pokemon/PokemonFilterPanel';

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
  minPointValue: '',
  maxPointValue: '',
  excludeDrafted: false,
  selectedAbilities: [],
  selectedTypes: [],
  selectedWeakTypes: [],
  selectedNotWeakTypes: [],
  selectedResistedTypes: [],
  selectedImmuneTypes: [],
  selectedMoves: [],
  selectedSpecialMoveCategories: [],
};

const NUMERIC_FILTER_FIELDS = [
  'minHp',
  'maxHp',
  'minAttack',
  'maxAttack',
  'minDefense',
  'maxDefense',
  'minSpecialAttack',
  'maxSpecialAttack',
  'minSpecialDefense',
  'maxSpecialDefense',
  'minSpeed',
  'maxSpeed',
  'minBaseStatTotal',
  'maxBaseStatTotal',
  'minPhysicalBulk',
  'maxPhysicalBulk',
  'minSpecialBulk',
  'maxSpecialBulk',
  'minPointValue',
  'maxPointValue',
] as const satisfies readonly (keyof PokemonFilters)[];

interface UsePokemonSearchOptions {
  endpoint: string;
  extraParams?: Record<string, unknown>;
  initialFilters?: Partial<PokemonFilters>;
  initialSortBy?: SortableColumn;
  initialSortOrder?: 'ASC' | 'DESC';
}

function buildFilterParams(
  filters: PokemonFilters,
  debouncedNameLike: string,
): Record<string, string | number | number[] | boolean> {
  const p: Record<string, string | number | number[] | boolean> = {};

  if (debouncedNameLike.trim()) p.nameLike = debouncedNameLike.trim();

  for (const field of NUMERIC_FILTER_FIELDS) {
    const value = filters[field];
    if (value) p[field] = parseInt(value as string);
  }

  if (filters.excludeDrafted) p.excludeDrafted = filters.excludeDrafted;

  if (filters.selectedAbilities.length > 0) {
    p.abilityIds = filters.selectedAbilities.map((a) => a.id);
  }
  if (filters.selectedTypes.length > 0) {
    p.pokemonTypeIds = filters.selectedTypes.map((t) => t.id);
  }
  if (filters.selectedWeakTypes.length > 0) {
    p.weakPokemonTypeIds = filters.selectedWeakTypes.map((t) => t.id);
  }
  if (filters.selectedNotWeakTypes.length > 0) {
    p.notWeakPokemonTypeIds = filters.selectedNotWeakTypes.map((t) => t.id);
  }
  if (filters.selectedResistedTypes.length > 0) {
    p.resistedPokemonTypeIds = filters.selectedResistedTypes.map((t) => t.id);
  }
  if (filters.selectedImmuneTypes.length > 0) {
    p.immunePokemonTypeIds = filters.selectedImmuneTypes.map((t) => t.id);
  }
  if (filters.selectedMoves.length > 0) {
    p.moveIds = filters.selectedMoves.map((m) => m.id);
  }
  if (filters.selectedSpecialMoveCategories.length > 0) {
    p.specialMoveCategoryIds = filters.selectedSpecialMoveCategories.map((smc) => smc.id);
  }

  return p;
}

export function usePokemonSearch({
  endpoint,
  extraParams,
  initialFilters,
  initialSortBy = 'name',
  initialSortOrder = 'ASC',
}: UsePokemonSearchOptions) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<SortableColumn>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(initialSortOrder);
  const [selectedGenerationId, setSelectedGenerationId] = useState<number>(NAT_DEX_GENERATION_ID);
  const [filters, setFilters] = useState<PokemonFilters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const [abilitySearch, setAbilitySearch] = useState('');
  const [moveSearch, setMoveSearch] = useState('');

  const debouncedNameLike = useDebounce(filters.nameLike, 300);
  const debouncedAbilitySearch = useDebounce(abilitySearch, 300);
  const debouncedMoveSearch = useDebounce(moveSearch, 300);

  // Stabilize extraParams to prevent stale memos when callers pass inline objects
  const extraParamsKey = JSON.stringify(extraParams);

  const referenceData = usePokemonReferenceData({
    selectedGenerationId,
    debouncedAbilitySearch,
    debouncedMoveSearch,
  });

  const pokemonUrl = useMemo(() => {
    const filterParams = buildFilterParams(filters, debouncedNameLike);
    const params = {
      page,
      pageSize,
      sortBy,
      sortOrder,
      generationIds: [selectedGenerationId],
      ...filterParams,
      ...JSON.parse(extraParamsKey || '{}'),
    };
    return buildUrlWithQuery(endpoint, [], params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortOrder, filters, selectedGenerationId, debouncedNameLike, endpoint, extraParamsKey]);

  const { data, loading, error } = useFetch<PaginatedResponse<PokemonInput>>(pokemonUrl);

  const resetGeneration = useCallback((generationId: number) => {
    setSelectedGenerationId(generationId);
    setFilters((prev) => ({ ...prev, selectedAbilities: [], selectedMoves: [] }));
    setAbilitySearch('');
    setMoveSearch('');
    setPage(1);
  }, []);

  const handleGenerationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      resetGeneration(Number(e.target.value));
    },
    [resetGeneration],
  );

  const handleFilterChange = useCallback((newFilters: Partial<PokemonFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const handleSort = useCallback(
    (column: SortableColumn) => {
      if (sortBy === column) {
        setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
      } else {
        setSortBy(column);
        setSortOrder('DESC');
      }
    },
    [sortBy, sortOrder],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  return {
    // Data
    data,
    loading,
    error,
    // Reference data
    ...referenceData,
    // Filter panel props
    filters,
    // Table props
    sortBy,
    sortOrder,
    page,
    pageSize,
    // Generation select
    selectedGenerationId,
    // Handlers
    resetGeneration,
    handleGenerationChange,
    handleFilterChange,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    setAbilitySearch,
    setMoveSearch,
  };
}
