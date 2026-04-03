'use client';

import { Input, Label } from '@/components';
import type { PokemonFilters } from '@/components/pokemon/PokemonFilterPanel';

interface StatRangeFilterProps {
  label: string;
  minKey: keyof PokemonFilters;
  maxKey: keyof PokemonFilters;
  filters: PokemonFilters;
  onFilterChange: (filters: Partial<PokemonFilters>) => void;
}

export function StatRangeFilter({
  label,
  minKey,
  maxKey,
  filters,
  onFilterChange,
}: StatRangeFilterProps) {
  return (
    <div className="w-40 space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={filters[minKey] as string}
          onChange={(e) => onFilterChange({ [minKey]: e.target.value })}
          className="text-sm"
        />
        <Input
          type="number"
          placeholder="Max"
          value={filters[maxKey] as string}
          onChange={(e) => onFilterChange({ [maxKey]: e.target.value })}
          className="text-sm"
        />
      </div>
    </div>
  );
}
