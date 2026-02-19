'use client';

import { useState, useMemo, useCallback } from 'react';
import { useFetch, useDebounce } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS, NAT_DEX_GENERATION_ID } from '@/lib/constants';
import { formatGenerationName } from '@/lib/utils';
import { Label } from '@/components';
import { Select } from '@/components/ui/select';
import type {
  AbilityInput,
  GenerationInput,
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
import { PokemonTable } from '@/components/pokemon/PokemonTable';

type SortableColumn =
  | 'name'
  | 'hp'
  | 'attack'
  | 'defense'
  | 'specialAttack'
  | 'specialDefense'
  | 'speed'
  | 'baseStatTotal';

export default function PokemonPage() {
  // Pagination & sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<SortableColumn>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Generation state (separate from filter panel)
  const [selectedGenerationId, setSelectedGenerationId] = useState<number>(NAT_DEX_GENERATION_ID);

  // Filter state
  const [filters, setFilters] = useState<PokemonFilters>({
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
  });

  // Ability/Move search state (raw text from FilterDropdown)
  const [abilitySearch, setAbilitySearch] = useState('');
  const [moveSearch, setMoveSearch] = useState('');

  // Debounce search terms
  const debouncedNameLike = useDebounce(filters.nameLike, 300);
  const debouncedAbilitySearch = useDebounce(abilitySearch, 300);
  const debouncedMoveSearch = useDebounce(moveSearch, 300);

  // Fetch types, generations, and special move categories (static dropdowns)
  const typesUrl = useMemo(
    () => buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_TYPE_BASE, [], { page: 1, pageSize: 100 }),
    [],
  );
  const generationsUrl = useMemo(
    () => buildUrlWithQuery(BASE_ENDPOINTS.GENERATION_BASE, [], { page: 1, pageSize: 100 }),
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

  // Build ability search URL (always fetch, filtered by generation; add nameLike when typing)
  const abilitySearchUrl = useMemo(() => {
    const params: Parameters<typeof buildUrlWithQuery>[2] = {
      page: 1,
      pageSize: 10,
      generationIds: [selectedGenerationId],
      sortBy: 'name',
      sortOrder: 'ASC',
    };
    if (debouncedAbilitySearch.trim()) {
      params.nameLike = debouncedAbilitySearch.trim();
    }
    return buildUrlWithQuery(BASE_ENDPOINTS.ABILITY_BASE, [], params);
  }, [selectedGenerationId, debouncedAbilitySearch]);

  // Build move search URL (always fetch, filtered by generation; add nameLike when typing)
  const moveSearchUrl = useMemo(() => {
    const params: Parameters<typeof buildUrlWithQuery>[2] = {
      page: 1,
      pageSize: 10,
      generationIds: [selectedGenerationId],
      sortBy: 'name',
      sortOrder: 'ASC',
    };
    if (debouncedMoveSearch.trim()) {
      params.nameLike = debouncedMoveSearch.trim();
    }
    return buildUrlWithQuery(BASE_ENDPOINTS.MOVE_BASE, [], params);
  }, [selectedGenerationId, debouncedMoveSearch]);

  const { data: typesData } = useFetch<PaginatedResponse<PokemonTypeInput>>(typesUrl);
  const { data: generationsData } = useFetch<PaginatedResponse<GenerationInput>>(generationsUrl);
  const { data: specialMoveCategoriesData } = useFetch<
    PaginatedResponse<SpecialMoveCategoryInput>
  >(specialMoveCategoriesUrl);

  const { data: abilitySearchData, loading: abilitySearchLoading } =
    useFetch<PaginatedResponse<AbilityInput>>(abilitySearchUrl);
  const { data: moveSearchData, loading: moveSearchLoading } =
    useFetch<PaginatedResponse<MoveInput>>(moveSearchUrl);

  const types = typesData?.data || [];
  const generations = generationsData?.data || [];
  const specialMoveCategories = specialMoveCategoriesData?.data || [];
  const abilitySearchResults = abilitySearchData?.data || [];
  const moveSearchResults = moveSearchData?.data || [];

  // Build params for API call
  const params = useMemo(() => {
    const p: any = {
      page,
      pageSize,
      sortBy,
      sortOrder,
    };

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
    p.generationIds = [selectedGenerationId];
    if (filters.selectedSpecialMoveCategories.length > 0) {
      p.specialMoveCategoryIds = filters.selectedSpecialMoveCategories.map((smc) => smc.id);
    }

    return p;
  }, [page, pageSize, sortBy, sortOrder, filters, selectedGenerationId, debouncedNameLike]);

  // Build URL for pokemon fetch
  const pokemonUrl = useMemo(() => {
    return buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_BASE, [], params);
  }, [params]);

  // Fetch pokemon data
  const { data, loading, error } = useFetch<PaginatedResponse<PokemonInput>>(pokemonUrl);

  const handleGenerationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGenerationId(Number(e.target.value));
    setFilters((prev) => ({ ...prev, selectedAbilities: [], selectedMoves: [] }));
    setAbilitySearch('');
    setMoveSearch('');
    setPage(1);
  }, []);

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

  return (
    <div className="mx-auto max-w-[1600px] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pokemon</h1>
        <div className="flex items-center gap-2">
          <Label htmlFor="generation-select" className="text-sm text-muted-foreground">
            Generation:
          </Label>
          <Select
            id="generation-select"
            value={selectedGenerationId}
            onChange={handleGenerationChange}
            className="h-9 w-auto px-2 py-1"
            aria-label="Select generation"
          >
            {generations.map((g) => (
              <option key={g.id} value={g.id}>
                {formatGenerationName(g.name)}
              </option>
            ))}
          </Select>
        </div>
      </div>

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

      <PokemonTable
        data={data}
        loading={loading}
        error={error}
        sortBy={sortBy}
        sortOrder={sortOrder}
        page={page}
        pageSize={pageSize}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
