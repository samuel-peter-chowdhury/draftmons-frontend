'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type {
  MatchPreviewDto,
  SeasonPokemonInput,
  PreviewErrorDto,
  PlayerPreviewDto,
} from '@/types';
import { PreviewErrorCode } from '@/types';
import { GamePreviewCard } from './GamePreviewCard';

interface Team {
  teamId: number;
  teamName: string;
}

interface MatchPreviewPanelProps {
  preview: MatchPreviewDto;
  seasonPool: SeasonPokemonInput[];
  teams: Team[];
  onOverridePlayer: (playerIndex: number, userId: number) => void;
  onOverrideMatch: (matchId: number) => void;
  onOverrideGame: (
    gameIndex: number,
    field: 'winnerTeamId' | 'loserTeamId' | 'differential',
    value: number,
  ) => void;
  onOverridePokemon: (
    gameIndex: number,
    statIndex: number,
    seasonPokemonId: number,
  ) => void;
  onOverrideStat: (
    gameIndex: number,
    statIndex: number,
    field: 'directKills' | 'indirectKills' | 'deaths',
    value: number,
  ) => void;
}

// Inline combobox for match/player candidate selection
function CandidateCombobox({
  placeholder,
  emptyText,
  items,
  onSelect,
}: {
  placeholder: string;
  emptyText: string;
  items: { value: number; label: string }[];
  onSelect: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search
    ? items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          {placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
        <Command shouldFilter={false} loop>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filtered.map((item) => (
                <CommandItem
                  key={item.value}
                  value={String(item.value)}
                  onSelect={() => {
                    onSelect(item.value);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// PlayerSlot: a named sub-component to avoid hook-in-loop
function PlayerSlot({
  player,
  playerIndex,
  userError,
  onOverridePlayer,
}: {
  player: PlayerPreviewDto;
  playerIndex: number;
  userError: PreviewErrorDto | undefined;
  onOverridePlayer: (playerIndex: number, userId: number) => void;
}) {
  const displayName = player.userDisplayName ?? player.rawShowdownName;

  const userCandidates = userError?.candidates
    ? (
        userError.candidates as {
          userId: number;
          name: string;
          showdownUsername: string | null;
        }[]
      ).map((c) => ({
        value: c.userId,
        label: c.name || c.showdownUsername || `User #${c.userId}`,
      }))
    : [];

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{displayName}</span>
      {player.userId === null ? (
        <div className="flex items-center gap-2">
          <Badge variant="destructive">User unresolved</Badge>
          <CandidateCombobox
            placeholder="Search users…"
            emptyText="No user found."
            items={userCandidates}
            onSelect={(userId) => onOverridePlayer(playerIndex, userId)}
          />
        </div>
      ) : player.teamId === null ? (
        <Badge variant="destructive">Team unresolved</Badge>
      ) : null}
    </div>
  );
}

export function MatchPreviewPanel({
  preview,
  seasonPool,
  teams,
  onOverridePlayer,
  onOverrideMatch,
  onOverrideGame,
  onOverridePokemon,
  onOverrideStat,
}: MatchPreviewPanelProps) {
  // Find error with MATCH_AMBIGUOUS code for candidate list
  const matchAmbiguousError = preview.errors.find(
    (e) => e.code === PreviewErrorCode.MATCH_AMBIGUOUS,
  );

  const matchCandidates = useMemo(() => {
    if (!matchAmbiguousError?.candidates) return [];
    return (
      matchAmbiguousError.candidates as {
        matchId: number;
        weekName: string | null;
        hasGames: boolean;
      }[]
    ).map((c) => ({
      value: c.matchId,
      label: c.weekName
        ? `${c.weekName}${c.hasGames ? ' (has games)' : ''}`
        : `Match #${c.matchId}${c.hasGames ? ' (has games)' : ''}`,
    }));
  }, [matchAmbiguousError]);

  // Build a map of player index → USER_NOT_FOUND error
  const userNotFoundErrors = useMemo(() => {
    const map: Record<number, PreviewErrorDto> = {};
    preview.errors.forEach((e) => {
      if (e.code === PreviewErrorCode.USER_NOT_FOUND) {
        const match = e.field.match(/players\[(\d+)\]/);
        if (match) {
          map[Number(match[1])] = e;
        }
      }
    });
    return map;
  }, [preview.errors]);

  return (
    <div className="flex flex-col gap-6">
      {/* Match header */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {preview.weekName ?? 'Week unknown'}
        </span>
        {preview.matchId === null && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Match unresolved</Badge>
            <CandidateCombobox
              placeholder="Select match…"
              emptyText="No candidate matches."
              items={matchCandidates}
              onSelect={onOverrideMatch}
            />
          </div>
        )}
      </div>

      {/* Player row */}
      <div className="grid grid-cols-2 gap-4">
        {preview.players.map((player, i) => (
          <PlayerSlot
            key={i}
            player={player}
            playerIndex={i}
            userError={userNotFoundErrors[i]}
            onOverridePlayer={onOverridePlayer}
          />
        ))}
      </div>

      {/* Game preview cards */}
      {preview.games.map((game, gameIndex) => (
        <GamePreviewCard
          key={game.gameNumber}
          game={game}
          teams={teams}
          seasonPool={seasonPool}
          onOverrideGame={(field, value) => onOverrideGame(gameIndex, field, value)}
          onOverridePokemon={(statIndex, seasonPokemonId) =>
            onOverridePokemon(gameIndex, statIndex, seasonPokemonId)
          }
          onOverrideStat={(statIndex, field, value) =>
            onOverrideStat(gameIndex, statIndex, field, value)
          }
        />
      ))}
    </div>
  );
}
