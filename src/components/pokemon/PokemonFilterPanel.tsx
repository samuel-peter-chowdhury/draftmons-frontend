'use client';

import React from 'react';
import { Card, CardContent, Input, Label } from '@/components';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FilterDropdown } from '@/components/pokemon/FilterDropdown';
import { formatGenerationName } from '@/lib/utils';
import type {
  AbilityInput,
  GenerationInput,
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
  selectedAbilities: AbilityInput[];
  selectedTypes: PokemonTypeInput[];
  selectedWeakTypes: PokemonTypeInput[];
  selectedNotWeakTypes: PokemonTypeInput[];
  selectedResistedTypes: PokemonTypeInput[];
  selectedImmuneTypes: PokemonTypeInput[];
  selectedMoves: MoveInput[];
  selectedGenerations: GenerationInput[];
  selectedSpecialMoveCategories: SpecialMoveCategoryInput[];
}

export interface PokemonFilterPanelProps {
  filters: PokemonFilters;
  onFilterChange: (filters: Partial<PokemonFilters>) => void;
  abilities: AbilityInput[];
  types: PokemonTypeInput[];
  moves: MoveInput[];
  generations: GenerationInput[];
  specialMoveCategories: SpecialMoveCategoryInput[];
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

const getGenerationKey = (g: GenerationInput) => g.id;
const getGenerationLabel = (g: GenerationInput) => formatGenerationName(g.name);

export function PokemonFilterPanel({
  filters,
  onFilterChange,
  abilities,
  types,
  moves,
  generations,
  specialMoveCategories,
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
            <AccordionContent className="px-6 pb-4">
              <div className="flex flex-wrap gap-4">
                {/* HP */}
                <div className="w-40 space-y-2">
                  <Label className="text-sm font-medium">HP</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minHp}
                      onChange={(e) => onFilterChange({ minHp: e.target.value })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxHp}
                      onChange={(e) => onFilterChange({ maxHp: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Attack */}
                <div className="w-40 space-y-2">
                  <Label className="text-sm font-medium">Attack</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minAttack}
                      onChange={(e) => onFilterChange({ minAttack: e.target.value })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxAttack}
                      onChange={(e) => onFilterChange({ maxAttack: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Defense */}
                <div className="w-40 space-y-2">
                  <Label className="text-sm font-medium">Defense</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minDefense}
                      onChange={(e) => onFilterChange({ minDefense: e.target.value })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxDefense}
                      onChange={(e) => onFilterChange({ maxDefense: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Special Attack */}
                <div className="w-40 space-y-2">
                  <Label className="text-sm font-medium">Special Attack</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minSpecialAttack}
                      onChange={(e) => onFilterChange({ minSpecialAttack: e.target.value })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxSpecialAttack}
                      onChange={(e) => onFilterChange({ maxSpecialAttack: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Special Defense */}
                <div className="w-40 space-y-2">
                  <Label className="text-sm font-medium">Special Defense</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minSpecialDefense}
                      onChange={(e) => onFilterChange({ minSpecialDefense: e.target.value })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxSpecialDefense}
                      onChange={(e) => onFilterChange({ maxSpecialDefense: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Speed */}
                <div className="w-40 space-y-2">
                  <Label className="text-sm font-medium">Speed</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minSpeed}
                      onChange={(e) => onFilterChange({ minSpeed: e.target.value })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxSpeed}
                      onChange={(e) => onFilterChange({ maxSpeed: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Base Stat Total */}
                <div className="w-40 space-y-2">
                  <Label className="text-sm font-medium">Base Stat Total</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minBaseStatTotal}
                      onChange={(e) => onFilterChange({ minBaseStatTotal: e.target.value })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxBaseStatTotal}
                      onChange={(e) => onFilterChange({ maxBaseStatTotal: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Physical Bulk */}
                <div className="w-40 space-y-2">
                  <Label className="text-sm font-medium">Physical Bulk</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPhysicalBulk}
                      onChange={(e) => onFilterChange({ minPhysicalBulk: e.target.value })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPhysicalBulk}
                      onChange={(e) => onFilterChange({ maxPhysicalBulk: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Special Bulk */}
                <div className="w-40 space-y-2">
                  <Label className="text-sm font-medium">Special Bulk</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minSpecialBulk}
                      onChange={(e) => onFilterChange({ minSpecialBulk: e.target.value })}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxSpecialBulk}
                      onChange={(e) => onFilterChange({ maxSpecialBulk: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

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
                  items={abilities}
                  selectedItems={filters.selectedAbilities}
                  onAdd={handleAddTo<AbilityInput>('selectedAbilities')}
                  onRemove={handleRemoveFrom<AbilityInput>('selectedAbilities')}
                  getKey={getAbilityKey}
                  getLabel={getAbilityName}
                  maxResults={10}
                />

                {/* Moves Filter */}
                <FilterDropdown
                  label="Moves"
                  items={moves}
                  selectedItems={filters.selectedMoves}
                  onAdd={handleAddTo<MoveInput>('selectedMoves')}
                  onRemove={handleRemoveFrom<MoveInput>('selectedMoves')}
                  getKey={getMoveKey}
                  getLabel={getMoveName}
                  maxResults={10}
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

                {/* Generations Filter */}
                <FilterDropdown
                  label="Generations"
                  items={generations}
                  selectedItems={filters.selectedGenerations}
                  onAdd={handleAddTo<GenerationInput>('selectedGenerations')}
                  onRemove={handleRemoveFrom<GenerationInput>('selectedGenerations')}
                  getKey={getGenerationKey}
                  getLabel={getGenerationLabel}
                  capitalize={false}
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
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
