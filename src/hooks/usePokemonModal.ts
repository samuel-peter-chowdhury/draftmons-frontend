'use client';

import { useCallback, useState } from 'react';

interface PokemonModalState {
  pokemonId: number | null;
  seasonPokemonId: number | null;
  open: boolean;
  openModal: (pokemonId: number, seasonPokemonId?: number) => void;
  onOpenChange: (open: boolean) => void;
}

export function usePokemonModal(): PokemonModalState {
  const [pokemonId, setPokemonId] = useState<number | null>(null);
  const [seasonPokemonId, setSeasonPokemonId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const openModal = useCallback((pokemonId: number, seasonPokemonId?: number) => {
    setPokemonId(pokemonId);
    setSeasonPokemonId(seasonPokemonId ?? null);
    setOpen(true);
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    setOpen(open);
    if (!open) {
      setPokemonId(null);
      setSeasonPokemonId(null);
    }
  }, []);

  return { pokemonId, seasonPokemonId, open, openModal, onOpenChange };
}
