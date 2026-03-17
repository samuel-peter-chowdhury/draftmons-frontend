import { memo } from 'react';
import { ErrorAlert, Spinner } from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { getStatColor } from '@/lib/pokemon';
import type { SpeedTierPokemon } from '../constants';

export const SpeedTierColumn = memo(function SpeedTierColumn({
  teamName,
  pokemon,
  loading,
  error,
  onSpriteClick,
}: {
  teamName: string;
  pokemon: SpeedTierPokemon[];
  loading: boolean;
  error: string | null;
  onSpriteClick: (pokemonId: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1">
        <ErrorAlert message={error} />
      </div>
    );
  }

  if (pokemon.length === 0) {
    return (
      <div className="flex-1">
        <p className="py-6 text-center text-sm text-muted-foreground">No Pokemon found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto">
      <h3 className="mb-3 text-sm font-semibold">{teamName}</h3>
      {/* Column headers */}
      <div className="grid grid-cols-[48px_1fr_60px_60px_60px_60px] items-center gap-x-2 px-2 pb-1 text-[11px] font-medium text-muted-foreground">
        <span />
        <span>Name</span>
        <span className="text-right">Base</span>
        <span className="text-right">Neutral</span>
        <span className="text-right">+Nat</span>
        <span className="text-right">+Nat/+1</span>
      </div>
      <div className="space-y-0">
        {pokemon.map(({ pokemon: pkmn, speedTiers }) => (
          <div
            key={pkmn.id}
            className="grid grid-cols-[48px_1fr_60px_60px_60px_60px] items-center gap-x-2 rounded-md px-2 py-1 transition-colors hover:bg-secondary/50"
          >
            <PokemonSprite
              pokemonId={pkmn.id}
              spriteUrl={pkmn.spriteUrl}
              name={pkmn.name}
              className="h-10 w-10 object-contain"
              onClick={onSpriteClick}
            />
            <span className="truncate text-sm capitalize">{pkmn.name}</span>
            <span
              className="text-right text-sm font-semibold"
              style={{ color: getStatColor(pkmn.speed) }}
            >
              {pkmn.speed}
            </span>
            <span className="text-right text-sm text-muted-foreground">
              {speedTiers.maxNeutral}
            </span>
            <span className="text-right text-sm text-muted-foreground">
              {speedTiers.maxPositive}
            </span>
            <span className="text-right text-sm text-muted-foreground">
              {speedTiers.maxPositivePlus1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
