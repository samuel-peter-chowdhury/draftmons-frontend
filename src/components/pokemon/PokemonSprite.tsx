'use client';

import Image from 'next/image';

interface PokemonSpriteProps {
  pokemonId: number;
  spriteUrl: string | null | undefined;
  name: string;
  className?: string;
  /** When true, clicking the sprite will not trigger onClick */
  disableClick?: boolean;
  /** Called when the sprite is clicked (unless disableClick is true) */
  onClick?: (pokemonId: number) => void;
}

/**
 * Reusable Pokemon sprite component that displays a Pokemon image
 * and calls onClick when clicked.
 */
export function PokemonSprite({
  pokemonId,
  spriteUrl,
  name,
  className = 'h-16 w-16 object-contain',
  disableClick = false,
  onClick,
}: PokemonSpriteProps) {
  if (!spriteUrl) {
    return <div className={className} />;
  }

  if (disableClick || !onClick) {
    return <Image src={spriteUrl} alt={name} width={96} height={96} unoptimized className={className} />;
  }

  return (
    <Image
      src={spriteUrl}
      alt={name}
      width={96}
      height={96}
      unoptimized
      className={`${className} cursor-pointer transition-transform hover:scale-110`}
      onClick={() => onClick(pokemonId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(pokemonId);
        }
      }}
      aria-label={`View ${name} details`}
    />
  );
}
