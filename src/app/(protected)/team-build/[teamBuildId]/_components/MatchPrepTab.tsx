'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import type { TeamBuildInput, TeamBuildSetInput } from '@/types';
import { TeamBuildSetEditor } from './TeamBuildSetEditor';

interface MatchPrepTabProps {
  build: TeamBuildInput;
  onChanged: () => void;
  onGoToDraftPrep: () => void;
}

export function MatchPrepTab({ build, onChanged, onGoToDraftPrep }: MatchPrepTabProps) {
  const [selected, setSelected] = useState<TeamBuildSetInput | null>(null);
  const sets = build.teamBuildSets ?? [];

  if (sets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No Pokémon in this build yet. Add Pokémon in Draft Prep first.
          </p>
          <button
            type="button"
            onClick={onGoToDraftPrep}
            className="text-sm text-primary hover:underline"
          >
            Go to Draft Prep
          </button>
        </CardContent>
      </Card>
    );
  }

  // Keep the selected set in sync with the latest build data after edits.
  const selectedFresh = selected ? (sets.find((s) => s.id === selected.id) ?? null) : null;

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {sets.map((set) => {
              const pkmn = set.pokemon;
              if (!pkmn) return null;
              return (
                <button
                  type="button"
                  key={set.id}
                  onClick={() => setSelected(set)}
                  className="flex flex-col items-center gap-1 rounded-md border border-border p-2 transition-colors hover:border-primary/50 hover:bg-secondary/40"
                >
                  <PokemonSprite
                    pokemonId={pkmn.id}
                    spriteUrl={pkmn.spriteUrl}
                    name={pkmn.name}
                    className="size-12 object-contain"
                    disableClick
                  />
                  <span className="text-center text-xs font-medium capitalize leading-tight">
                    {pkmn.name}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent aria-describedby={undefined} className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="capitalize">Edit Set</DialogTitle>
          </DialogHeader>
          {selectedFresh && (
            <TeamBuildSetEditor set={selectedFresh} build={build} onChanged={onChanged} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
