'use client';

import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { cn } from '@/lib/utils';
import type { SeasonInput, SeasonPokemonInput, TeamInput } from '@/types';

interface TeamRosterCardProps {
  team: TeamInput;
  rosterRows: SeasonPokemonInput[];
  season: SeasonInput;
  onSpriteClick: (pokemonId: number, seasonPokemonId?: number) => void;
}

export function TeamRosterCard({ team, rosterRows, season, onSpriteClick }: TeamRosterCardProps) {
  const sortedRoster = useMemo(
    () => [...rosterRows].sort((a, b) => b.pointValue - a.pointValue),
    [rosterRows],
  );

  const pointsRemaining =
    season.pointLimit - sortedRoster.reduce((sum, row) => sum + row.pointValue, 0);

  const slotCount = Math.max(season.maxRosterSize, sortedRoster.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{team.name}</span>
          <span
            className={cn(
              'text-sm font-medium',
              pointsRemaining < 0 ? 'text-destructive' : 'text-foreground',
            )}
          >
            {pointsRemaining} pts remaining
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: slotCount }, (_, index) => {
            const row = sortedRoster[index];

            if (row) {
              const overCap = index >= season.maxRosterSize;
              return (
                <div
                  key={row.id}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-md border border-border p-2',
                    overCap && 'border-destructive ring-1 ring-destructive',
                  )}
                >
                  <PokemonSprite
                    pokemonId={row.pokemon!.id}
                    spriteUrl={row.pokemon!.spritePngUrl}
                    name={row.pokemon!.name}
                    className="h-14 w-14 object-contain"
                    onClick={(id) => onSpriteClick(id, row.id)}
                  />
                  <span className="text-xs text-muted-foreground">{row.pointValue} pts</span>
                </div>
              );
            }

            const required = index < season.minRosterSize;
            return (
              <div
                key={`empty-${index}`}
                className={cn(
                  'flex min-h-[74px] flex-col items-center justify-center rounded-md border border-dashed p-2',
                  required ? 'border-warning/50 bg-warning/5' : 'border-border',
                )}
              >
                <span className="text-[10px] text-muted-foreground">
                  {required ? 'Required' : 'Open'}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
