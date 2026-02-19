'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS, NAT_DEX_GENERATION_ID } from '@/lib/constants';
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
    selectedGenerations: [],
    selectedSpecialMoveCategories: [],
  });

  // Fetch abilities, types, moves, generations, and special move categories for dropdowns
  const abilitiesUrl = useMemo(
    () => buildUrlWithQuery(BASE_ENDPOINTS.ABILITY_BASE, [], { page: 1, pageSize: 1000 }),
    [],
  );
  const typesUrl = useMemo(
    () => buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_TYPE_BASE, [], { page: 1, pageSize: 100 }),
    [],
  );
  const movesUrl = useMemo(
    () => buildUrlWithQuery(BASE_ENDPOINTS.MOVE_BASE, [], { page: 1, pageSize: 10000 }),
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

  const { data: abilitiesData } = useFetch<PaginatedResponse<AbilityInput>>(abilitiesUrl);
  const { data: typesData } = useFetch<PaginatedResponse<PokemonTypeInput>>(typesUrl);
  const { data: movesData } = useFetch<PaginatedResponse<MoveInput>>(movesUrl);
  const { data: generationsData } = useFetch<PaginatedResponse<GenerationInput>>(generationsUrl);
  const { data: specialMoveCategoriesData } = useFetch<
    PaginatedResponse<SpecialMoveCategoryInput>
  >(specialMoveCategoriesUrl);

  const abilities = abilitiesData?.data || [];
  const types = typesData?.data || [];
  const moves = movesData?.data || [];
  const generations = generationsData?.data || [];
  const specialMoveCategories = specialMoveCategoriesData?.data || [];

  // Set Nat Dex as the default generation filter once data loads
  const hasInitializedGeneration = useRef(false);
  useEffect(() => {
    if (hasInitializedGeneration.current || generations.length === 0) return;
    const natDex = generations.find((g) => g.id === NAT_DEX_GENERATION_ID);
    if (natDex) {
      setFilters((prev) => ({ ...prev, selectedGenerations: [natDex] }));
      hasInitializedGeneration.current = true;
    }
  }, [generations]);

  // Build params for API call
  const params = useMemo(() => {
    const p: any = {
      page,
      pageSize,
      sortBy,
      sortOrder,
    };

    if (filters.nameLike.trim()) p.nameLike = filters.nameLike.trim();
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
    if (filters.selectedGenerations.length > 0) {
      p.generationIds = filters.selectedGenerations.map((g) => g.id);
    }
    if (filters.selectedSpecialMoveCategories.length > 0) {
      p.specialMoveCategoryIds = filters.selectedSpecialMoveCategories.map((smc) => smc.id);
    }

    return p;
  }, [page, pageSize, sortBy, sortOrder, filters]);

  // Build URL for pokemon fetch
  const pokemonUrl = useMemo(() => {
    return buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_BASE, [], params);
  }, [params]);

  // Fetch pokemon data
  const { data, loading, error } = useFetch<PaginatedResponse<PokemonInput>>(pokemonUrl);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleFilterChange = useCallback((newFilters: Partial<PokemonFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
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
      <h1 className="mb-4 text-2xl font-semibold">Pokemon</h1>

      <PokemonFilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        abilities={abilities}
        types={types}
        moves={moves}
        generations={generations}
        specialMoveCategories={specialMoveCategories}
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
