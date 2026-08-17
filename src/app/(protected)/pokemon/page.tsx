'use client';

import { usePokemonSearch } from '@/hooks';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatGenerationName } from '@/lib/utils';
import { Label } from '@/components';
import { Select } from '@/components/ui/select';
import { PokemonFilterPanel } from '@/components/pokemon/PokemonFilterPanel';
import { PokemonTable } from '@/components/pokemon/PokemonTable';

export default function PokemonPage() {
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
    handleGenerationChange,
    handleFilterChange,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    setAbilitySearch,
    setMoveSearch
  } = usePokemonSearch({ endpoint: BASE_ENDPOINTS.POKEMON_BASE });

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
        variant={'pokemon'}
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
        variant={'pokemon'}
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
