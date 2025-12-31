'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, Input, Label } from '@/components';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
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

interface DropdownState {
  abilitySearch: string;
  typeSearch: string;
  weakTypeSearch: string;
  notWeakTypeSearch: string;
  resistedTypeSearch: string;
  immuneTypeSearch: string;
  moveSearch: string;
  generationSearch: string;
  specialMoveCategorySearch: string;
  abilityFocused: boolean;
  typeFocused: boolean;
  weakTypeFocused: boolean;
  notWeakTypeFocused: boolean;
  resistedTypeFocused: boolean;
  immuneTypeFocused: boolean;
  moveFocused: boolean;
  generationFocused: boolean;
  specialMoveCategoryFocused: boolean;
}

export function PokemonFilterPanel({
  filters,
  onFilterChange,
  abilities,
  types,
  moves,
  generations,
  specialMoveCategories,
}: PokemonFilterPanelProps) {
  const [dropdownState, setDropdownState] = React.useState<DropdownState>({
    abilitySearch: '',
    typeSearch: '',
    weakTypeSearch: '',
    notWeakTypeSearch: '',
    resistedTypeSearch: '',
    immuneTypeSearch: '',
    moveSearch: '',
    generationSearch: '',
    specialMoveCategorySearch: '',
    abilityFocused: false,
    typeFocused: false,
    weakTypeFocused: false,
    notWeakTypeFocused: false,
    resistedTypeFocused: false,
    immuneTypeFocused: false,
    moveFocused: false,
    generationFocused: false,
    specialMoveCategoryFocused: false,
  });

  const handleAddAbility = (abilityId: number) => {
    const ability = abilities.find((a) => a.id === abilityId);
    if (ability && !filters.selectedAbilities.find((a) => a.id === abilityId)) {
      onFilterChange({ selectedAbilities: [...filters.selectedAbilities, ability] });
      setDropdownState((prev) => ({ ...prev, abilitySearch: '', abilityFocused: false }));
    }
  };

  const handleRemoveAbility = (abilityId: number) => {
    onFilterChange({
      selectedAbilities: filters.selectedAbilities.filter((a) => a.id !== abilityId),
    });
  };

  const handleAddType = (typeId: number) => {
    const type = types.find((t) => t.id === typeId);
    if (type && !filters.selectedTypes.find((t) => t.id === typeId)) {
      onFilterChange({ selectedTypes: [...filters.selectedTypes, type] });
      setDropdownState((prev) => ({ ...prev, typeSearch: '', typeFocused: false }));
    }
  };

  const handleRemoveType = (typeId: number) => {
    onFilterChange({ selectedTypes: filters.selectedTypes.filter((t) => t.id !== typeId) });
  };

  const handleAddWeakType = (typeId: number) => {
    const type = types.find((t) => t.id === typeId);
    if (type && !filters.selectedWeakTypes.find((t) => t.id === typeId)) {
      onFilterChange({ selectedWeakTypes: [...filters.selectedWeakTypes, type] });
      setDropdownState((prev) => ({ ...prev, weakTypeSearch: '', weakTypeFocused: false }));
    }
  };

  const handleRemoveWeakType = (typeId: number) => {
    onFilterChange({
      selectedWeakTypes: filters.selectedWeakTypes.filter((t) => t.id !== typeId),
    });
  };

  const handleAddNotWeakType = (typeId: number) => {
    const type = types.find((t) => t.id === typeId);
    if (type && !filters.selectedNotWeakTypes.find((t) => t.id === typeId)) {
      onFilterChange({ selectedNotWeakTypes: [...filters.selectedNotWeakTypes, type] });
      setDropdownState((prev) => ({ ...prev, notWeakTypeSearch: '', notWeakTypeFocused: false }));
    }
  };

  const handleRemoveNotWeakType = (typeId: number) => {
    onFilterChange({
      selectedNotWeakTypes: filters.selectedNotWeakTypes.filter((t) => t.id !== typeId),
    });
  };

  const handleAddResistedType = (typeId: number) => {
    const type = types.find((t) => t.id === typeId);
    if (type && !filters.selectedResistedTypes.find((t) => t.id === typeId)) {
      onFilterChange({ selectedResistedTypes: [...filters.selectedResistedTypes, type] });
      setDropdownState((prev) => ({
        ...prev,
        resistedTypeSearch: '',
        resistedTypeFocused: false,
      }));
    }
  };

  const handleRemoveResistedType = (typeId: number) => {
    onFilterChange({
      selectedResistedTypes: filters.selectedResistedTypes.filter((t) => t.id !== typeId),
    });
  };

  const handleAddImmuneType = (typeId: number) => {
    const type = types.find((t) => t.id === typeId);
    if (type && !filters.selectedImmuneTypes.find((t) => t.id === typeId)) {
      onFilterChange({ selectedImmuneTypes: [...filters.selectedImmuneTypes, type] });
      setDropdownState((prev) => ({ ...prev, immuneTypeSearch: '', immuneTypeFocused: false }));
    }
  };

  const handleRemoveImmuneType = (typeId: number) => {
    onFilterChange({
      selectedImmuneTypes: filters.selectedImmuneTypes.filter((t) => t.id !== typeId),
    });
  };

  const handleAddMove = (moveId: number) => {
    const move = moves.find((m) => m.id === moveId);
    if (move && !filters.selectedMoves.find((m) => m.id === moveId)) {
      onFilterChange({ selectedMoves: [...filters.selectedMoves, move] });
      setDropdownState((prev) => ({ ...prev, moveSearch: '', moveFocused: false }));
    }
  };

  const handleRemoveMove = (moveId: number) => {
    onFilterChange({ selectedMoves: filters.selectedMoves.filter((m) => m.id !== moveId) });
  };

  const handleAddGeneration = (generationId: number) => {
    const generation = generations.find((g) => g.id === generationId);
    if (generation && !filters.selectedGenerations.find((g) => g.id === generationId)) {
      onFilterChange({ selectedGenerations: [...filters.selectedGenerations, generation] });
      setDropdownState((prev) => ({
        ...prev,
        generationSearch: '',
        generationFocused: false,
      }));
    }
  };

  const handleRemoveGeneration = (generationId: number) => {
    onFilterChange({
      selectedGenerations: filters.selectedGenerations.filter((g) => g.id !== generationId),
    });
  };

  const handleAddSpecialMoveCategory = (specialMoveCategoryId: number) => {
    const specialMoveCategory = specialMoveCategories.find(
      (smc) => smc.id === specialMoveCategoryId,
    );
    if (
      specialMoveCategory &&
      !filters.selectedSpecialMoveCategories.find((smc) => smc.id === specialMoveCategoryId)
    ) {
      onFilterChange({
        selectedSpecialMoveCategories: [
          ...filters.selectedSpecialMoveCategories,
          specialMoveCategory,
        ],
      });
      setDropdownState((prev) => ({
        ...prev,
        specialMoveCategorySearch: '',
        specialMoveCategoryFocused: false,
      }));
    }
  };

  const handleRemoveSpecialMoveCategory = (specialMoveCategoryId: number) => {
    onFilterChange({
      selectedSpecialMoveCategories: filters.selectedSpecialMoveCategories.filter(
        (smc) => smc.id !== specialMoveCategoryId,
      ),
    });
  };

  const filteredAbilities = abilities.filter(
    (a) =>
      !filters.selectedAbilities.find((sa) => sa.id === a.id) &&
      a.name.toLowerCase().includes(dropdownState.abilitySearch.toLowerCase()),
  );

  const filteredTypes = types.filter(
    (t) =>
      !filters.selectedTypes.find((st) => st.id === t.id) &&
      t.name.toLowerCase().includes(dropdownState.typeSearch.toLowerCase()),
  );

  const filteredWeakTypes = types.filter(
    (t) =>
      !filters.selectedWeakTypes.find((st) => st.id === t.id) &&
      t.name.toLowerCase().includes(dropdownState.weakTypeSearch.toLowerCase()),
  );

  const filteredNotWeakTypes = types.filter(
    (t) =>
      !filters.selectedNotWeakTypes.find((st) => st.id === t.id) &&
      t.name.toLowerCase().includes(dropdownState.notWeakTypeSearch.toLowerCase()),
  );

  const filteredResistedTypes = types.filter(
    (t) =>
      !filters.selectedResistedTypes.find((st) => st.id === t.id) &&
      t.name.toLowerCase().includes(dropdownState.resistedTypeSearch.toLowerCase()),
  );

  const filteredImmuneTypes = types.filter(
    (t) =>
      !filters.selectedImmuneTypes.find((st) => st.id === t.id) &&
      t.name.toLowerCase().includes(dropdownState.immuneTypeSearch.toLowerCase()),
  );

  const filteredMoves = moves.filter(
    (m) =>
      !filters.selectedMoves.find((sm) => sm.id === m.id) &&
      m.name.toLowerCase().includes(dropdownState.moveSearch.toLowerCase()),
  );

  const filteredGenerations = generations.filter(
    (g) =>
      !filters.selectedGenerations.find((sg) => sg.id === g.id) &&
      g.name.toLowerCase().includes(dropdownState.generationSearch.toLowerCase()),
  );

  const filteredSpecialMoveCategories = specialMoveCategories.filter(
    (smc) =>
      !filters.selectedSpecialMoveCategories.find((ssmc) => ssmc.id === smc.id) &&
      smc.name.toLowerCase().includes(dropdownState.specialMoveCategorySearch.toLowerCase()),
  );

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
                <div className="w-64 space-y-2">
                  <Label htmlFor="types">Types</Label>
                  <div className="relative">
                    <Input
                      id="types"
                      placeholder="Search types..."
                      value={dropdownState.typeSearch}
                      onChange={(e) =>
                        setDropdownState((prev) => ({ ...prev, typeSearch: e.target.value }))
                      }
                      onFocus={() => setDropdownState((prev) => ({ ...prev, typeFocused: true }))}
                      onClick={() => setDropdownState((prev) => ({ ...prev, typeFocused: true }))}
                      onBlur={() => setDropdownState((prev) => ({ ...prev, typeFocused: false }))}
                    />
                    {dropdownState.typeFocused && filteredTypes.length > 0 && (
                      <div className="fixed z-50 mt-1 max-h-60 w-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
                        {filteredTypes.map((type) => (
                          <button
                            key={type.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddType(type.id);
                            }}
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm capitalize hover:bg-accent hover:text-accent-foreground"
                          >
                            {type.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {filters.selectedTypes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.selectedTypes.map((type) => (
                        <Badge
                          key={type.id}
                          className="gap-1 capitalize"
                          style={{
                            backgroundColor: type.color,
                            color: '#fff',
                            border: 'none',
                          }}
                        >
                          {type.name}
                          <button
                            onClick={() => handleRemoveType(type.id)}
                            className="ml-1 rounded-full hover:bg-black/20"
                            aria-label={`Remove ${type.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Abilities Filter */}
                <div className="w-64 space-y-2">
                  <Label htmlFor="abilities">Abilities</Label>
                  <div className="relative">
                    <Input
                      id="abilities"
                      placeholder="Search abilities..."
                      value={dropdownState.abilitySearch}
                      onChange={(e) =>
                        setDropdownState((prev) => ({ ...prev, abilitySearch: e.target.value }))
                      }
                      onFocus={() =>
                        setDropdownState((prev) => ({ ...prev, abilityFocused: true }))
                      }
                      onClick={() =>
                        setDropdownState((prev) => ({ ...prev, abilityFocused: true }))
                      }
                      onBlur={() =>
                        setDropdownState((prev) => ({ ...prev, abilityFocused: false }))
                      }
                    />
                    {dropdownState.abilityFocused && filteredAbilities.length > 0 && (
                      <div className="fixed z-50 mt-1 max-h-60 w-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
                        {filteredAbilities.slice(0, 10).map((ability) => (
                          <button
                            key={ability.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddAbility(ability.id);
                            }}
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm capitalize hover:bg-accent hover:text-accent-foreground"
                          >
                            {ability.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {filters.selectedAbilities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.selectedAbilities.map((ability) => (
                        <Badge key={ability.id} variant="secondary" className="gap-1 capitalize">
                          {ability.name}
                          <button
                            onClick={() => handleRemoveAbility(ability.id)}
                            className="ml-1 rounded-full hover:bg-background/20"
                            aria-label={`Remove ${ability.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Moves Filter */}
                <div className="w-64 space-y-2">
                  <Label htmlFor="moves">Moves</Label>
                  <div className="relative">
                    <Input
                      id="moves"
                      placeholder="Search moves..."
                      value={dropdownState.moveSearch}
                      onChange={(e) =>
                        setDropdownState((prev) => ({ ...prev, moveSearch: e.target.value }))
                      }
                      onFocus={() => setDropdownState((prev) => ({ ...prev, moveFocused: true }))}
                      onClick={() => setDropdownState((prev) => ({ ...prev, moveFocused: true }))}
                      onBlur={() => setDropdownState((prev) => ({ ...prev, moveFocused: false }))}
                    />
                    {dropdownState.moveFocused && filteredMoves.length > 0 && (
                      <div className="fixed z-50 mt-1 max-h-60 w-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
                        {filteredMoves.slice(0, 10).map((move) => (
                          <button
                            key={move.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddMove(move.id);
                            }}
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm capitalize hover:bg-accent hover:text-accent-foreground"
                          >
                            {move.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {filters.selectedMoves.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.selectedMoves.map((move) => (
                        <Badge key={move.id} variant="secondary" className="gap-1 capitalize">
                          {move.name}
                          <button
                            onClick={() => handleRemoveMove(move.id)}
                            className="ml-1 rounded-full hover:bg-background/20"
                            aria-label={`Remove ${move.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Special Move Categories Filter */}
                <div className="w-64 space-y-2">
                  <Label htmlFor="specialMoveCategories">Special Move Categories</Label>
                  <div className="relative">
                    <Input
                      id="specialMoveCategories"
                      placeholder="Search special move categories..."
                      value={dropdownState.specialMoveCategorySearch}
                      onChange={(e) =>
                        setDropdownState((prev) => ({
                          ...prev,
                          specialMoveCategorySearch: e.target.value,
                        }))
                      }
                      onFocus={() =>
                        setDropdownState((prev) => ({ ...prev, specialMoveCategoryFocused: true }))
                      }
                      onClick={() =>
                        setDropdownState((prev) => ({ ...prev, specialMoveCategoryFocused: true }))
                      }
                      onBlur={() =>
                        setDropdownState((prev) => ({ ...prev, specialMoveCategoryFocused: false }))
                      }
                    />
                    {dropdownState.specialMoveCategoryFocused &&
                      filteredSpecialMoveCategories.length > 0 && (
                        <div className="fixed z-50 mt-1 max-h-60 w-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
                          {filteredSpecialMoveCategories.map((specialMoveCategory) => (
                            <button
                              key={specialMoveCategory.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAddSpecialMoveCategory(specialMoveCategory.id);
                              }}
                              className="w-full rounded-sm px-2 py-1.5 text-left text-sm capitalize hover:bg-accent hover:text-accent-foreground"
                            >
                              {specialMoveCategory.name}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                  {filters.selectedSpecialMoveCategories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.selectedSpecialMoveCategories.map((specialMoveCategory) => (
                        <Badge
                          key={specialMoveCategory.id}
                          variant="secondary"
                          className="gap-1 capitalize"
                        >
                          {specialMoveCategory.name}
                          <button
                            onClick={() => handleRemoveSpecialMoveCategory(specialMoveCategory.id)}
                            className="ml-1 rounded-full hover:bg-background/20"
                            aria-label={`Remove ${specialMoveCategory.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generations Filter */}
                <div className="w-64 space-y-2">
                  <Label htmlFor="generations">Generations</Label>
                  <div className="relative">
                    <Input
                      id="generations"
                      placeholder="Search generations..."
                      value={dropdownState.generationSearch}
                      onChange={(e) =>
                        setDropdownState((prev) => ({ ...prev, generationSearch: e.target.value }))
                      }
                      onFocus={() =>
                        setDropdownState((prev) => ({ ...prev, generationFocused: true }))
                      }
                      onClick={() =>
                        setDropdownState((prev) => ({ ...prev, generationFocused: true }))
                      }
                      onBlur={() =>
                        setDropdownState((prev) => ({ ...prev, generationFocused: false }))
                      }
                    />
                    {dropdownState.generationFocused && filteredGenerations.length > 0 && (
                      <div className="fixed z-50 mt-1 max-h-60 w-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
                        {filteredGenerations.map((generation) => (
                          <button
                            key={generation.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddGeneration(generation.id);
                            }}
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                          >
                            {formatGenerationName(generation.name)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {filters.selectedGenerations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.selectedGenerations.map((generation) => (
                        <Badge key={generation.id} variant="secondary" className="gap-1">
                          {formatGenerationName(generation.name)}
                          <button
                            onClick={() => handleRemoveGeneration(generation.id)}
                            className="ml-1 rounded-full hover:bg-background/20"
                            aria-label={`Remove ${formatGenerationName(generation.name)}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weak Types Filter */}
                <div className="w-64 space-y-2">
                  <Label htmlFor="weakTypes">Weak Types</Label>
                  <div className="relative">
                    <Input
                      id="weakTypes"
                      placeholder="Search weak types..."
                      value={dropdownState.weakTypeSearch}
                      onChange={(e) =>
                        setDropdownState((prev) => ({ ...prev, weakTypeSearch: e.target.value }))
                      }
                      onFocus={() =>
                        setDropdownState((prev) => ({ ...prev, weakTypeFocused: true }))
                      }
                      onClick={() =>
                        setDropdownState((prev) => ({ ...prev, weakTypeFocused: true }))
                      }
                      onBlur={() =>
                        setDropdownState((prev) => ({ ...prev, weakTypeFocused: false }))
                      }
                    />
                    {dropdownState.weakTypeFocused && filteredWeakTypes.length > 0 && (
                      <div className="fixed z-50 mt-1 max-h-60 w-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
                        {filteredWeakTypes.map((type) => (
                          <button
                            key={type.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddWeakType(type.id);
                            }}
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm capitalize hover:bg-accent hover:text-accent-foreground"
                          >
                            {type.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {filters.selectedWeakTypes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.selectedWeakTypes.map((type) => (
                        <Badge
                          key={type.id}
                          className="gap-1 capitalize"
                          style={{
                            backgroundColor: type.color,
                            color: '#fff',
                            border: 'none',
                          }}
                        >
                          {type.name}
                          <button
                            onClick={() => handleRemoveWeakType(type.id)}
                            className="ml-1 rounded-full hover:bg-black/20"
                            aria-label={`Remove ${type.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Not Weak Types Filter */}
                <div className="w-64 space-y-2">
                  <Label htmlFor="notWeakTypes">Not Weak Types</Label>
                  <div className="relative">
                    <Input
                      id="notWeakTypes"
                      placeholder="Search not weak types..."
                      value={dropdownState.notWeakTypeSearch}
                      onChange={(e) =>
                        setDropdownState((prev) => ({ ...prev, notWeakTypeSearch: e.target.value }))
                      }
                      onFocus={() =>
                        setDropdownState((prev) => ({ ...prev, notWeakTypeFocused: true }))
                      }
                      onClick={() =>
                        setDropdownState((prev) => ({ ...prev, notWeakTypeFocused: true }))
                      }
                      onBlur={() =>
                        setDropdownState((prev) => ({ ...prev, notWeakTypeFocused: false }))
                      }
                    />
                    {dropdownState.notWeakTypeFocused && filteredNotWeakTypes.length > 0 && (
                      <div className="fixed z-50 mt-1 max-h-60 w-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
                        {filteredNotWeakTypes.map((type) => (
                          <button
                            key={type.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddNotWeakType(type.id);
                            }}
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm capitalize hover:bg-accent hover:text-accent-foreground"
                          >
                            {type.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {filters.selectedNotWeakTypes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.selectedNotWeakTypes.map((type) => (
                        <Badge
                          key={type.id}
                          className="gap-1 capitalize"
                          style={{
                            backgroundColor: type.color,
                            color: '#fff',
                            border: 'none',
                          }}
                        >
                          {type.name}
                          <button
                            onClick={() => handleRemoveNotWeakType(type.id)}
                            className="ml-1 rounded-full hover:bg-black/20"
                            aria-label={`Remove ${type.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resisted Types Filter */}
                <div className="w-64 space-y-2">
                  <Label htmlFor="resistedTypes">Resisted Types</Label>
                  <div className="relative">
                    <Input
                      id="resistedTypes"
                      placeholder="Search resisted types..."
                      value={dropdownState.resistedTypeSearch}
                      onChange={(e) =>
                        setDropdownState((prev) => ({
                          ...prev,
                          resistedTypeSearch: e.target.value,
                        }))
                      }
                      onFocus={() =>
                        setDropdownState((prev) => ({ ...prev, resistedTypeFocused: true }))
                      }
                      onClick={() =>
                        setDropdownState((prev) => ({ ...prev, resistedTypeFocused: true }))
                      }
                      onBlur={() =>
                        setDropdownState((prev) => ({ ...prev, resistedTypeFocused: false }))
                      }
                    />
                    {dropdownState.resistedTypeFocused && filteredResistedTypes.length > 0 && (
                      <div className="fixed z-50 mt-1 max-h-60 w-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
                        {filteredResistedTypes.map((type) => (
                          <button
                            key={type.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddResistedType(type.id);
                            }}
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm capitalize hover:bg-accent hover:text-accent-foreground"
                          >
                            {type.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {filters.selectedResistedTypes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.selectedResistedTypes.map((type) => (
                        <Badge
                          key={type.id}
                          className="gap-1 capitalize"
                          style={{
                            backgroundColor: type.color,
                            color: '#fff',
                            border: 'none',
                          }}
                        >
                          {type.name}
                          <button
                            onClick={() => handleRemoveResistedType(type.id)}
                            className="ml-1 rounded-full hover:bg-black/20"
                            aria-label={`Remove ${type.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Immune Types Filter */}
                <div className="w-64 space-y-2">
                  <Label htmlFor="immuneTypes">Immune Types</Label>
                  <div className="relative">
                    <Input
                      id="immuneTypes"
                      placeholder="Search immune types..."
                      value={dropdownState.immuneTypeSearch}
                      onChange={(e) =>
                        setDropdownState((prev) => ({ ...prev, immuneTypeSearch: e.target.value }))
                      }
                      onFocus={() =>
                        setDropdownState((prev) => ({ ...prev, immuneTypeFocused: true }))
                      }
                      onClick={() =>
                        setDropdownState((prev) => ({ ...prev, immuneTypeFocused: true }))
                      }
                      onBlur={() =>
                        setDropdownState((prev) => ({ ...prev, immuneTypeFocused: false }))
                      }
                    />
                    {dropdownState.immuneTypeFocused && filteredImmuneTypes.length > 0 && (
                      <div className="fixed z-50 mt-1 max-h-60 w-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
                        {filteredImmuneTypes.map((type) => (
                          <button
                            key={type.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddImmuneType(type.id);
                            }}
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm capitalize hover:bg-accent hover:text-accent-foreground"
                          >
                            {type.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {filters.selectedImmuneTypes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.selectedImmuneTypes.map((type) => (
                        <Badge
                          key={type.id}
                          className="gap-1 capitalize"
                          style={{
                            backgroundColor: type.color,
                            color: '#fff',
                            border: 'none',
                          }}
                        >
                          {type.name}
                          <button
                            onClick={() => handleRemoveImmuneType(type.id)}
                            className="ml-1 rounded-full hover:bg-black/20"
                            aria-label={`Remove ${type.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
