import { memo, useMemo } from 'react';
import { ErrorAlert, Spinner } from '@/components';
import { Badge } from '@/components/ui/badge';
import { POKEMON_TYPE_ORDER } from '@/lib/pokemon';
import { MoveCategory } from '@/types';
import type { PokemonInput } from '@/types';
import type { CoverageRow } from '../constants';
import { MoveSpritesRow } from './MoveSpritesRow';

export const CoverageMovesContent = memo(function CoverageMovesContent({
  teamAName,
  teamBName,
  teamAPokemon,
  teamBPokemon,
  teamASelected,
  teamBSelected,
  loading,
  error,
  onSpriteClick,
}: {
  teamAName: string;
  teamBName: string;
  teamAPokemon: PokemonInput[];
  teamBPokemon: PokemonInput[];
  teamASelected: boolean;
  teamBSelected: boolean;
  loading: boolean;
  error: string | null;
  onSpriteClick: (pokemonId: number) => void;
}) {
  const rows = useMemo<CoverageRow[]>(() => {
    // Build map: typeName -> { typeColor, teamAPokemon set, teamBPokemon set }
    const typeMap = new Map<
      string,
      {
        typeColor: string;
        teamAIds: Set<number>;
        teamBIds: Set<number>;
        teamA: PokemonInput[];
        teamB: PokemonInput[];
      }
    >();

    // Initialize all 18 types
    for (const typeName of POKEMON_TYPE_ORDER) {
      typeMap.set(typeName, {
        typeColor: '#888',
        teamAIds: new Set(),
        teamBIds: new Set(),
        teamA: [],
        teamB: [],
      });
    }

    const processTeam = (pokemon: PokemonInput[], team: 'a' | 'b') => {
      for (const pkmn of pokemon) {
        if (!pkmn.moves) continue;
        for (const move of pkmn.moves) {
          if (move.category === MoveCategory.STATUS) continue;
          const typeName = move.pokemonType?.name?.toLowerCase();
          if (!typeName || !typeMap.has(typeName)) continue;
          const entry = typeMap.get(typeName)!;
          // Update color from move data
          if (move.pokemonType?.color) {
            entry.typeColor = move.pokemonType.color;
          }
          const ids = team === 'a' ? entry.teamAIds : entry.teamBIds;
          const arr = team === 'a' ? entry.teamA : entry.teamB;
          if (!ids.has(pkmn.id)) {
            ids.add(pkmn.id);
            arr.push(pkmn);
          }
        }
      }
    };

    processTeam(teamAPokemon, 'a');
    processTeam(teamBPokemon, 'b');

    // Also try to get type colors from typeEffectiveness data as fallback
    const allPokemon = [...teamAPokemon, ...teamBPokemon];
    for (const pkmn of allPokemon) {
      if (pkmn.typeEffectiveness) {
        for (const te of pkmn.typeEffectiveness) {
          if (te.pokemonType?.name && te.pokemonType?.color) {
            const entry = typeMap.get(te.pokemonType.name.toLowerCase());
            if (entry && entry.typeColor === '#888') {
              entry.typeColor = te.pokemonType.color;
            }
          }
        }
      }
    }

    return POKEMON_TYPE_ORDER.map((typeName) => {
      const entry = typeMap.get(typeName)!;
      return {
        typeName,
        typeColor: entry.typeColor,
        teamAPokemon: entry.teamA,
        teamBPokemon: entry.teamB,
      };
    });
  }, [teamAPokemon, teamBPokemon]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <div className="space-y-0">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-2 pb-2">
        {teamASelected && (
          <span className="text-right text-sm font-semibold">{teamAName}</span>
        )}
        {!teamASelected && <span />}
        <span className="w-40 text-center text-xs font-medium uppercase text-muted-foreground">
          Type
        </span>
        {teamBSelected && (
          <span className="text-left text-sm font-semibold">{teamBName}</span>
        )}
        {!teamBSelected && <span />}
      </div>

      {/* Type rows */}
      {rows.map(({ typeName, typeColor, teamAPokemon: rowTeamA, teamBPokemon: rowTeamB }) => (
        <MoveSpritesRow
          key={typeName}
          teamAPokemon={rowTeamA}
          teamBPokemon={rowTeamB}
          teamASelected={teamASelected}
          teamBSelected={teamBSelected}
          onSpriteClick={onSpriteClick}
          badge={
            <Badge
              className="whitespace-nowrap capitalize"
              style={{
                backgroundColor: typeColor,
                color: '#fff',
                border: 'none',
              }}
            >
              {typeName}
            </Badge>
          }
        />
      ))}
    </div>
  );
});
