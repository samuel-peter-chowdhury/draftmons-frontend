'use client';

import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { SeasonPokemonInput } from '@/types';
import { DraggablePokemonRow } from './DraggablePokemonRow';

export function TierColumn({
  pointValue,
  label,
  pokemon,
  onDelete,
  onEditCondition,
  isLast,
}: {
  pointValue: number;
  label: string;
  pokemon: SeasonPokemonInput[];
  onDelete: (sp: SeasonPokemonInput) => void;
  onEditCondition: (sp: SeasonPokemonInput) => void;
  isLast: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tier-${pointValue}`,
    data: { pointValue },
  });

  const sorted = useMemo(
    () => [...pokemon].sort((a, b) => (a.pokemon?.name ?? '').localeCompare(b.pokemon?.name ?? '')),
    [pokemon],
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-44 shrink-0',
        !isLast && 'border-r border-border',
        isOver && 'bg-accent/20',
      )}
    >
      {/* Header */}
      <div className="border-b border-border bg-secondary/30 px-3 py-1.5 text-center text-sm font-bold">
        {label}
      </div>

      {/* Pokemon rows */}
      <div className="min-h-[40px]">
        {sorted.map((sp) => {
          const isDrafted = (sp.seasonPokemonTeams?.length ?? 0) > 0;
          return (
            <DraggablePokemonRow
              key={sp.id}
              sp={sp}
              onDelete={onDelete}
              onEditCondition={onEditCondition}
              isDrafted={isDrafted}
            />
          );
        })}
        {sorted.length === 0 && (
          <div className="px-2 py-3 text-center text-[11px] text-muted-foreground">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}
