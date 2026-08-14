import { memo, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ErrorAlert, Spinner } from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { getStatColor } from '@/lib/pokemon';
import { cn } from '@/lib/utils';
import type { StatTablePokemon } from './constants';
import type { StatSortColumn } from './derive';

/** The base-stat columns — always-populated numeric fields on `PokemonInput`. */
type StatFieldColumn =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'specialAttack'
  | 'specialDefense'
  | 'speed'
  | 'baseStatTotal';

/** The seven colored base-stat columns, in display order. */
const STAT_COLUMNS: { column: StatFieldColumn; label: string }[] = [
  { column: 'hp', label: 'HP' },
  { column: 'attack', label: 'Atk' },
  { column: 'defense', label: 'Def' },
  { column: 'specialAttack', label: 'Sp.Atk' },
  { column: 'specialDefense', label: 'Sp.Def' },
  { column: 'speed', label: 'Spd' },
  { column: 'baseStatTotal', label: 'BST' },
];

/**
 * Sprite · Name · seven base stats · Pts. Kept narrow (and narrower than
 * `SpeedTierColumn`'s equivalent) so all eight numeric columns fit inside one
 * side of the two-column comparison layout without horizontal scrolling.
 */
const GRID_COLS = `40px minmax(72px, 1fr) ${Array(8).fill('48px').join(' ')}`;

/**
 * `getStatColor`'s gradient is calibrated to a single stat's 0–255 range, so a
 * `baseStatTotal` fed in raw would peg every Pokemon at the top of the scale.
 * Dividing by the six contributing stats maps a BST back onto that same range
 * (i.e. it colors by average stat) — the *displayed* number stays undivided.
 */
function statColorFor(column: StatFieldColumn, value: number): string {
  return getStatColor(column === 'baseStatTotal' ? value / 6 : value);
}

function SortableHeader({
  column,
  sortBy,
  sortOrder,
  onSort,
  align = 'right',
  children,
}: {
  column: StatSortColumn;
  sortBy: StatSortColumn;
  sortOrder: 'ASC' | 'DESC';
  onSort: (column: StatSortColumn) => void;
  /** Match the alignment of the cells below: numbers are right-aligned, names left. */
  align?: 'left' | 'right';
  children: React.ReactNode;
}) {
  const isActive = sortBy === column;
  return (
    <button
      onClick={() => onSort(column)}
      className={cn(
        'inline-flex items-center gap-0.5 font-medium transition-colors hover:text-foreground',
        align === 'right' ? 'ml-auto' : 'mr-auto',
      )}
    >
      {children}
      {isActive && sortOrder === 'ASC' && <ChevronUp className="h-3 w-3 shrink-0" />}
      {isActive && sortOrder === 'DESC' && <ChevronDown className="h-3 w-3 shrink-0" />}
    </button>
  );
}

