'use client';

import { X } from 'lucide-react';
import { Button } from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import type { PokemonInput } from '@/types';

interface RapidPlacementRowProps {
  pokemon: PokemonInput;
  /** The row's assigned tier, or undefined when no SeasonPokemon row exists.
   * `undefined` is NOT a synonym for pointValue 0 (D-RAPID-04 / Pitfall 1). */
  currentPointValue: number | undefined;
  maxPointValue: number;
  /** Row-scoped in-flight flag; applied to every button in the row (D-RAPID-12). */
  disabled: boolean;
  onTierClick: (pointValue: number) => void;
  onRemoveClick: () => void;
}

export function RapidPlacementRow({
  pokemon,
  currentPointValue,
  maxPointValue,
  disabled,
  onTierClick,
  onRemoveClick,
}: RapidPlacementRowProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <PokemonSprite
        pokemonId={pokemon.id}
        spriteUrl={pokemon.spriteUrl}
        name={pokemon.name}
        className="h-8 w-8 shrink-0 object-contain"
        disableClick
      />
      <span className="w-28 shrink-0 truncate text-xs capitalize">{pokemon.name}</span>
      <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {Array.from({ length: maxPointValue }, (_, i) => i + 1).map((pv) => (
          <Button
            key={pv}
            size="sm"
            variant={currentPointValue === pv ? 'default' : 'outline'}
            className="h-7 w-7 shrink-0 p-0 text-xs"
            disabled={disabled}
            onClick={() => onTierClick(pv)}
          >
            {pv}
          </Button>
        ))}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0 text-muted-foreground transition-colors hover:text-destructive"
        disabled={disabled || currentPointValue === undefined}
        onClick={onRemoveClick}
        aria-label={`Remove ${pokemon.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
