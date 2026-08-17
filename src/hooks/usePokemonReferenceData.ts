'use client';

import { useMemo } from 'react';
import { useApiSWR } from '@/hooks/useApiSWR';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type {
  AbilityInput,
  GenerationInput,
  MoveInput,
  PaginatedResponse,
  PokemonTypeInput,
  SpecialMoveCategoryInput,
} from '@/types';

interface UsePokemonReferenceDataOptions {
  selectedGenerationId: number;
  debouncedAbilitySearch: string;
  debouncedMoveSearch: string;
}

export function usePokemonReferenceData({
  selectedGenerationId,
  debouncedAbilitySearch,
  debouncedMoveSearch,
}: UsePokemonReferenceDataOptions) {
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

  const { data: typesData } = useApiSWR<PaginatedResponse<PokemonTypeInput>>(typesUrl);
  const { data: generationsData } = useApiSWR<PaginatedResponse<GenerationInput>>(generationsUrl);
  const { data: specialMoveCategoriesData } =
    useApiSWR<PaginatedResponse<SpecialMoveCategoryInput>>(specialMoveCategoriesUrl);
  const { data: abilitySearchData, loading: abilitySearchLoading } =
    useApiSWR<PaginatedResponse<AbilityInput>>(abilitySearchUrl);
  const { data: moveSearchData, loading: moveSearchLoading } =
    useApiSWR<PaginatedResponse<MoveInput>>(moveSearchUrl);

  return {
    types: typesData?.data || [],
    generations: generationsData?.data || [],
    specialMoveCategories: specialMoveCategoriesData?.data || [],
    abilitySearchResults: abilitySearchData?.data || [],
    moveSearchResults: moveSearchData?.data || [],
    abilitySearchLoading,
    moveSearchLoading,
  };
}
