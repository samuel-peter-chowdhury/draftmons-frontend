'use client';

import { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
} from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import {
  calculateCustomSpeed,
  DEFAULT_COMPARISON_SPEED_INPUT,
  getStatColor,
  isDefaultCustomSpeedInput,
  solveOutspeed,
  SPEED_EV_MAX,
  SPEED_EV_STEP,
  SPEED_IV_MAX,
} from '@/lib/pokemon';
import { useCustomSpeedStore } from '@/stores';
import type { CustomSpeedInput, OutspeedOption, SpeedNature } from '@/lib/pokemon';
import type { SpeedTierPokemon } from './constants';

export type CalculatorSideKey = 'a' | 'b';

export interface SpeedCalculatorSide {
  label: string;
  /** Already sorted descending by base Speed. */
  pokemon: SpeedTierPokemon[];
  pointByPokemonId: Map<number, number>;
}

export interface SpeedCalculatorRequest {
  /** The column the user interacted with — decides which slot gets filled. */
  side: CalculatorSideKey;
  /** The Pokemon whose speed was clicked, or null when opened from the header. */
  pokemonId: number | null;
  /** Bumped on every open so a repeat open re-applies rather than being deduped. */
  nonce: number;
}

const NATURE_OPTIONS: { value: SpeedNature; label: string }[] = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
];

const STAGE_OPTIONS = [6, 5, 4, 3, 2, 1, -1, -2, -3, -4, -5, -6];

const OTHER_SIDE: Record<CalculatorSideKey, CalculatorSideKey> = { a: 'b', b: 'a' };

function toInt(raw: string, fallback: number): number {
  const n = Number(raw);
  return Number.isNaN(n) ? fallback : Math.round(n);
}

function clampInput(input: CustomSpeedInput): CustomSpeedInput {
  return {
    ...input,
    ev: Math.max(0, Math.min(SPEED_EV_MAX, input.ev)),
    iv: Math.max(0, Math.min(SPEED_IV_MAX, input.iv)),
  };
}

function speedOf(entry: SpeedTierPokemon, input: CustomSpeedInput): number {
  return calculateCustomSpeed(entry.pokemon.speed, input.ev, input.iv, input.nature, input.stage);
}

/**
 * The Pokemon a side leads with: highest point value, falling back to highest
 * base stat total. Sides without any point values (team builds outside a
 * scored season) tie at -1 across the board, so BST decides on its own.
 */
function leadPokemon(side: SpeedCalculatorSide): SpeedTierPokemon | null {
  if (side.pokemon.length === 0) return null;
  return side.pokemon.reduce((best, entry) => {
    const bestPoints = side.pointByPokemonId.get(best.pokemon.id) ?? -1;
    const entryPoints = side.pointByPokemonId.get(entry.pokemon.id) ?? -1;
    if (entryPoints !== bestPoints) return entryPoints > bestPoints ? entry : best;
    return entry.pokemon.baseStatTotal > best.pokemon.baseStatTotal ? entry : best;
  });
}

/**
 * The opposing Pokemon sitting closest below `targetSpeed` — the one a speed
 * investment is most likely to be aimed at. Falls back to the slowest on the
 * side when nothing is below, so the slot is never left empty.
 */
function closestSlowerPokemon(
  side: SpeedCalculatorSide,
  targetSpeed: number,
): SpeedTierPokemon | null {
  if (side.pokemon.length === 0) return null;
  // side.pokemon is descending by speed, so the first one under the bar is the
  // closest one under it.
  return (
    side.pokemon.find((entry) => entry.pokemon.speed < targetSpeed) ??
    side.pokemon[side.pokemon.length - 1]
  );
}

