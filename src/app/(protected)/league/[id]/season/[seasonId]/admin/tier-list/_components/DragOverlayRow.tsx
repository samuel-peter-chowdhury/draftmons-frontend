'use client';

import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import type { SeasonPokemonInput } from '@/types';

export function DragOverlayRow({ sp }: { sp: SeasonPokemonInput }) {
  const pkmn = sp.pokemon;
  if (!pkmn) return null;

  return (
    <div className="grid grid-cols-[36px_1fr] items-center rounded-md border border-border bg-background px-2 py-0.5 shadow-lg">
      <PokemonSprite
        pokemonId={pkmn.id}
        spriteUrl={pkmn.spriteUrl}
        name={pkmn.name}
        className="h-8 w-8 object-contain"
        disableClick
      />
      <span className="truncate pr-1 text-xs capitalize">{pkmn.name}</span>
    </div>
  );
}
