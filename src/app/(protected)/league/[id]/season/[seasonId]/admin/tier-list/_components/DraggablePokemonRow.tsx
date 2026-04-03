'use client';

import { useDraggable } from '@dnd-kit/core';
import { X, FileText } from 'lucide-react';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { cn } from '@/lib/utils';
import type { SeasonPokemonInput } from '@/types';

export function DraggablePokemonRow({
  sp,
  onDelete,
  onEditCondition,
  isDrafted,
}: {
  sp: SeasonPokemonInput;
  onDelete: (sp: SeasonPokemonInput) => void;
  onEditCondition: (sp: SeasonPokemonInput) => void;
  isDrafted: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sp-${sp.id}`,
    data: { seasonPokemon: sp },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const pkmn = sp.pokemon;
  if (!pkmn) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'grid grid-cols-[36px_1fr_28px_28px] items-center px-2 py-0.5 transition-colors hover:bg-secondary/50',
        isDragging && 'opacity-30',
      )}
    >
      <div
        {...listeners}
        {...attributes}
        className="col-span-2 flex cursor-grab items-center active:cursor-grabbing"
      >
        <PokemonSprite
          pokemonId={pkmn.id}
          spriteUrl={pkmn.spriteUrl}
          name={pkmn.name}
          className="h-8 w-8 shrink-0 object-contain"
          disableClick
        />
        <span className="truncate pr-1 text-xs capitalize">{pkmn.name}</span>
      </div>
      <button
        className="flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => onEditCondition(sp)}
        aria-label={`Edit condition for ${pkmn.name}`}
      >
        <FileText className="h-3.5 w-3.5" />
      </button>
      <button
        className={cn(
          'flex items-center justify-center text-muted-foreground transition-colors hover:text-destructive',
          isDrafted && 'opacity-50',
        )}
        onClick={() => onDelete(sp)}
        aria-label={`Remove ${pkmn.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