export const StatTableColumn = memo(function StatTableColumn({
  teamName,
  pokemon,
  sortBy,
  sortOrder,
  onSort,
  loading,
  error,
  onSpriteClick,
  selectedIds,
  onToggleSelected,
  onResetSelection,
  isDefaultSelection,
}: {
  teamName: string;
  pokemon: StatTablePokemon[];
  sortBy: StatSortColumn;
  sortOrder: 'ASC' | 'DESC';
  onSort: (column: StatSortColumn) => void;
  loading: boolean;
  error: string | null;
  onSpriteClick: (pokemonId: number) => void;
  /** Ids counting toward the summary row. Omit to disable selection entirely. */
  selectedIds?: Set<number>;
  onToggleSelected?: (pokemonId: number) => void;
  onResetSelection?: () => void;
  /** Disables the Reset control when the selection already matches the default. */
  isDefaultSelection?: boolean;
}) {
  const selectionEnabled = selectedIds !== undefined && onToggleSelected !== undefined;

  /**
   * Computed from the selected subset (the whole roster when selection is
   * disabled), so the summary row is unaffected by sorting. Base stats are
   * averaged; points are summed instead, since a roster's point total is the
   * number that matters (and matches the Team Info tab's badge).
   */
  const summary = useMemo(() => {
    const source = selectionEnabled
      ? pokemon.filter(({ pokemon: p }) => selectedIds!.has(p.id))
      : pokemon;
    if (source.length === 0) return null;
    const means = new Map<StatFieldColumn, number>();
    for (const { column } of STAT_COLUMNS) {
      const sum = source.reduce((total, { pokemon: pkmn }) => total + pkmn[column], 0);
      means.set(column, Math.round(sum / source.length));
    }
    const scored = source.filter(({ pointValue }) => pointValue !== null);
    return {
      means,
      // null when nothing in the summary source has a point value, so we show
      // "—" rather than a misleading 0.
      pointTotal:
        scored.length > 0 ? scored.reduce((t, { pointValue }) => t + pointValue!, 0) : null,
    };
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

  return (
    <div className="flex-1 overflow-x-auto">
      <h3 className="mb-3 text-sm font-semibold">{teamName}</h3>
      <div className="min-w-fit">
        {/* Column headers */}
        <div
          className="grid items-center gap-x-1 px-1 pb-1 text-[11px] font-medium text-muted-foreground"
          style={{ gridTemplateColumns: GRID_COLS }}
        >
          <span />
          <SortableHeader
            column="name"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSort}
            align="left"
          >
            Name
          </SortableHeader>
          {STAT_COLUMNS.map(({ column, label }) => (
            <SortableHeader
              key={column}
              column={column}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
            >
              {label}
            </SortableHeader>
          ))}
          <SortableHeader column="pointValue" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>
            Pts
          </SortableHeader>
        </div>

        {/* Pokemon rows */}
        <div className="space-y-0">
          {pokemon.map(({ pokemon: pkmn, pointValue }) => {
            const isSelected = selectionEnabled && selectedIds!.has(pkmn.id);
            return (
              <div
                key={pkmn.id}
                className={cn(
                  'grid items-center gap-x-1 rounded-md p-1 transition-colors',
                  // Unselected rows keep today's look at full opacity — they're the
                  // candidates being evaluated and must stay just as readable.
                  isSelected ? 'bg-accent ring-1 ring-primary/30' : 'hover:bg-secondary/50',
                  // `ring-inset` is load-bearing: a row spans the full width of the
                  // `overflow-x-auto` wrapper, so an outward ring's left/right strokes
                  // land outside the scroll container and get clipped.
                  selectionEnabled &&
                    'cursor-pointer ring-inset focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                )}
                style={{ gridTemplateColumns: GRID_COLS }}
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
                    className="h-9 w-9 object-contain"
                    onClick={onSpriteClick}
                  />
                </span>
                <span className="truncate text-sm capitalize">{pkmn.name}</span>
                {STAT_COLUMNS.map(({ column }) => (
                  <span
                    key={column}
                    className="text-right text-sm font-semibold"
                    style={{ color: statColorFor(column, pkmn[column]) }}
                  >
                    {pkmn[column]}
                  </span>
                ))}
                <span className="text-right text-sm text-muted-foreground">
                  {pointValue ?? '—'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Summary row: base stats averaged, points totalled */}
        <div
          className="mt-1 grid items-center gap-x-1 border-t border-border/[0.08] px-1 pt-1"
          style={{ gridTemplateColumns: GRID_COLS }}
        >
          <span />
          <span className="whitespace-nowrap text-[11px] font-semibold text-muted-foreground">
            {selectionEnabled ? `Avg / Total (${selectedIds!.size})` : 'Avg / Total'}
          </span>
          {STAT_COLUMNS.map(({ column }) => {
            // No summary source at all (nothing selected) — print "—" rather than
            // numbers the user didn't ask for.
            if (!summary) {
              return (
                <span
                  key={column}
                  className="text-right text-sm font-semibold text-muted-foreground"
                >
                  —
                </span>
              );
            }
            const avg = summary.means.get(column) ?? 0;
            return (
              <span
                key={column}
                className="text-right text-sm font-semibold"
                style={{ color: statColorFor(column, avg) }}
              >
                {avg}
              </span>
            );
          })}
          <span className="text-right text-sm font-semibold text-muted-foreground">
            {summary?.pointTotal ?? '—'}
          </span>
        </div>

        {/* Reset sits on its own line, aligned under the summary label. */}
        {selectionEnabled && onResetSelection && (
          <div
            className="grid items-center gap-x-1 px-1 pt-1"
            style={{ gridTemplateColumns: GRID_COLS }}
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
