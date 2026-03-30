'use client';

import { usePokemonSearch } from '@/hooks';
import { useEffect } from 'react';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatGenerationName } from '@/lib/utils';
import { Label } from '@/components';
import { Select } from '@/components/ui/select';
import type { SeasonInput } from '@/types';
import { PokemonFilterPanel } from '@/components/pokemon/PokemonFilterPanel';
import { PokemonTable } from '@/components/pokemon/PokemonTable';
import { useParams } from 'next/navigation';

export default function SeasonPokemonSearchPage() {
  const params = useParams<{ id: string; seasonId: string; teamId: string }>();
  const seasonId = Number(params.seasonId);

  const {
    data,
    loading,
    error,
    filters,
    types,
    generations,
    specialMoveCategories,
    abilitySearchResults,
    moveSearchResults,
    abilitySearchLoading,
    moveSearchLoading,
    sortBy,
    sortOrder,
    page,
    pageSize,
    selectedGenerationId,
    handleFilterChange,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    setAbilitySearch,
    setMoveSearch,
    setSelectedGenerationId
  } = usePokemonSearch({ endpoint: BASE_ENDPOINTS.SEASON_POKEMON_BASE, extraParams: {full: true} });

  // Fetch season data
  const { data: season } = useFetch<SeasonInput>(
    buildUrlWithQuery(BASE_ENDPOINTS.SEASON_BASE, [seasonId], { full: true }),
  );

  useEffect(() => {                                                                      
    if (season?.generationId) {                                                          
      setSelectedGenerationId(season.generationId);                                      
    }             
  }, [season?.generationId]); 

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{season?.name} Pokemon</h1>
        <div className="flex items-center gap-2">
          <Label htmlFor="generation-select" className="text-sm text-muted-foreground">
            Generation:
          </Label>
          <Select
            id="generation-select"
            value={selectedGenerationId}
            disabled={true}
            className="h-9 w-auto px-2 py-1"
            aria-label="Select generation">
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
        variant={'seasonPokemon'}
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
        variant={'seasonPokemon'}
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
