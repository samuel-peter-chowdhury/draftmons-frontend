'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  Spinner,
  Input,
  Label,
} from '@/components';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatGenerationName } from '@/lib/utils';
import type {
  AbilityInput,
  PokemonInput,
  PokemonTypeInput,
  MoveInput,
  GenerationInput,
  PaginatedResponse,
} from '@/types';

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
  const [nameLike, setNameLike] = useState('');
  const [minHp, setMinHp] = useState<string>('');
  const [maxHp, setMaxHp] = useState<string>('');
  const [minAttack, setMinAttack] = useState<string>('');
  const [maxAttack, setMaxAttack] = useState<string>('');
  const [minDefense, setMinDefense] = useState<string>('');
  const [maxDefense, setMaxDefense] = useState<string>('');
  const [minSpecialAttack, setMinSpecialAttack] = useState<string>('');
  const [maxSpecialAttack, setMaxSpecialAttack] = useState<string>('');
  const [minSpecialDefense, setMinSpecialDefense] = useState<string>('');
  const [maxSpecialDefense, setMaxSpecialDefense] = useState<string>('');
  const [minSpeed, setMinSpeed] = useState<string>('');
  const [maxSpeed, setMaxSpeed] = useState<string>('');
  const [minBaseStatTotal, setMinBaseStatTotal] = useState<string>('');
  const [maxBaseStatTotal, setMaxBaseStatTotal] = useState<string>('');
  const [minPhysicalBulk, setMinPhysicalBulk] = useState<string>('');
  const [maxPhysicalBulk, setMaxPhysicalBulk] = useState<string>('');
  const [minSpecialBulk, setMinSpecialBulk] = useState<string>('');
  const [maxSpecialBulk, setMaxSpecialBulk] = useState<string>('');

  // Selected filters
  const [selectedAbilities, setSelectedAbilities] = useState<AbilityInput[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<PokemonTypeInput[]>([]);
  const [selectedMoves, setSelectedMoves] = useState<MoveInput[]>([]);
  const [selectedGenerations, setSelectedGenerations] = useState<GenerationInput[]>([]);

  // Dropdown selections
  const [abilitySearch, setAbilitySearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [moveSearch, setMoveSearch] = useState('');
  const [generationSearch, setGenerationSearch] = useState('');

  // Dropdown focus states
  const [abilityFocused, setAbilityFocused] = useState(false);
  const [typeFocused, setTypeFocused] = useState(false);
  const [moveFocused, setMoveFocused] = useState(false);
  const [generationFocused, setGenerationFocused] = useState(false);

  // Fetch abilities, types, and generations for dropdowns
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

  const { data: abilitiesData } = useFetch<PaginatedResponse<AbilityInput>>(abilitiesUrl);
  const { data: typesData } = useFetch<PaginatedResponse<PokemonTypeInput>>(typesUrl);
  const { data: movesData } = useFetch<PaginatedResponse<MoveInput>>(movesUrl);
  const { data: generationsData } = useFetch<PaginatedResponse<GenerationInput>>(generationsUrl);

  const abilities = abilitiesData?.data || [];
  const types = typesData?.data || [];
  const moves = movesData?.data || []
  const generations = generationsData?.data || [];

  // Build params for API call
  const params = useMemo(() => {
    const p: any = {
      page,
      pageSize,
      sortBy,
      sortOrder,
    };

    if (nameLike.trim()) p.nameLike = nameLike.trim();
    if (minHp) p.minHp = parseInt(minHp);
    if (maxHp) p.maxHp = parseInt(maxHp);
    if (minAttack) p.minAttack = parseInt(minAttack);
    if (maxAttack) p.maxAttack = parseInt(maxAttack);
    if (minDefense) p.minDefense = parseInt(minDefense);
    if (maxDefense) p.maxDefense = parseInt(maxDefense);
    if (minSpecialAttack) p.minSpecialAttack = parseInt(minSpecialAttack);
    if (maxSpecialAttack) p.maxSpecialAttack = parseInt(maxSpecialAttack);
    if (minSpecialDefense) p.minSpecialDefense = parseInt(minSpecialDefense);
    if (maxSpecialDefense) p.maxSpecialDefense = parseInt(maxSpecialDefense);
    if (minSpeed) p.minSpeed = parseInt(minSpeed);
    if (maxSpeed) p.maxSpeed = parseInt(maxSpeed);
    if (minBaseStatTotal) p.minBaseStatTotal = parseInt(minBaseStatTotal);
    if (maxBaseStatTotal) p.maxBaseStatTotal = parseInt(maxBaseStatTotal);
    if (minPhysicalBulk) p.minPhysicalBulk = parseInt(minPhysicalBulk);
    if (maxPhysicalBulk) p.maxPhysicalBulk = parseInt(maxPhysicalBulk);
    if (minSpecialBulk) p.minSpecialBulk = parseInt(minSpecialBulk);
    if (maxSpecialBulk) p.maxSpecialBulk = parseInt(maxSpecialBulk);

    if (selectedAbilities.length > 0) {
      p.abilityIds = selectedAbilities.map((a) => a.id);
    }
    if (selectedTypes.length > 0) {
      p.pokemonTypeIds = selectedTypes.map((t) => t.id);
    }
    if (selectedMoves.length > 0) {
      p.moveIds = selectedMoves.map((m) => m.id);
    }
    if (selectedGenerations.length > 0) {
      p.generationIds = selectedGenerations.map((g) => g.id);
    }

    return p;
  }, [
    page,
    pageSize,
    sortBy,
    sortOrder,
    nameLike,
    minHp,
    maxHp,
    minAttack,
    maxAttack,
    minDefense,
    maxDefense,
    minSpecialAttack,
    maxSpecialAttack,
    minSpecialDefense,
    maxSpecialDefense,
    minSpeed,
    maxSpeed,
    minBaseStatTotal,
    maxBaseStatTotal,
    minPhysicalBulk,
    maxPhysicalBulk,
    minSpecialBulk,
    maxSpecialBulk,
    selectedAbilities,
    selectedTypes,
    selectedMoves,
    selectedGenerations,
  ]);

  // Build URL for pokemon fetch
  const pokemonUrl = useMemo(() => {
    return buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_BASE, [], params);
  }, [params]);

  // Fetch pokemon data
  const { data, loading, error } = useFetch<PaginatedResponse<PokemonInput>>(pokemonUrl);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    nameLike,
    minHp,
    maxHp,
    minAttack,
    maxAttack,
    minDefense,
    maxDefense,
    minSpecialAttack,
    maxSpecialAttack,
    minSpecialDefense,
    maxSpecialDefense,
    minSpeed,
    maxSpeed,
    minBaseStatTotal,
    maxBaseStatTotal,
    minPhysicalBulk,
    maxPhysicalBulk,
    minSpecialBulk,
    maxSpecialBulk,
    selectedAbilities,
    selectedTypes,
    selectedMoves,
    selectedGenerations,
  ]);

  const handleSort = (column: SortableColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const SortableHeader = ({
    column,
    children,
  }: {
    column: SortableColumn;
    children: React.ReactNode;
  }) => {
    const isActive = sortBy === column;
    return (
      <button
        onClick={() => handleSort(column)}
        className="inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground"
      >
        {children}
        {isActive && sortOrder === 'ASC' && <ChevronUp className="h-4 w-4" />}
        {isActive && sortOrder === 'DESC' && <ChevronDown className="h-4 w-4" />}
        {!isActive && <div className="h-4 w-4" />}
      </button>
    );
  };

  const handleAddAbility = (abilityId: number) => {
    const ability = abilities.find((a) => a.id === abilityId);
    if (ability && !selectedAbilities.find((a) => a.id === abilityId)) {
      setSelectedAbilities([...selectedAbilities, ability]);
      setAbilitySearch('');
      setAbilityFocused(false);
    }
  };

  const handleRemoveAbility = (abilityId: number) => {
    setSelectedAbilities(selectedAbilities.filter((a) => a.id !== abilityId));
  };

  const handleAddType = (typeId: number) => {
    const type = types.find((t) => t.id === typeId);
    if (type && !selectedTypes.find((t) => t.id === typeId)) {
      setSelectedTypes([...selectedTypes, type]);
      setTypeSearch('');
      setTypeFocused(false);
    }
  };

  const handleRemoveType = (typeId: number) => {
    setSelectedTypes(selectedTypes.filter((t) => t.id !== typeId));
  };

  const handleAddMove = (moveId: number) => {
    const move = moves.find((m) => m.id === moveId);
    if (move && !selectedMoves.find((m) => m.id === moveId)) {
      setSelectedMoves([...selectedMoves, move]);
      setMoveSearch('');
      setMoveFocused(false);
    }
  };

  const handleRemoveMove = (moveId: number) => {
    setSelectedMoves(selectedMoves.filter((m) => m.id !== moveId));
  };

  const handleAddGeneration = (generationId: number) => {
    const generation = generations.find((g) => g.id === generationId);
    if (generation && !selectedGenerations.find((g) => g.id === generationId)) {
      setSelectedGenerations([...selectedGenerations, generation]);
      setGenerationSearch('');
      setGenerationFocused(false);
    }
  };

  const handleRemoveGeneration = (generationId: number) => {
    setSelectedGenerations(selectedGenerations.filter((g) => g.id !== generationId));
  };

  const filteredAbilities = abilities.filter(
    (a) =>
      !selectedAbilities.find((sa) => sa.id === a.id) &&
      a.name.toLowerCase().includes(abilitySearch.toLowerCase()),
  );

  const filteredTypes = types.filter(
    (t) =>
      !selectedTypes.find((st) => st.id === t.id) &&
      t.name.toLowerCase().includes(typeSearch.toLowerCase()),
  );

  const filteredMoves = moves.filter(
    (m) =>
      !selectedMoves.find((sm) => sm.id === m.id) &&
      m.name.toLowerCase().includes(moveSearch.toLowerCase()),
  );

  const filteredGenerations = generations.filter(
    (g) =>
      !selectedGenerations.find((sg) => sg.id === g.id) &&
      g.name.toLowerCase().includes(generationSearch.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-[1600px] p-4">
      <h1 className="mb-4 text-2xl font-semibold">Pokemon</h1>

      {/* Filtering Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name Filter */}
          <div>
            <Label htmlFor="nameLike">Name</Label>
            <Input
              id="nameLike"
              placeholder="Search by name..."
              value={nameLike}
              onChange={(e) => setNameLike(e.target.value)}
            />
          </div>

          {/* Stats Filters Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* HP */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">HP</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minHp}
                  onChange={(e) => setMinHp(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxHp}
                  onChange={(e) => setMaxHp(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Attack */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Attack</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minAttack}
                  onChange={(e) => setMinAttack(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxAttack}
                  onChange={(e) => setMaxAttack(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Defense */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Defense</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minDefense}
                  onChange={(e) => setMinDefense(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxDefense}
                  onChange={(e) => setMaxDefense(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Special Attack */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Special Attack</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minSpecialAttack}
                  onChange={(e) => setMinSpecialAttack(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxSpecialAttack}
                  onChange={(e) => setMaxSpecialAttack(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Special Defense */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Special Defense</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minSpecialDefense}
                  onChange={(e) => setMinSpecialDefense(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxSpecialDefense}
                  onChange={(e) => setMaxSpecialDefense(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Speed */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Speed</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minSpeed}
                  onChange={(e) => setMinSpeed(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxSpeed}
                  onChange={(e) => setMaxSpeed(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Base Stat Total */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Base Stat Total</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minBaseStatTotal}
                  onChange={(e) => setMinBaseStatTotal(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxBaseStatTotal}
                  onChange={(e) => setMaxBaseStatTotal(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Physical Bulk */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Physical Bulk</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPhysicalBulk}
                  onChange={(e) => setMinPhysicalBulk(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPhysicalBulk}
                  onChange={(e) => setMaxPhysicalBulk(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Special Bulk */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Special Bulk</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minSpecialBulk}
                  onChange={(e) => setMinSpecialBulk(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxSpecialBulk}
                  onChange={(e) => setMaxSpecialBulk(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Abilities Filter */}
          <div>
            <Label htmlFor="abilities">Abilities</Label>
            <div className="relative">
              <Input
                id="abilities"
                placeholder="Search abilities..."
                value={abilitySearch}
                onChange={(e) => setAbilitySearch(e.target.value)}
                onFocus={() => setAbilityFocused(true)}
                onClick={() => setAbilityFocused(true)}
                onBlur={() => setAbilityFocused(false)}
              />
              {abilityFocused && filteredAbilities.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
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
            {selectedAbilities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedAbilities.map((ability) => (
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

          {/* Types Filter */}
          <div>
            <Label htmlFor="types">Types</Label>
            <div className="relative">
              <Input
                id="types"
                placeholder="Search types..."
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
                onFocus={() => setTypeFocused(true)}
                onClick={() => setTypeFocused(true)}
                onBlur={() => setTypeFocused(false)}
              />
              {typeFocused && filteredTypes.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
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
            {selectedTypes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedTypes.map((type) => (
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

          {/* Moves Filter */}
          <div>
            <Label htmlFor="moves">Moves</Label>
            <div className="relative">
              <Input
                id="moves"
                placeholder="Search moves..."
                value={moveSearch}
                onChange={(e) => setMoveSearch(e.target.value)}
                onFocus={() => setMoveFocused(true)}
                onClick={() => setMoveFocused(true)}
                onBlur={() => setMoveFocused(false)}
              />
              {moveFocused && filteredMoves.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
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
            {selectedMoves.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedMoves.map((move) => (
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

          {/* Generations Filter */}
          <div>
            <Label htmlFor="generations">Generations</Label>
            <div className="relative">
              <Input
                id="generations"
                placeholder="Search generations..."
                value={generationSearch}
                onChange={(e) => setGenerationSearch(e.target.value)}
                onFocus={() => setGenerationFocused(true)}
                onClick={() => setGenerationFocused(true)}
                onBlur={() => setGenerationFocused(false)}
              />
              {generationFocused && filteredGenerations.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
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
            {selectedGenerations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedGenerations.map((generation) => (
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
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && <ErrorAlert message={error} />}

      {/* Loading State */}
      {loading && !data && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {/* Pokemon Table */}
      {data && (
        <>
          <Card>
            <CardContent className="p-0">
              <div className={loading ? 'pointer-events-none opacity-50' : ''}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20"></TableHead>
                      <TableHead>
                        <SortableHeader column="name">Name</SortableHeader>
                      </TableHead>
                      <TableHead>Types</TableHead>
                      <TableHead>Abilities</TableHead>
                      <TableHead>
                        <SortableHeader column="hp">HP</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="attack">Atk</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="defense">Def</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="specialAttack">Sp.Atk</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="specialDefense">Sp.Def</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="speed">Spd</SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="baseStatTotal">BST</SortableHeader>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground">
                          No pokemon found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.data.map((pokemon) => (
                        <TableRow key={pokemon.id}>
                          <TableCell className="w-20">
                            {pokemon.spriteUrl ? (
                              <img
                                src={pokemon.spriteUrl}
                                alt={pokemon.name}
                                className="h-16 w-16 object-contain"
                              />
                            ) : (
                              <div className="h-16 w-16" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium capitalize">{pokemon.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {pokemon.pokemonTypes.map((type) => (
                                <Badge
                                  key={type.id}
                                  className="capitalize"
                                  style={{
                                    backgroundColor: type.color,
                                    color: '#fff',
                                    border: 'none',
                                  }}
                                >
                                  {type.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {pokemon.abilities.map((ability) => (
                                <Badge key={ability.id} variant="secondary" className="capitalize">
                                  {ability.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{pokemon.hp}</TableCell>
                          <TableCell>{pokemon.attack}</TableCell>
                          <TableCell>{pokemon.defense}</TableCell>
                          <TableCell>{pokemon.specialAttack}</TableCell>
                          <TableCell>{pokemon.specialDefense}</TableCell>
                          <TableCell>{pokemon.speed}</TableCell>
                          <TableCell className="font-medium">{pokemon.baseStatTotal}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Go to previous page"
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Page {data.page} of {data.totalPages} • {data.total} total
            </div>
            <Button
              variant="outline"
              onClick={() => setPage((p) => (p < data.totalPages ? p + 1 : p))}
              disabled={page >= data.totalPages}
              aria-label="Go to next page"
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
