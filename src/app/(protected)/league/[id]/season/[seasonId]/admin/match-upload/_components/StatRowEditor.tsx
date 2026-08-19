'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
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
import type { SeasonPokemonInput } from '@/types';
import type { ManualStatDraft, ManualTeamOption } from './manual-entry.types';

interface StatRowEditorProps {
  stat: ManualStatDraft;
  // Draft pool per participating team, so the picker is scoped to the two teams
  // in this match and each entry shows which side it belongs to.
  poolByTeam: { team: ManualTeamOption; pool: SeasonPokemonInput[] }[];
  onChange: (patch: Partial<ManualStatDraft>) => void;
  onRemove: () => void;
}

export function StatRowEditor({ stat, poolByTeam, onChange, onRemove }: StatRowEditorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const isUnresolved = stat.seasonPokemonId === null;

  const filteredByTeam = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return poolByTeam
      .map(({ team, pool }) => ({
        team,
        pool: lower
          ? pool.filter((sp) => (sp.pokemon?.name ?? '').toLowerCase().includes(lower))
          : pool,
      }))
      .filter(({ pool }) => pool.length > 0);
  }, [poolByTeam, search]);

  const selectedName = useMemo(() => {
    if (stat.seasonPokemonId === null) return null;
    for (const { pool } of poolByTeam) {
      const sp = pool.find((p) => p.id === stat.seasonPokemonId);
      if (sp?.pokemon?.name) return sp.pokemon.name;
    }
    return `#${stat.seasonPokemonId}`;
  }, [stat.seasonPokemonId, poolByTeam]);

  return (
    <TableRow className={cn(isUnresolved && 'bg-destructive/10')}>
      <TableCell className="p-2">
        <div className="flex items-center gap-1.5">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full min-w-[160px] justify-start gap-1.5"
              >
                <span className="truncate capitalize">
                  {selectedName ?? stat.rawName ?? 'Select Pokémon…'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
              <Command shouldFilter={false} loop>
                <CommandInput
                  placeholder="Search drafted Pokémon…"
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty>Not in either team&apos;s draft pool.</CommandEmpty>
                  {filteredByTeam.map(({ team, pool }) => (
                    <CommandGroup key={team.teamId} heading={team.teamName}>
                      {pool.map((sp) => (
                        <CommandItem
                          key={sp.id}
                          value={String(sp.id)}
                          onSelect={() => {
                            onChange({ seasonPokemonId: sp.id, rawName: null });
                            setOpen(false);
                            setSearch('');
                          }}
                        >
                          <span className="capitalize">{sp.pokemon?.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
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

      <TableCell className="p-2">
        <Input
          type="number"
          min="0"
          className="h-8 w-16 p-1 text-sm"
          value={stat.directKills}
          onChange={(e) => onChange({ directKills: e.target.value })}
        />
      </TableCell>

      <TableCell className="p-2">
        <Input
          type="number"
          min="0"
          className="h-8 w-16 p-1 text-sm"
          value={stat.indirectKills}
          onChange={(e) => onChange({ indirectKills: e.target.value })}
        />
      </TableCell>

      <TableCell className="p-2">
        <Input
          type="number"
          min="0"
          className="h-8 w-16 p-1 text-sm"
          value={stat.deaths}
          onChange={(e) => onChange({ deaths: e.target.value })}
        />
      </TableCell>

      <TableCell className="p-2">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Remove stat row"
          className="size-8 p-0"
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
