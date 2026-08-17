'use client';

import React from 'react';
import { Card, CardContent, Checkbox, Input, Label, PokemonVariant } from '@/components';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
// import { NewCard } from '../util/NewCard';
import { SectionAccordionTrigger } from '../util/SectionAccordionTrigger';
import { FilterDropdown } from '@/components/pokemon/FilterDropdown';
import { StatRangeFilter } from '@/components/pokemon/StatRangeFilter';
import type {
  AbilityInput,
  MoveInput,
  PokemonTypeInput,
  SpecialMoveCategoryInput,
} from '@/types';

import { Atom, Swords, ChartColumn } from 'lucide-react';


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
    <Card className="relative z-20 mb-6">
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="filters" className="border-b-0">
            <AccordionTrigger>
              <div className="flex gap-5 px-6 pt-5 w-full items-center">
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

            <SectionAccordionTrigger className="px-6 text-base font-semibold text-foreground">
              Advanced Filters
            </SectionAccordionTrigger>


            <AccordionContent className="px-6 pb-4 overflow-hidden data-[state=open]:overflow-visible">
              {/* <div className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="h-5 w-3 rounded bg-primary" />
                Advanced Filters
              </div> */}
              <div className="space-y-1">
                {/* Stats filters */}
                <section className="space-y-2">
                  <Accordion type="multiple" defaultValue={['stats']} className="w-full">
                    {/* Attribute and Moves Filters */}
                    <AccordionItem value="stats">
                      <SectionAccordionTrigger logo={<ChartColumn />}>
                        Stats
                      </SectionAccordionTrigger>
                      <AccordionContent className="overflow-hidden data-[state=open]:overflow-visible">
                        <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-9">
                          {/* HP */}
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">HP</Label>
                            <div className="grid grid-cols-2 gap-2">
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
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Attack</Label>
                            <div className="grid grid-cols-2 gap-2">
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
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Defense</Label>
                            <div className="grid grid-cols-2 gap-2">
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
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Special Attack</Label>
                            <div className="grid grid-cols-2 gap-2">
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
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Special Defense</Label>
                            <div className="grid grid-cols-2 gap-2">
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
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Speed</Label>
                            <div className="grid grid-cols-2 gap-2">
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
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Base Stat Total</Label>
                            <div className="grid grid-cols-2 gap-2">
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
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Physical Bulk</Label>
                            <div className="grid grid-cols-2 gap-2">
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
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Special Bulk</Label>
                            <div className="grid grid-cols-2 gap-2">
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
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
        
                </section>

                {/* Match filters */}
                <section className="space-y-2 mt-0">
                  <Accordion type="multiple" defaultValue={['attribute-and-moves', 'typing-interactions']} className="w-full">
                    {/* Attribute and Moves Filters */}
                    <AccordionItem value="attribute-and-moves">
                      <SectionAccordionTrigger logo={<Atom/>}>
                        Attributes & Moves
                      </SectionAccordionTrigger>
                      <AccordionContent className="overflow-hidden data-[state=open]:overflow-visible">
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-1">
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

                          <FilterDropdown
                            label="Special Move Categories"
                            items={specialMoveCategories}
                            selectedItems={filters.selectedSpecialMoveCategories}
                            onAdd={handleAddTo<SpecialMoveCategoryInput>('selectedSpecialMoveCategories')}
                            onRemove={handleRemoveFrom<SpecialMoveCategoryInput>('selectedSpecialMoveCategories')}
                            getKey={getSmcKey}
                            getLabel={getSmcName}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Typing Interaction Filters */}
                    <AccordionItem value="typing-interactions">
                      <SectionAccordionTrigger logo={<Swords/>}>
                        Typing Interactions
                      </SectionAccordionTrigger>
                      <AccordionContent className="overflow-hidden data-[state=open]:overflow-visible">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              </section>

                {/* Exclude Drafted Pokemon */}
                {variant === 'seasonPokemon' && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="excludeDrafted" className="text-sm font-medium">
                      Exclude Drafted Pokemon
                    </Label>
                    <Checkbox
                      checked={filters.excludeDrafted}
                      id="excludeDrafted"
                      onCheckedChange={(checked: any) =>
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
