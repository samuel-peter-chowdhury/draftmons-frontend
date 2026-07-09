'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Button, Spinner } from '@/components';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { useFetch, useDebounce } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { PaginatedResponse, PokemonInput } from '@/types';

export function PokemonSearchCombobox({
  generationId,
  existingPokemonIds,
  onSelect,
}: {
  generationId: number;
  existingPokemonIds: Set<number>;
  onSelect: (pokemon: PokemonInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading } = useFetch<PaginatedResponse<PokemonInput>>(
    debouncedSearch.length >= 2
      ? buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_BASE, [], {
          nameLike: debouncedSearch,
          generationIds: generationId,
          pageSize: 20,
          sortBy: 'name',
          sortOrder: 'ASC',
        })
      : null,
  );

  const filteredResults = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((p) => !existingPokemonIds.has(p.id));
  }, [data, existingPokemonIds]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Search className="h-4 w-4" />
          Add Pokemon
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
        <Command shouldFilter={false} loop>
          <CommandInput
            placeholder="Search pokemon..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner size={20} />
              </div>
            ) : (
              <>
                {debouncedSearch.length < 2 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Type at least 2 characters
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No pokemon found.</CommandEmpty>
                    <CommandGroup>
                      {filteredResults.map((pokemon) => (
                        <CommandItem
                          key={pokemon.id}
                          value={String(pokemon.id)}
                          onSelect={() => {
                            onSelect(pokemon);
                            setSearch('');
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <PokemonSprite
                              pokemonId={pokemon.id}
                              spriteUrl={pokemon.spriteUrl}
                              name={pokemon.name}
                              className="h-8 w-8 object-contain"
                              disableClick
                            />
                            <span className="capitalize">{pokemon.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
