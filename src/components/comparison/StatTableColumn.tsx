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
}: {
  teamName: string;
  pokemon: StatTablePokemon[];
  sortBy: StatSortColumn;
  sortOrder: 'ASC' | 'DESC';
  onSort: (column: StatSortColumn) => void;
  loading: boolean;
  error: string | null;
  onSpriteClick: (pokemonId: number) => void;
}) {
  /**
   * Computed from the full roster, so the summary row is unaffected by sorting.
   * Base stats are averaged; points are summed instead, since a roster's point
   * total is the number that matters (and matches the Team Info tab's badge).
   */
  const summary = useMemo(() => {
    if (pokemon.length === 0) return null;
    const means = new Map<StatFieldColumn, number>();
    for (const { column } of STAT_COLUMNS) {
      const sum = pokemon.reduce((total, { pokemon: pkmn }) => total + pkmn[column], 0);
      means.set(column, Math.round(sum / pokemon.length));
    }
    const scored = pokemon.filter(({ pointValue }) => pointValue !== null);
    return {
      means,
      // null when nothing on this side has a point value, so we show "—" rather
      // than a misleading 0.
      pointTotal: scored.length > 0 ? scored.reduce((t, { pointValue }) => t + pointValue!, 0) : null,
    };
  }, [pokemon]);

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
          {pokemon.map(({ pokemon: pkmn, pointValue }) => (
            <div
              key={pkmn.id}
              className="grid items-center gap-x-1 rounded-md p-1 transition-colors hover:bg-secondary/50"
              style={{ gridTemplateColumns: GRID_COLS }}
            >
              <PokemonSprite
                pokemonId={pkmn.id}
                spriteUrl={pkmn.spritePngUrl}
                name={pkmn.name}
                className="h-9 w-9 object-contain"
                onClick={onSpriteClick}
              />
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
              <span className="text-right text-sm text-muted-foreground">{pointValue ?? '—'}</span>
            </div>
          ))}
        </div>

        {/* Summary row: base stats averaged, points totalled */}
        {summary && (
          <div
            className="mt-1 grid items-center gap-x-1 border-t border-border/[0.08] px-1 pt-1"
            style={{ gridTemplateColumns: GRID_COLS }}
          >
            <span />
            <span className="text-[11px] font-semibold text-muted-foreground">Avg / Total</span>
            {STAT_COLUMNS.map(({ column }) => {
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
              {summary.pointTotal ?? '—'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
