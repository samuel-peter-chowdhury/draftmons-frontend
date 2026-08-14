import { memo, useMemo } from 'react';
import { ErrorAlert, Spinner } from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import {
  getStatColor,
  POKEMON_TYPE_ORDER,
  TYPE_ABBREVIATIONS,
  formatEffectivenessValue,
  getEffectivenessColor,
  getEffectivenessScore,
} from '@/lib/pokemon';
import { cn } from '@/lib/utils';
import type { TypeEffPokemon, TypeColumnInfo } from './constants';

export const TypeEffectivenessColumn = memo(function TypeEffectivenessColumn({
  teamName,
  pokemon,
  loading,
  error,
  onSpriteClick,
  selectedIds,
  onToggleSelected,
  onResetSelection,
  isDefaultSelection,
}: {
  teamName: string;
  pokemon: TypeEffPokemon[];
  loading: boolean;
  error: string | null;
  onSpriteClick: (pokemonId: number) => void;
  /** Ids counting toward the Total row. Omit to disable selection entirely. */
  selectedIds?: Set<number>;
  onToggleSelected?: (pokemonId: number) => void;
  onResetSelection?: () => void;
  /** Disables the Reset control when the selection already matches the default. */
  isDefaultSelection?: boolean;
}) {
  const selectionEnabled = selectedIds !== undefined && onToggleSelected !== undefined;

  /**
   * Derived from the *full* roster: every Pokemon still gets a row regardless of
   * selection, so the columns have to cover all of them. Only the Total narrows.
   */
  const typeColumns = useMemo<TypeColumnInfo[]>(() => {
    const typeColorMap = new Map<string, string>();
    for (const { pokemon: pkmn } of pokemon) {
      if (pkmn.typeEffectiveness) {
        for (const te of pkmn.typeEffectiveness) {
          if (te.pokemonType && !typeColorMap.has(te.pokemonType.name.toLowerCase())) {
            typeColorMap.set(te.pokemonType.name.toLowerCase(), te.pokemonType.color);
          }
        }
      }
    }
    return POKEMON_TYPE_ORDER.filter((name) => typeColorMap.has(name)).map((name) => ({
      name,
      abbreviation: TYPE_ABBREVIATIONS[name] ?? name.slice(0, 3).toUpperCase(),
      color: typeColorMap.get(name) ?? '#888',
    }));
  }, [pokemon]);

  const cumulativeRow = useMemo(() => {
    const sums = new Map<string, number>();
    for (const typeName of POKEMON_TYPE_ORDER) {
      sums.set(typeName, 0);
    }
    const source = selectionEnabled
      ? pokemon.filter(({ pokemon: p }) => selectedIds!.has(p.id))
      : pokemon;
    for (const { effectivenessMap } of source) {
      for (const [typeName, value] of effectivenessMap.entries()) {
        const current = sums.get(typeName) ?? 0;
        sums.set(typeName, current + getEffectivenessScore(value));
      }
    }
    return sums;
  }, [pokemon, selectionEnabled, selectedIds]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1">
        <ErrorAlert message={error} />
      </div>
    );
  }

  if (pokemon.length === 0) {
    return (
      <div className="flex-1">
        <p className="py-6 text-center text-sm text-muted-foreground">No Pokemon found.</p>
      </div>
    );
  }

  const gridCols = `40px minmax(72px, 1fr) 36px ${typeColumns.map(() => '32px').join(' ')}`;

  return (
    <div className="flex-1 overflow-x-auto">
      <h3 className="mb-3 text-sm font-semibold">{teamName}</h3>
      <div className="min-w-fit">
        {/* Header row */}
        <div
          className="grid items-center gap-x-0.5 px-1 pb-1"
          style={{ gridTemplateColumns: gridCols }}
        >
          <span />
          <span className="text-[11px] font-medium text-muted-foreground">Name</span>
          <span className="text-center text-[11px] font-medium text-muted-foreground">SPE</span>
          {typeColumns.map((tc) => (
            <span
              key={tc.name}
              className="text-center text-[9px] font-bold uppercase"
              style={{ color: tc.color }}
              title={tc.name}
            >
              {tc.abbreviation}
            </span>
          ))}
        </div>

        {/* Pokemon rows */}
        <div className="space-y-0">
          {pokemon.map(({ pokemon: pkmn, effectivenessMap }) => {
            const isSelected = selectionEnabled && selectedIds!.has(pkmn.id);
            return (
              <div
                key={pkmn.id}
                className={cn(
                  'grid items-center gap-x-0.5 rounded-md px-1 py-0.5 transition-colors',
                  // Unselected rows keep today's look at full opacity — they're the
                  // candidates being evaluated and must stay just as readable.
                  isSelected ? 'bg-accent ring-1 ring-primary/30' : 'hover:bg-secondary/50',
                  // `ring-inset` is load-bearing: a row spans the full width of the
                  // `overflow-x-auto` wrapper, so an outward ring's left/right strokes
                  // land outside the scroll container and get clipped.
                  selectionEnabled &&
                    'cursor-pointer ring-inset focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                )}
                style={{ gridTemplateColumns: gridCols }}
                {...(selectionEnabled
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      'aria-pressed': isSelected,
                      'aria-label': `Toggle ${pkmn.name} in totals`,
                      onClick: () => onToggleSelected!(pkmn.id),
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onToggleSelected!(pkmn.id);
                        }
                      },
                    }
                  : {})}
              >
                {/* The sprite opens the Pokemon modal; it must never toggle the row. */}
                <span
                  className="flex items-center"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
                  }}
                >
                  <PokemonSprite
                    pokemonId={pkmn.id}
                    spriteUrl={pkmn.spritePngUrl}
                    name={pkmn.name}
                    className="h-8 w-8 object-contain"
                    onClick={onSpriteClick}
                  />
                </span>
                <span className="truncate text-xs capitalize">{pkmn.name}</span>
                <span
                  className="text-center text-xs font-semibold"
                  style={{ color: getStatColor(pkmn.speed) }}
                >
                  {pkmn.speed}
                </span>
                {typeColumns.map((tc) => {
                  const value = effectivenessMap.get(tc.name) ?? 1;
                  return (
                    <span
                      key={tc.name}
                      className="flex h-6 items-center justify-center rounded-sm text-[11px] font-semibold"
                      style={{ backgroundColor: getEffectivenessColor(value) }}
                    >
                      {formatEffectivenessValue(value)}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Cumulative summary row */}
        <div
          className="mt-1 grid items-center gap-x-0.5 border-t border-border px-1 pt-1"
          style={{ gridTemplateColumns: gridCols }}
        >
          <span />
          <span className="whitespace-nowrap text-[11px] font-semibold text-muted-foreground">
            {selectionEnabled ? `Total (${selectedIds!.size})` : 'Total'}
          </span>
          <span />
          {typeColumns.map((tc) => {
            const cumValue = cumulativeRow.get(tc.name) ?? 0;
            const bgColor =
              cumValue > 0
                ? 'rgba(56, 142, 80, 0.5)'
                : cumValue < 0
                  ? 'rgba(190, 50, 50, 0.5)'
                  : 'transparent';
            return (
              <span
                key={tc.name}
                className="flex h-6 items-center justify-center rounded-sm text-[11px] font-bold"
                style={{ backgroundColor: bgColor }}
              >
                {cumValue !== 0 ? (cumValue > 0 ? `+${cumValue}` : cumValue) : ''}
              </span>
            );
          })}
        </div>

        {/* Reset sits on its own line, aligned under the Total label. */}
        {selectionEnabled && onResetSelection && (
          <div
            className="grid items-center gap-x-0.5 px-1 pt-1"
            style={{ gridTemplateColumns: gridCols }}
          >
            <span />
            <button
              onClick={onResetSelection}
              disabled={isDefaultSelection}
              className="mr-auto text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-default disabled:opacity-40"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
