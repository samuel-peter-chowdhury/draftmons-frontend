'use client';

import { Card, CardContent, CardHeader, CardTitle, PokemonSprite, Spinner } from '@/components';
import type { PokemonStatRow } from '@/lib/teamStats';

interface TopPerformersCardProps {
  rows: PokemonStatRow[];
  /** True while the roster-stats fetch is still in flight. */
  loading?: boolean;
  onSpriteClick: (pokemonId: number, seasonPokemonId: number) => void;
}

export function TopPerformersCard({ rows, loading, onSpriteClick }: TopPerformersCardProps) {
  const leaders = rows.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner size={20} />
          </div>
        ) : leaders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No games played yet.</p>
        ) : (
          <ul className="space-y-2">
            {leaders.map((row, index) => (
              <li key={row.seasonPokemonId} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-sm font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <PokemonSprite
                  pokemonId={row.pokemon.id}
                  spriteUrl={row.pokemon.spritePngUrl}
                  name={row.pokemon.name}
                  className="size-12 shrink-0 object-contain"
                  onClick={(pokemonId) => onSpriteClick(pokemonId, row.seasonPokemonId)}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium capitalize">{row.pokemon.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.totalKills} kills · {row.kda.toFixed(2)} KDA
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
