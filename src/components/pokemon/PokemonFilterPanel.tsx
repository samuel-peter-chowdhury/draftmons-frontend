'use client';

import React from 'react';
import { Card, CardContent, Checkbox, Input, Label, PokemonVariant } from '@/components';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FilterDropdown } from '@/components/pokemon/FilterDropdown';
import { StatRangeFilter } from '@/components/pokemon/StatRangeFilter';
import type {
  AbilityInput,
  MoveInput,
  PokemonTypeInput,
  SpecialMoveCategoryInput,
} from '@/types';

export interface PokemonFilters {
  nameLike: string;
  minHp: string;
  maxHp: string;
  minAttack: string;
  maxAttack: string;
  minDefense: string;
  maxDefense: string;
  minSpecialAttack: string;
  maxSpecialAttack: string;
  minSpecialDefense: string;
  maxSpecialDefense: string;
  minSpeed: string;
  maxSpeed: string;
  minBaseStatTotal: string;
  maxBaseStatTotal: string;
  minPhysicalBulk: string;
  maxPhysicalBulk: string;
  minSpecialBulk: string;
  maxSpecialBulk: string;
  minPointValue: string;
  maxPointValue: string;
  excludeDrafted: boolean;
  selectedAbilities: AbilityInput[];
  selectedTypes: PokemonTypeInput[];
  selectedWeakTypes: PokemonTypeInput[];
  selectedNotWeakTypes: PokemonTypeInput[];
  selectedResistedTypes: PokemonTypeInput[];
  selectedImmuneTypes: PokemonTypeInput[];
  selectedMoves: MoveInput[];
  selectedSpecialMoveCategories: SpecialMoveCategoryInput[];
}

export interface PokemonFilterPanelProps {
  filters: PokemonFilters;
  variant: PokemonVariant;
  onFilterChange: (filters: Partial<PokemonFilters>) => void;
  types: PokemonTypeInput[];
  specialMoveCategories: SpecialMoveCategoryInput[];
  abilitySearchResults: AbilityInput[];
  moveSearchResults: MoveInput[];
  onAbilitySearchChange: (search: string) => void;
  onMoveSearchChange: (search: string) => void;
  abilitySearchLoading?: boolean;
  moveSearchLoading?: boolean;
}

const getTypeKey = (t: PokemonTypeInput) => t.id;
const getTypeName = (t: PokemonTypeInput) => t.name;
const getTypeBadgeStyle = (t: PokemonTypeInput): React.CSSProperties => ({
  backgroundColor: t.color,
  color: '#fff',
  border: 'none',
});

const getAbilityKey = (a: AbilityInput) => a.id;
const getAbilityName = (a: AbilityInput) => a.name;

const getMoveKey = (m: MoveInput) => m.id;
const getMoveName = (m: MoveInput) => m.name;

const getSmcKey = (smc: SpecialMoveCategoryInput) => smc.id;
const getSmcName = (smc: SpecialMoveCategoryInput) => smc.name;

const STAT_RANGE_FILTERS: { label: string; minKey: keyof PokemonFilters; maxKey: keyof PokemonFilters }[] = [
  { label: 'HP', minKey: 'minHp', maxKey: 'maxHp' },
  { label: 'Attack', minKey: 'minAttack', maxKey: 'maxAttack' },
  { label: 'Defense', minKey: 'minDefense', maxKey: 'maxDefense' },
  { label: 'Special Attack', minKey: 'minSpecialAttack', maxKey: 'maxSpecialAttack' },
  { label: 'Special Defense', minKey: 'minSpecialDefense', maxKey: 'maxSpecialDefense' },
  { label: 'Speed', minKey: 'minSpeed', maxKey: 'maxSpeed' },
  { label: 'Base Stat Total', minKey: 'minBaseStatTotal', maxKey: 'maxBaseStatTotal' },
  { label: 'Physical Bulk', minKey: 'minPhysicalBulk', maxKey: 'maxPhysicalBulk' },
  { label: 'Special Bulk', minKey: 'minSpecialBulk', maxKey: 'maxSpecialBulk' },
];

