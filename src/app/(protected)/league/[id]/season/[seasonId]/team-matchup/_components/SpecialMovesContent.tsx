import { memo, useMemo } from 'react';
import { ErrorAlert, Spinner, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components';
import { Badge } from '@/components/ui/badge';
import { capitalizeFirst } from '@/lib/utils';
import type { PokemonInput } from '@/types';
import type { SpecialMoveGroup, SpecialMoveRow } from '../constants';
import { MoveSpritesRow } from './MoveSpritesRow';

export const SpecialMovesContent = memo(function SpecialMovesContent({
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
  const groups = useMemo<SpecialMoveGroup[]>(() => {
    const categoryMap = new Map<string, Map<number, SpecialMoveRow>>();

    const processTeam = (pokemon: PokemonInput[], team: 'a' | 'b') => {
      for (const pkmn of pokemon) {
        if (!pkmn.moves) continue;
        for (const move of pkmn.moves) {
          if (!move.specialMoveCategories?.length) continue;
          for (const smc of move.specialMoveCategories) {
            if (!categoryMap.has(smc.name)) {
              categoryMap.set(smc.name, new Map());
            }
            const moveMap = categoryMap.get(smc.name)!;
            if (!moveMap.has(move.id)) {
              moveMap.set(move.id, { move, teamAPokemon: [], teamBPokemon: [] });
            }
            const row = moveMap.get(move.id)!;
            const arr = team === 'a' ? row.teamAPokemon : row.teamBPokemon;
            if (!arr.some((p) => p.id === pkmn.id)) {
              arr.push(pkmn);
            }
          }
        }
      }
    };

    processTeam(teamAPokemon, 'a');
    processTeam(teamBPokemon, 'b');

    return Array.from(categoryMap.entries())
      .map(([categoryName, moveMap]) => ({
        categoryName,
        rows: Array.from(moveMap.values()).sort((a, b) =>
          a.move.name.localeCompare(b.move.name),
        ),
      }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
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

  if (groups.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No special moves found for the selected team(s).
      </p>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-0">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-2 pb-2">
          {teamASelected && (
            <span className="text-right text-sm font-semibold">{teamAName}</span>
          )}
          {!teamASelected && <span />}
          <span className="w-40 text-center text-xs font-medium uppercase text-muted-foreground">
            Move
          </span>
          {teamBSelected && (
            <span className="text-left text-sm font-semibold">{teamBName}</span>
          )}
          {!teamBSelected && <span />}
        </div>

        {/* Category groups */}
        {groups.map((group) => (
          <div key={group.categoryName} className="mb-2">
            {/* Category header */}
            <div className="border-b border-border px-2 py-2">
              <h4 className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {group.categoryName}
              </h4>
            </div>

            {/* Move rows */}
            <div className="space-y-0">
              {group.rows.map(({ move, teamAPokemon: rowTeamA, teamBPokemon: rowTeamB }) => (
                <MoveSpritesRow
                  key={move.id}
                  teamAPokemon={rowTeamA}
                  teamBPokemon={rowTeamB}
                  teamASelected={teamASelected}
                  teamBSelected={teamBSelected}
                  onSpriteClick={onSpriteClick}
                  badge={
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Badge
                            className="cursor-help whitespace-nowrap capitalize"
                            style={{
                              backgroundColor: move.pokemonType?.color ?? '#888',
                              color: '#fff',
                              border: 'none',
                            }}
                          >
                            {move.name}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-1 text-xs">
                          <p className="font-medium capitalize">
                            {move.pokemonType?.name} &middot; {capitalizeFirst(move.category)}
                          </p>
                          {move.power > 0 && <p>Power: {move.power}</p>}
                          {move.accuracy > 0 && <p>Accuracy: {move.accuracy}</p>}
                          <p>PP: {move.pp}</p>
                          {move.description && (
                            <p className="first-letter:capitalize">{move.description}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
});
