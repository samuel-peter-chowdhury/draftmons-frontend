'use client';

import { useState, useMemo } from 'react';
import { Badge, Button, Input, TableCell, TableRow } from '@/components';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { StatPreviewDto, SeasonPokemonInput } from '@/types';

interface StatOverrideRowProps {
  stat: StatPreviewDto;
  seasonPool: SeasonPokemonInput[];
  onOverridePokemon: (seasonPokemonId: number) => void;
  onOverrideStat: (
    field: 'directKills' | 'indirectKills' | 'deaths',
    value: number,
  ) => void;
}

export function StatOverrideRow({
  stat,
  seasonPool,
  onOverridePokemon,
  onOverrideStat,
}: StatOverrideRowProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const isUnresolved = stat.seasonPokemonId === null;

  const filteredPool = useMemo(() => {
    if (!search) return seasonPool;
    const lower = search.toLowerCase();
    return seasonPool.filter((sp) =>
      (sp.pokemon?.name ?? '').toLowerCase().includes(lower),
    );
  }, [seasonPool, search]);

  const displayName = stat.seasonPokemonId !== null ? stat.name : stat.rawName;

  return (
    <TableRow className={cn(isUnresolved && 'bg-destructive/10')}>
      {/* Pokémon combobox cell */}
      <TableCell className="p-2">
        <div className="flex items-center gap-1.5">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 w-full min-w-[160px] justify-start"
              >
                {displayName ?? 'Search season Pokémon…'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
              <Command shouldFilter={false} loop>
                <CommandInput
                  placeholder="Search season Pokémon…"
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty>Not in season pool.</CommandEmpty>
                  <CommandGroup>
                    {filteredPool.map((sp) => (
                      <CommandItem
                        key={sp.id}
                        value={String(sp.id)}
                        onSelect={() => {
                          onOverridePokemon(sp.id);
                          setOpen(false);
                          setSearch('');
                        }}
                      >
                        <span className="capitalize">{sp.pokemon?.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {isUnresolved && (
            <Badge variant="destructive" className="shrink-0 text-xs">
              Unresolved
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Direct kills */}
      <TableCell className="p-2">
        <Input
          type="number"
          min="0"
          className="w-16 p-1 h-8 text-sm"
          value={stat.directKills}
          onChange={(e) => onOverrideStat('directKills', Number(e.target.value))}
        />
      </TableCell>

      {/* Indirect kills */}
      <TableCell className="p-2">
        <Input
          type="number"
          min="0"
          className="w-16 p-1 h-8 text-sm"
          value={stat.indirectKills}
          onChange={(e) => onOverrideStat('indirectKills', Number(e.target.value))}
        />
      </TableCell>

      {/* Deaths */}
      <TableCell className="p-2">
        <Input
          type="number"
          min="0"
          className="w-16 p-1 h-8 text-sm"
          value={stat.deaths}
          onChange={(e) => onOverrideStat('deaths', Number(e.target.value))}
        />
      </TableCell>
    </TableRow>
  );
}
