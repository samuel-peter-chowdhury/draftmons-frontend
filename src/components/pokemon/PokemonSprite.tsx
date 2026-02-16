'use client';

import { useState } from 'react';
import { PokemonModal } from './PokemonModal';

interface PokemonSpriteProps {
  pokemonId: number;
  spriteUrl: string | null | undefined;
  name: string;
  className?: string;
  /** When true, clicking the sprite will not open the modal */
  disableClick?: boolean;
}

/**
 * Reusable Pokemon sprite component that displays a Pokemon image
 * and opens a modal with full Pokemon details when clicked.
 */
export function PokemonSprite({
  pokemonId,
  spriteUrl,
  name,
  className = 'h-16 w-16 object-contain',
  disableClick = false,
}: PokemonSpriteProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!spriteUrl) {
    return <div className={className} />;
  }

  if (disableClick) {
    return <img src={spriteUrl} alt={name} className={className} />;
  }

  return (
    <>
      <img
        src={spriteUrl}
        alt={name}
        className={`${className} cursor-pointer transition-transform hover:scale-110`}
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setModalOpen(true);
          }
        }}
        aria-label={`View ${name} details`}
      />
      <PokemonModal pokemonId={pokemonId} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
