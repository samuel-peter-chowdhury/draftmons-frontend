'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  ImageUploadField,
  Spinner,
} from '@/components';
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
import { useDebounce, useFetch, useMutation } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { PokemonApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { PaginatedResponse, PokemonInput } from '@/types';

/**
 * Admin tool: override a Pokemon's sprite with an uploaded image, or clear the
 * override to revert to the computed Smogon/Showdown sprites. Gated by the admin
 * page's isAdmin guard and the backend's admin-write endpoint.
 */
export function PokemonSpriteOverrideCard() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PokemonInput | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading } = useFetch<PaginatedResponse<PokemonInput>>(
    debouncedSearch.length >= 2
      ? buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_BASE, [], {
          nameLike: debouncedSearch,
          pageSize: 20,
          sortBy: 'name',
          sortOrder: 'ASC',
        })
      : null,
  );

  const spriteMutation = useMutation(
    (sprite: string) => PokemonApi.update(selected!.id, { sprite }),
    { onSuccess: (updated) => setSelected(updated) },
  );

  const results = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pokemon Sprite Override</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Search for a Pokemon, then upload a custom sprite. Clearing the override reverts to the
          default computed sprite.
        </p>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Search className="h-4 w-4" />
              {selected ? 'Change Pokemon' : 'Find Pokemon'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
            <Command shouldFilter={false} loop>
              <CommandInput placeholder="Search pokemon..." value={search} onValueChange={setSearch} />
              <CommandList>
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Spinner size={20} />
                  </div>
                ) : debouncedSearch.length < 2 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Type at least 2 characters
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No pokemon found.</CommandEmpty>
                    <CommandGroup>
                      {results.map((pokemon) => (
                        <CommandItem
                          key={pokemon.id}
                          value={String(pokemon.id)}
                          onSelect={() => {
                            setSelected(pokemon);
                            setSearch('');
                            setOpen(false);
                            spriteMutation.reset();
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <PokemonSprite
                              pokemonId={pokemon.id}
                              spriteUrl={pokemon.spritePngUrl}
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
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selected && (
          <div className="space-y-3 rounded-xl border border-border/[0.08] p-4">
            <div className="text-sm font-medium capitalize">{selected.name}</div>
            <ImageUploadField
              uploadTokenEndpoint={`/api/pokemon/${selected.id}/sprite-upload-token`}
              pathPrefix={`sprites/pokemon/${selected.id}/`}
              currentUrl={selected.spritePngUrl}
              label="Upload sprite"
              disabled={spriteMutation.loading}
              onUploadComplete={(url) => spriteMutation.mutate(url)}
            />
            {selected.sprite ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={spriteMutation.loading}
                onClick={() => spriteMutation.mutate('')}
              >
                Clear override
              </Button>
            ) : null}
            {spriteMutation.error && <ErrorAlert message={spriteMutation.error} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