function SlotEditor({
  side,
  entry,
  input,
  onSelect,
  onInputChange,
}: {
  side: SpeedCalculatorSide;
  entry: SpeedTierPokemon | null;
  input: CustomSpeedInput;
  onSelect: (pokemonId: number | null) => void;
  onInputChange: (patch: Partial<CustomSpeedInput>) => void;
}) {
  const speed = entry ? speedOf(entry, input) : null;
  const fieldId = `speed-calc-${side.label.replace(/\W+/g, '-')}`;

  return (
    <div className="flex-1 space-y-2 rounded-xl border border-border/[0.08] bg-card/60 p-3">
      <p className="truncate text-xs font-medium text-muted-foreground">{side.label}</p>

      <div className="flex items-center gap-3">
        {entry ? (
          <PokemonSprite
            pokemonId={entry.pokemon.id}
            spriteUrl={entry.pokemon.spritePngUrl}
            name={entry.pokemon.name}
            className="h-12 w-12 shrink-0 object-contain"
          />
        ) : (
          <div className="h-12 w-12 shrink-0" />
        )}
        <span className="ml-auto flex items-baseline gap-2">
          {entry && (
            <span className="text-xs tabular-nums text-muted-foreground">
              Base {entry.pokemon.speed}
            </span>
          )}
          <span
            className="text-2xl font-semibold tabular-nums"
            style={{ color: speed === null ? undefined : getStatColor(speed) }}
          >
            {speed ?? '—'}
          </span>
        </span>
      </div>

      <Select
        value={entry?.pokemon.id ?? ''}
        onChange={(e) => onSelect(e.target.value === '' ? null : Number(e.target.value))}
        aria-label={`${side.label} Pokemon`}
        className="h-8 text-xs capitalize"
      >
        <option value="">Select a Pokemon...</option>
        {side.pokemon.map(({ pokemon }) => (
          <option key={pokemon.id} value={pokemon.id} className="capitalize">
            {pokemon.name}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`${fieldId}-ev`} className="text-[11px] text-muted-foreground">
            EVs
          </Label>
          <Input
            id={`${fieldId}-ev`}
            type="number"
            min={0}
            max={SPEED_EV_MAX}
            // Spinner and arrow keys move in the 4s that actually shift the
            // stat; typing any value is still allowed.
            step={SPEED_EV_STEP}
            value={input.ev}
            onChange={(e) => onInputChange({ ev: toInt(e.target.value, 0) })}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${fieldId}-iv`} className="text-[11px] text-muted-foreground">
            IVs
          </Label>
          <Input
            id={`${fieldId}-iv`}
            type="number"
            min={0}
            max={SPEED_IV_MAX}
            value={input.iv}
            onChange={(e) => onInputChange({ iv: toInt(e.target.value, 0) })}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${fieldId}-nature`} className="text-[11px] text-muted-foreground">
            Nature
          </Label>
          <Select
            id={`${fieldId}-nature`}
            value={input.nature}
            onChange={(e) => onInputChange({ nature: e.target.value as SpeedNature })}
            className="h-8 text-xs"
          >
            {NATURE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${fieldId}-stage`} className="text-[11px] text-muted-foreground">
            Stage
          </Label>
          <Select
            id={`${fieldId}-stage`}
            value={input.stage ?? ''}
            onChange={(e) =>
              onInputChange({ stage: e.target.value === '' ? null : Number(e.target.value) })
            }
            className="h-8 text-xs"
          >
            <option value="">None</option>
            {STAGE_OPTIONS.map((stage) => (
              <option key={stage} value={stage}>
                {stage > 0 ? `+${stage}` : stage}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}

const NATURE_LABEL: Record<SpeedNature, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
};

/** "Positive — 84 EV", annotated when it undercuts what the slot is spending. */
function OptionLine({
  option,
  currentInput,
}: {
  option: OutspeedOption;
  currentInput: CustomSpeedInput;
}) {
  const undercutsCurrent = option.nature === currentInput.nature && option.ev < currentInput.ev;
  return (
    <li className="flex flex-wrap items-baseline gap-x-1.5">
      <span className="text-muted-foreground">{NATURE_LABEL[option.nature]} nature</span>
      <span className="font-semibold text-primary">{option.ev} EV</span>
      {undercutsCurrent && (
        <span className="text-muted-foreground">(currently spending {currentInput.ev})</span>
      )}
    </li>
  );
}

/**
 * What it would take for one Pokemon to outrun the other: the bare EV cost at
 * each Speed nature worth running, falling back to a Choice Scarf only when no
 * bare spread gets there.
 */
function OutspeedLine({
  entry,
  input,
  opposingSpeed,
}: {
  entry: SpeedTierPokemon;
  input: CustomSpeedInput;
  opposingSpeed: number;
}) {
  const solution = solveOutspeed(
    entry.pokemon.speed,
    input.iv,
    input.stage,
    opposingSpeed,
    entry.pokemon.name,
  );

  return (
    <div className="space-y-0.5">
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="font-medium capitalize">{entry.pokemon.name}</span>
        <span className="text-muted-foreground">
          {solution.options.length > 0
            ? 'outspeeds with:'
            : `can't outspeed — caps at ${solution.maxSpeed}`}
        </span>
      </p>

      {solution.options.length > 0 && (
        <ul className="ml-3 space-y-0.5">
          {solution.options.map((option) => (
            <OptionLine key={option.nature} option={option} currentInput={input} />
          ))}
        </ul>
      )}

      {solution.options.length === 0 && !solution.canHoldScarf && (
        <p className="ml-3 text-muted-foreground">
          Megas are locked to their Mega Stone, so a Choice Scarf isn&apos;t an option.
        </p>
      )}

      {solution.options.length === 0 && solution.canHoldScarf && (
        <>
          {solution.scarfOptions.length > 0 ? (
            <>
              <p className="ml-3 text-muted-foreground">With a Choice Scarf:</p>
              <ul className="ml-6 space-y-0.5">
                {solution.scarfOptions.map((option) => (
                  <OptionLine key={option.nature} option={option} currentInput={input} />
                ))}
              </ul>
            </>
          ) : (
            <p className="ml-3 text-muted-foreground">
              Not even with a Choice Scarf — caps at {solution.maxScarfSpeed}.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function OutspeedSummary({
  entryA,
  inputA,
  entryB,
  inputB,
}: {
  entryA: SpeedTierPokemon;
  inputA: CustomSpeedInput;
  entryB: SpeedTierPokemon;
  inputB: CustomSpeedInput;
}) {
  const speedA = speedOf(entryA, inputA);
  const speedB = speedOf(entryB, inputB);
  const delta = Math.abs(speedA - speedB);
  const faster = speedA === speedB ? null : speedA > speedB ? entryA : entryB;

  return (
    <div className="space-y-1.5 rounded-xl border border-border/[0.08] bg-secondary/30 p-3 text-xs">
      <p className="text-sm">
        {faster === null ? (
          <span className="font-medium">Speed tie at {speedA}</span>
        ) : (
          <>
            <span className="font-medium capitalize">{faster.pokemon.name}</span>
            <span className="text-muted-foreground"> is faster by </span>
            <span className="font-semibold">{delta}</span>
          </>
        )}
      </p>
      <OutspeedLine entry={entryA} input={inputA} opposingSpeed={speedB} />
      <OutspeedLine entry={entryB} input={inputB} opposingSpeed={speedA} />
    </div>
  );
}

/**
 * Head-to-head speed calculator plus the persisted default behind the Speed
 * Tiers "Custom" column.
 *
 * Two independent scratch spreads sit at the top — one per side, fixed left to
 * right so the modal mirrors the table — and the persisted column default sits
 * below the divider. Only the latter reaches localStorage; the comparison
 * spreads are session scratch that lives as long as the page is mounted, so
 * closing the modal to glance at the table doesn't discard a setup.
 *
 * Both slots are auto-selected when the modal opens and never again: once it's
 * on screen, picking a Pokemon changes that slot alone. Re-aiming the opposite
 * slot mid-session reads as the modal fighting the user.
 */
export function SpeedCalculatorModal({
  request,
  onOpenChange,
  sideA,
  sideB,
}: {
  request: SpeedCalculatorRequest | null;
  onOpenChange: (open: boolean) => void;
  sideA: SpeedCalculatorSide | null;
  sideB: SpeedCalculatorSide | null;
}) {
  const columnInput = useCustomSpeedStore((s) => s.input);
  const setColumnInput = useCustomSpeedStore((s) => s.setInput);
  const resetColumnInput = useCustomSpeedStore((s) => s.reset);
  const hydrate = useCustomSpeedStore((s) => s.hydrate);

  const [selection, setSelection] = useState<Record<CalculatorSideKey, number | null>>({
    a: null,
    b: null,
  });
  const [inputs, setInputs] = useState<Record<CalculatorSideKey, CustomSpeedInput>>({
    a: DEFAULT_COMPARISON_SPEED_INPUT,
    b: DEFAULT_COMPARISON_SPEED_INPUT,
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const sides = useMemo(() => ({ a: sideA, b: sideB }), [sideA, sideB]);

  // Auto-selection happens here and nowhere else: opening the modal seeds both
  // slots, and from then on the dropdowns are entirely manual. A header open on
  // an already-seeded modal resumes the existing setup instead of re-seeding.
  const nonce = request?.nonce ?? null;
  useEffect(() => {
    if (nonce === null || !request) return;
    const driving = sides[request.side];
    const otherKey = OTHER_SIDE[request.side];
    const other = sides[otherKey];

    const drivingEntry =
      (request.pokemonId !== null
        ? driving?.pokemon.find((p) => p.pokemon.id === request.pokemonId)
        : null) ?? (initialized ? null : driving ? leadPokemon(driving) : null);

    if (!drivingEntry) return;

    const otherEntry = other ? closestSlowerPokemon(other, drivingEntry.pokemon.speed) : null;
    const next: Record<CalculatorSideKey, number | null> = { a: null, b: null };
    next[request.side] = drivingEntry.pokemon.id;
    next[otherKey] = otherEntry?.pokemon.id ?? null;
    setSelection(next);

    if (!initialized) {
      setInputs({ a: DEFAULT_COMPARISON_SPEED_INPUT, b: DEFAULT_COMPARISON_SPEED_INPUT });
      setInitialized(true);
    }
    // Only re-run per open request; `sides` is read as of that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  // A roster can change under us (team swapped, build edited). Drop selections
  // that no longer exist rather than rendering a stale sprite.
  useEffect(() => {
    setSelection((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of ['a', 'b'] as CalculatorSideKey[]) {
        const id = prev[key];
        if (id !== null && !sides[key]?.pokemon.some((p) => p.pokemon.id === id)) {
          next[key] = null;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [sides]);

  const entryA = sideA?.pokemon.find((p) => p.pokemon.id === selection.a) ?? null;
  const entryB = sideB?.pokemon.find((p) => p.pokemon.id === selection.b) ?? null;

  /** Changes only the slot that was touched — the other one is never re-aimed. */
  const handleSelect = (key: CalculatorSideKey, pokemonId: number | null) => {
    setSelection((prev) => ({ ...prev, [key]: pokemonId }));
  };

  const handleInputChange = (key: CalculatorSideKey, patch: Partial<CustomSpeedInput>) => {
    setInputs((prev) => ({ ...prev, [key]: clampInput({ ...prev[key], ...patch }) }));
  };

  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Speed Calculator</DialogTitle>
          <DialogDescription>
            Compare two Pokemon head to head. These spreads are scratch values — they don&apos;t
            change the table.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row">
          {sideA && (
            <SlotEditor
              side={sideA}
              entry={entryA}
              input={inputs.a}
              onSelect={(id) => handleSelect('a', id)}
              onInputChange={(patch) => handleInputChange('a', patch)}
            />
          )}
          {sideB && (
            <SlotEditor
              side={sideB}
              entry={entryB}
              input={inputs.b}
              onSelect={(id) => handleSelect('b', id)}
              onInputChange={(patch) => handleInputChange('b', patch)}
            />
          )}
        </div>

        {entryA && entryB ? (
          <OutspeedSummary entryA={entryA} inputA={inputs.a} entryB={entryB} inputB={inputs.b} />
        ) : (
          <p className="rounded-xl border border-border/[0.08] bg-secondary/30 p-3 text-xs text-muted-foreground">
            {sideA && sideB
              ? 'Select a Pokemon on each side to compare them.'
              : 'Select a second team to compare speeds head to head.'}
          </p>
        )}

        <div className="space-y-2 border-t border-border/[0.08] pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Custom column default</p>
              <p className="text-xs text-muted-foreground">
                Drives the Custom column for every Pokemon. Saved for next time.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={resetColumnInput}
              disabled={isDefaultCustomSpeedInput(columnInput)}
              className="shrink-0 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="column-default-ev" className="text-[11px] text-muted-foreground">
                EVs
              </Label>
              <Input
                id="column-default-ev"
                type="number"
                min={0}
                max={SPEED_EV_MAX}
                step={SPEED_EV_STEP}
                value={columnInput.ev}
                onChange={(e) => setColumnInput({ ev: toInt(e.target.value, 0) })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="column-default-iv" className="text-[11px] text-muted-foreground">
                IVs
              </Label>
              <Input
                id="column-default-iv"
                type="number"
                min={0}
                max={SPEED_IV_MAX}
                value={columnInput.iv}
                onChange={(e) => setColumnInput({ iv: toInt(e.target.value, 0) })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="column-default-nature" className="text-[11px] text-muted-foreground">
                Nature
              </Label>
              <Select
                id="column-default-nature"
                value={columnInput.nature}
                onChange={(e) => setColumnInput({ nature: e.target.value as SpeedNature })}
                className="h-8 text-xs"
              >
                {NATURE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="column-default-stage" className="text-[11px] text-muted-foreground">
                Stage
              </Label>
              <Select
                id="column-default-stage"
                value={columnInput.stage ?? ''}
                onChange={(e) =>
                  setColumnInput({ stage: e.target.value === '' ? null : Number(e.target.value) })
                }
                className="h-8 text-xs"
              >
                <option value="">None</option>
                {STAGE_OPTIONS.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage > 0 ? `+${stage}` : stage}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
