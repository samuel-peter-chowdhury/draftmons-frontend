'use client';

import { memo, useEffect } from 'react';
import {
  ErrorAlert,
  Spinner,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import {
  calculateCustomSpeed,
  describeCustomSpeedInput,
  getStatColor,
  isDefaultCustomSpeedInput,
} from '@/lib/pokemon';
import { cn } from '@/lib/utils';
import { useCustomSpeedStore } from '@/stores';
import type { SpeedTierPokemon } from './constants';

/**
 * Sprite · Name · Base · the three fixed tiers · the custom tier.
 *
 * The name column needs an explicit floor: `truncate` zeroes its min-content
 * width, so a bare `1fr` collapses to nothing when the row outgrows the space
 * available (as it does at narrow widths, where the container scrolls).
 */
const GRID_COLS = '48px minmax(100px, 1fr) 60px 60px 60px 60px 60px';

/**
 * Opens the shared custom-speed settings, and shows the spread currently in
 * effect on hover. Amber when that spread is non-default, since it persists
 * across sessions and would otherwise silently skew the column.
 */
function CustomHeader({ onOpen }: { onOpen: () => void }) {
  const input = useCustomSpeedStore((s) => s.input);
  const isDefault = isDefaultCustomSpeedInput(input);

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onOpen}
            className={cn(
              'ml-auto underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground',
              !isDefault && 'text-primary hover:text-primary',
            )}
          >
            Custom
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{describeCustomSpeedInput(input)}</p>
          <p className="text-xs text-muted-foreground">Click to change</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const SpeedTierColumn = memo(function SpeedTierColumn({
  teamName,
  pokemon,
  loading,
  error,
  onSpriteClick,
  onOpenCalculator,
}: {
  teamName: string;
  pokemon: SpeedTierPokemon[];
  loading: boolean;
  error: string | null;
  onSpriteClick: (pokemonId: number) => void;
  /**
   * Opens the shared speed calculator. `null` means the column header was used
   * (no specific Pokemon in mind); an id means that row's custom speed was
   * clicked. The owning page holds the modal, since it's the only level that
   * can see both sides.
   */
  onOpenCalculator: (pokemonId: number | null) => void;
}) {
  const customInput = useCustomSpeedStore((s) => s.input);
  const hydrate = useCustomSpeedStore((s) => s.hydrate);

  // Reading localStorage during render would desync the server markup; the
  // store no-ops on every call after the first, so both sides can ask.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
          className="grid items-center gap-x-2 px-2 pb-1 text-[11px] font-medium text-muted-foreground"
          style={{ gridTemplateColumns: GRID_COLS }}
        >
          <span />
          <span>Name</span>
          <span className="text-right">Base</span>
          <span className="text-right">252</span>
          <span className="text-right">252+</span>
          <span className="text-right">252+/+1</span>
          <CustomHeader onOpen={() => onOpenCalculator(null)} />
        </div>
        <div className="space-y-0">
          {pokemon.map(({ pokemon: pkmn, speedTiers }) => {
            const customSpeed = calculateCustomSpeed(
              pkmn.speed,
              customInput.ev,
              customInput.iv,
              customInput.nature,
              customInput.stage,
            );
            return (
              <div
                key={pkmn.id}
                className="grid items-center gap-x-2 rounded-md px-2 py-1 transition-colors hover:bg-secondary/50"
                style={{ gridTemplateColumns: GRID_COLS }}
              >
                <PokemonSprite
                  pokemonId={pkmn.id}
                  spriteUrl={pkmn.spritePngUrl}
                  name={pkmn.name}
                  className="h-10 w-10 object-contain"
                  onClick={onSpriteClick}
                />
                <span className="truncate text-sm capitalize">{pkmn.name}</span>
                <span
                  className="text-right text-sm font-semibold"
                  style={{ color: getStatColor(pkmn.speed) }}
                >
                  {pkmn.speed}
                </span>
                <span className="text-right text-sm text-muted-foreground">
                  {speedTiers.maxNeutral}
                </span>
                <span className="text-right text-sm text-muted-foreground">
                  {speedTiers.maxPositive}
                </span>
                <span className="text-right text-sm text-muted-foreground">
                  {speedTiers.maxPositivePlus1}
                </span>
                <button
                  onClick={() => onOpenCalculator(pkmn.id)}
                  aria-label={`Open speed calculator for ${pkmn.name}`}
                  className="text-right text-sm font-semibold underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current"
                  style={{ color: getStatColor(customSpeed) }}
                >
                  {customSpeed}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