export function PokemonFilterPanel({
  filters,
  variant,
  onFilterChange,
  types,
  specialMoveCategories,
  abilitySearchResults,
  moveSearchResults,
  onAbilitySearchChange,
  onMoveSearchChange,
  abilitySearchLoading,
  moveSearchLoading,
}: PokemonFilterPanelProps) {
  const handleAddTo =
    <T,>(key: keyof PokemonFilters) =>
    (item: T) => {
      onFilterChange({ [key]: [...(filters[key] as unknown as T[]), item] });
    };

  const handleRemoveFrom =
    <T extends { id: number }>(key: keyof PokemonFilters) =>
    (item: T) => {
      onFilterChange({
        [key]: (filters[key] as unknown as T[]).filter((i) => i.id !== item.id),
      });
    };

  return (
    <Card className="mb-6">
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="filters" className="border-b-0">
            <AccordionTrigger className="flex gap-5 px-6 py-4 hover:no-underline">
              <div className="flex w-full items-center">
                <div
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                >
                  <Input
                    id="nameLike"
                    placeholder="Search by name..."
                    value={filters.nameLike}
                    onChange={(e) => onFilterChange({ nameLike: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="overflow-visible px-6 pb-4">
              <div className="flex flex-wrap gap-4">
                {STAT_RANGE_FILTERS.map(({ label, minKey, maxKey }) => (
                  <StatRangeFilter
                    key={minKey}
                    label={label}
                    minKey={minKey}
                    maxKey={maxKey}
                    filters={filters}
                    onFilterChange={onFilterChange}
                  />
                ))}

                {variant === 'seasonPokemon' && (
                  <StatRangeFilter
                    label="Point Value"
                    minKey="minPointValue"
                    maxKey="maxPointValue"
                    filters={filters}
                    onFilterChange={onFilterChange}
                  />
                )}

                {/* Types Filter */}
                <FilterDropdown
                  label="Types"
                  items={types}
                  selectedItems={filters.selectedTypes}
                  onAdd={handleAddTo<PokemonTypeInput>('selectedTypes')}
                  onRemove={handleRemoveFrom<PokemonTypeInput>('selectedTypes')}
                  getKey={getTypeKey}
                  getLabel={getTypeName}
                  getBadgeStyle={getTypeBadgeStyle}
                />

                {/* Abilities Filter */}
                <FilterDropdown
                  label="Abilities"
                  items={abilitySearchResults}
                  selectedItems={filters.selectedAbilities}
                  onAdd={handleAddTo<AbilityInput>('selectedAbilities')}
                  onRemove={handleRemoveFrom<AbilityInput>('selectedAbilities')}
                  getKey={getAbilityKey}
                  getLabel={getAbilityName}
                  maxResults={10}
                  isAsync
                  onSearchChange={onAbilitySearchChange}
                  loading={abilitySearchLoading}
                />

                {/* Moves Filter */}
                <FilterDropdown
                  label="Moves"
                  items={moveSearchResults}
                  selectedItems={filters.selectedMoves}
                  onAdd={handleAddTo<MoveInput>('selectedMoves')}
                  onRemove={handleRemoveFrom<MoveInput>('selectedMoves')}
                  getKey={getMoveKey}
                  getLabel={getMoveName}
                  maxResults={10}
                  isAsync
                  onSearchChange={onMoveSearchChange}
                  loading={moveSearchLoading}
                />

                {/* Special Move Categories Filter */}
                <FilterDropdown
                  label="Special Move Categories"
                  items={specialMoveCategories}
                  selectedItems={filters.selectedSpecialMoveCategories}
                  onAdd={handleAddTo<SpecialMoveCategoryInput>('selectedSpecialMoveCategories')}
                  onRemove={
                    handleRemoveFrom<SpecialMoveCategoryInput>('selectedSpecialMoveCategories')
                  }
                  getKey={getSmcKey}
                  getLabel={getSmcName}
                />

                {/* Weak Types Filter */}
                <FilterDropdown
                  label="Weak Types"
                  items={types}
                  selectedItems={filters.selectedWeakTypes}
                  onAdd={handleAddTo<PokemonTypeInput>('selectedWeakTypes')}
                  onRemove={handleRemoveFrom<PokemonTypeInput>('selectedWeakTypes')}
                  getKey={getTypeKey}
                  getLabel={getTypeName}
                  getBadgeStyle={getTypeBadgeStyle}
                />

                {/* Not Weak Types Filter */}
                <FilterDropdown
                  label="Not Weak Types"
                  items={types}
                  selectedItems={filters.selectedNotWeakTypes}
                  onAdd={handleAddTo<PokemonTypeInput>('selectedNotWeakTypes')}
                  onRemove={handleRemoveFrom<PokemonTypeInput>('selectedNotWeakTypes')}
                  getKey={getTypeKey}
                  getLabel={getTypeName}
                  getBadgeStyle={getTypeBadgeStyle}
                />

                {/* Resisted Types Filter */}
                <FilterDropdown
                  label="Resisted Types"
                  items={types}
                  selectedItems={filters.selectedResistedTypes}
                  onAdd={handleAddTo<PokemonTypeInput>('selectedResistedTypes')}
                  onRemove={handleRemoveFrom<PokemonTypeInput>('selectedResistedTypes')}
                  getKey={getTypeKey}
                  getLabel={getTypeName}
                  getBadgeStyle={getTypeBadgeStyle}
                />

                {/* Immune Types Filter */}
                <FilterDropdown
                  label="Immune Types"
                  items={types}
                  selectedItems={filters.selectedImmuneTypes}
                  onAdd={handleAddTo<PokemonTypeInput>('selectedImmuneTypes')}
                  onRemove={handleRemoveFrom<PokemonTypeInput>('selectedImmuneTypes')}
                  getKey={getTypeKey}
                  getLabel={getTypeName}
                  getBadgeStyle={getTypeBadgeStyle}
                />

                {/* Exclude Drafted Pokemon */}
                {variant === 'seasonPokemon' && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="excludeDrafted" className="text-sm font-medium">
                      Exclude Drafted Pokemon
                    </Label>
                    <Checkbox
                      checked={filters.excludeDrafted}
                      id="excludeDrafted"
                      onCheckedChange={(checked) =>
                        onFilterChange({ excludeDrafted: checked === true })
                      }
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
