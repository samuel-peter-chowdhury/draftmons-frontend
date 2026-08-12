'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components';

// components 
import PokemonSearchPanel from './PokemonSearchPanel';

type PokemonPoolPokemon = {
  pokemonId: number | null;
  name: string;
  item: string;
  ability: string;
  nature: string;
  moves: string[];               // length 4
  spriteUrl: string;
  types: {
    id: number;
    name: string;
    color: string;
  }[];
};

type PokemonPoolProps = {
  drafted: PokemonPoolPokemon[];
  selectedSlot: number;
  onPickPokemon: (pokemonId: number|null) => void;
  className?: string;
};



export default function PokemonPool({
  drafted,
  selectedSlot,
  onPickPokemon,
  className,
}: PokemonPoolProps) {
  // component states
  const [query, setQuery] = useState('');
  const [searchedMons, seSearcedMons] = useState<PokemonPoolPokemon[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drafted;
    return drafted.filter((p) => p.name.toLowerCase().includes(q));
  }, [drafted, query]);

  const addPokemonToSearchedHistory = (p: any) => {
    console.log('addPokemonToSearchedHistory', p);

  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center justify-between">
          <span>Pokémon Pool</span>
          <span className="text-sm font-normal text-muted-foreground">
            Slot {selectedSlot + 1}
          </span>
        </CardTitle>

        {/* <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drafted Pokémon..."
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div> */}
      </CardHeader>

      <CardContent>
        <div className="mt-3 mb-2 border-t border-border text-xs text-muted-foreground">
          drafted mons
        </div>
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No Pokémon found.
          </div>
        ) : (
            <div className="flex flex-wrap gap-2">
              {filtered.map((p) => {
                const disabled = p.pokemonId == null;

                return (
                  <button
                    key={p.pokemonId ?? p.name}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (p.pokemonId != null) onPickPokemon(p.pokemonId);
                    }}
                    className={[
                      // bubble shape
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
                      // theme colors (shadcn tokens)
                      'border-border bg-background hover:bg-accent hover:text-accent-foreground',
                      // interaction
                      'transition-colors',
                      // disabled state
                      disabled ? 'opacity-50 cursor-not-allowed hover:bg-background hover:text-foreground' : '',
                    ].join(' ')}
                  >
                    {/* sprite */}
                    {p.spriteUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.spriteUrl} alt={p.name} className="h-5 w-5" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-muted" />
                    )}

                    <span className="font-medium">{p.name}</span>

                    {/* types as tiny pills (optional) */}
                    {p.types?.length ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        {p.types.map((t) => t.name).join('/')}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
        )}

        {/* Later: search-any section goes here */}
        {/* <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          searched mons
        </div>
        <PokemonSearchPanel
          onSelect={addPokemonToSearchedHistory}
        >
      
        </PokemonSearchPanel> */}
      </CardContent>
    </Card>
  );
}