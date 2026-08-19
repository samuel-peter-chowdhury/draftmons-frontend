'use client';

import { useMemo, useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { Badge, Button } from '@/components';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import type { ManualMatchOption } from './manual-entry.types';

interface MatchSelectorProps {
  matches: ManualMatchOption[];
  value: number | null;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (matchId: number) => void;
}

function matchLabel(match: ManualMatchOption): string {
  const [teamA, teamB] = match.teams;
  return `${match.weekName} — ${teamA?.teamName ?? '?'} vs ${teamB?.teamName ?? '?'}`;
}

/**
 * Searchable match picker for the manual-entry flow. Unplayed matches sort first
 * (the common case), but a match that already has a result stays selectable so a
 * moderator can correct it — that path just hits the overwrite-confirm dialog.
 */
export function MatchSelector({ matches, value, loading, disabled, onSelect }: MatchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const sorted = useMemo(
    () =>
      [...matches].sort((a, b) => {
        if (a.hasResult !== b.hasResult) return a.hasResult ? 1 : -1;
        if (a.weekNumber !== b.weekNumber) return a.weekNumber - b.weekNumber;
        return a.matchId - b.matchId;
      }),
    [matches],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const lower = search.toLowerCase();
    return sorted.filter((m) => matchLabel(m).toLowerCase().includes(lower));
  }, [sorted, search]);

  const selected = matches.find((m) => m.matchId === value) ?? null;

  if (loading) {
    return <Skeleton className="h-10 w-full max-w-xl" />;
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-muted-foreground">Match</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full max-w-xl justify-between"
            disabled={disabled}
          >
            <span className="truncate">{selected ? matchLabel(selected) : 'Select a match…'}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          sideOffset={4}
        >
          <Command shouldFilter={false} loop>
            <CommandInput
              placeholder="Search by team or week…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No matching match.</CommandEmpty>
              <CommandGroup>
                {filtered.map((m) => (
                  <CommandItem
                    key={m.matchId}
                    value={String(m.matchId)}
                    onSelect={() => {
                      onSelect(m.matchId);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <span className="flex-1 truncate">{matchLabel(m)}</span>
                    {m.resultLabel && (
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        {m.resultLabel}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected?.hasResult && (
        <p className="text-xs text-warning">
          This match already has a recorded result — submitting will ask you to confirm before
          replacing it.
        </p>
      )}
    </div>
  );
}
