import { memo } from 'react';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import type { PokemonInput } from '@/types';

export const MoveSpritesRow = memo(function MoveSpritesRow({
  teamAPokemon,
  teamBPokemon,
  teamASelected,
  teamBSelected,
  onSpriteClick,
  badge,
}: {
  teamAPokemon: PokemonInput[];
  teamBPokemon: PokemonInput[];
  teamASelected: boolean;
  teamBSelected: boolean;
  onSpriteClick: (pokemonId: number) => void;
  badge: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 rounded-md px-2 py-1 transition-colors hover:bg-secondary/30">
      {/* Team A sprites — right-aligned */}
      <div className="flex flex-wrap items-center justify-end gap-0.5">
        {teamASelected ? (
          teamAPokemon.length > 0 ? (
            teamAPokemon.map((pkmn) => (
              <PokemonSprite
                key={pkmn.id}
                pokemonId={pkmn.id}
                spriteUrl={pkmn.spriteUrl}
                name={pkmn.name}
                className="h-7 w-7 object-contain"
                onClick={onSpriteClick}
              />
            ))
          ) : (
            <span className="text-xs text-muted-foreground">&mdash;</span>
          )
        ) : (
          <span />
        )}
      </div>

      {/* Center badge */}
      <div className="flex w-40 justify-center">{badge}</div>

      {/* Team B sprites — left-aligned */}
      <div className="flex flex-wrap items-center justify-start gap-0.5">
        {teamBSelected ? (
          teamBPokemon.length > 0 ? (
            teamBPokemon.map((pkmn) => (
              <PokemonSprite
                key={pkmn.id}
                pokemonId={pkmn.id}
                spriteUrl={pkmn.spriteUrl}
                name={pkmn.name}
                className="h-7 w-7 object-contain"
                onClick={onSpriteClick}
              />
            ))
          ) : (
            <span className="text-xs text-muted-foreground">&mdash;</span>
          )
        ) : (
          <span />
        )}
      </div>
    </div>
  );
});
