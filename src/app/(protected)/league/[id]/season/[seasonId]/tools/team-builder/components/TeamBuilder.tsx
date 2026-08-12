'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@/components';
import { cn } from '@/lib/utils';
import PokemonSlotSearch from './PokemonSlotSearch';
import { parseShowdownTeam, teamToShowdown } from '../utils/TeamsetParser';
import { StatsDisplay } from './StatsDisplay';
import { StatsModal } from './StatsModal';
import { MovesAbilitiesEditor } from './MovesAbilitiesEditor';

type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

type EvIv = Record<StatKey, number>;

type PokemonTypeTag = {
  id: number;
  name: string;
  color?: string;
};

type Ability = {
  id: number;
  name: string;
  description?: string;
};

type PokemonApi = {
  id: number;
  name: string;
  spriteUrl?: string;
  sprite?: string;
  hp?: number;
  attack?: number;
  defense?: number;
  specialAttack?: number;
  specialDefense?: number;
  speed?: number;
  pokemonTypes?: Array<{ id: number; name: string; color?: string }>;
  abilities?: Ability[];
};

type PokemonPoolPokemon = {
  pokemonId: number;
  name: string;
  spriteUrl?: string;
  types: PokemonTypeTag[];
  hp?: number;
  attack?: number;
  defense?: number;
  specialAttack?: number;
  specialDefense?: number;
  speed?: number;
  abilities?: Ability[];
};

type PokemonSet = {
  pokemonId: number | null;
  name: string;
  nickName: string;
  spriteUrl?: string;
  types: PokemonTypeTag[];
  teraType: PokemonTypeTag | null;
  isShiny: boolean;

  item: string;
  ability: string;
  nature: string;
  moves: [string, string, string, string];

  evs: EvIv;
  ivs?: EvIv;

  // Store base stats for display
  baseStats?: Record<StatKey, number>;
  abilities?: Ability[];
};

type EditorMode =
  | { kind: 'pokemon' }
  | { kind: 'item' }
  | { kind: 'ability'}
  | { kind: 'moves'}
  | { kind: 'stats' };

const EMPTY_EVS: EvIv = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
const DEFAULT_IVS: EvIv = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

// Common natures in Pokemon
const NATURES = [
  'Adamant',
  'Bold',
  'Brave',
  'Calm',
  'Careful',
  'Gentle',
  'Hardy',
  'Hasty',
  'Impish',
  'Jolly',
  'Lax',
  'Lonely',
  'Mild',
  'Modest',
  'Naive',
  'Naughty',
  'Quiet',
  'Quirky',
  'Rash',
  'Relaxed',
  'Sassy',
  'Serious',
  'Timid',
];

function makeEmptySet(): PokemonSet {
  return {
    pokemonId: null,
    name: 'Empty',
    nickName: '',
    spriteUrl: undefined,
    types: [],
    teraType: null,
    isShiny: false,

    item: '',
    ability: '',
    nature: '',
    moves: ['', '', '', ''],

    evs: { ...EMPTY_EVS },
    ivs: { ...DEFAULT_IVS },
    baseStats: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilities: [],
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TeamBuilder({
  initialPool,
}: {
  initialPool: PokemonPoolPokemon[];
}) {
  const [pool] = useState<PokemonPoolPokemon[]>(initialPool);
  const [team, setTeam] = useState<PokemonSet[]>(() =>
    Array.from({ length: 6 }, makeEmptySet)
  );

  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [editor, setEditor] = useState<EditorMode>({ kind: 'pokemon' });

  const selected = team[selectedSlot];

  function updateSelected(patch: Partial<PokemonSet>) {
    setTeam((prev) => {
      const next = prev.slice();
      const cur = next[selectedSlot];
      next[selectedSlot] = { ...cur, ...patch };
      return next;
    });
  }

  function assignPokemonToSlot(p: PokemonApi) {
    const types: PokemonTypeTag[] = (p.pokemonTypes ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
    }));

    const baseStats: Record<StatKey, number> = {
      hp: p.hp || 0,
      atk: p.attack || 0,
      def: p.defense || 0,
      spa: p.specialAttack || 0,
      spd: p.specialDefense || 0,
      spe: p.speed || 0,
    };

    const newSet: PokemonSet = {
      pokemonId: p.id,
      name: p.name,
      nickName: '',
      spriteUrl: p.spriteUrl || p.sprite || undefined,
      types,
      teraType: null,
      isShiny: false,

      item: '',
      ability: p.abilities?.[0]?.name ?? '',
      nature: '',
      moves: ['', '', '', ''],

      evs: { ...EMPTY_EVS },
      ivs: { ...DEFAULT_IVS },
      baseStats,
      abilities: p.abilities || [],
    };

    setTeam((prev) => {
      const next = prev.slice();
      next[selectedSlot] = newSet;
      return next;
    });

    setEditor({ kind: 'item' });
  }

  function handleExportTeamSet() {
    const showdownText = teamToShowdown(team);
    navigator.clipboard.writeText(showdownText).then(() => {
      alert('Team exported to clipboard!');
    }).catch(() => {
      prompt('Copy your team:', showdownText);
    });
  }

  function handleImportTeamSet() {
    const input = prompt('Paste your Pokémon Showdown team:');
    if (!input) return;

    const parsedSets = parseShowdownTeam(input);
    const newTeam: PokemonSet[] = [];

    for (let i = 0; i < 6; i++) {
      if (i < parsedSets.length && parsedSets[i].name) {
        const parsed = parsedSets[i];
        const poolPokemon = pool.find(
          (p) => p.name.toLowerCase() === parsed.name.toLowerCase()
        );

        const baseStats: Record<StatKey, number> = {
          hp: poolPokemon?.hp || 0,
          atk: poolPokemon?.attack || 0,
          def: poolPokemon?.defense || 0,
          spa: poolPokemon?.specialAttack || 0,
          spd: poolPokemon?.specialDefense || 0,
          spe: poolPokemon?.speed || 0,
        };

        const set: PokemonSet = {
          pokemonId: poolPokemon?.pokemonId ?? null,
          name: parsed.name || 'Unknown',
          nickName: parsed.nickName || '',
          spriteUrl: poolPokemon?.spriteUrl,
          types: poolPokemon?.types || [],
          teraType: parsed.teraType || null,
          isShiny: parsed.isShiny || false,

          item: parsed.item || '',
          ability: parsed.ability || '',
          nature: parsed.nature || '',
          moves: parsed.moves || ['', '', '', ''],

          evs: parsed.evs || { ...EMPTY_EVS },
          ivs: parsed.ivs || { ...DEFAULT_IVS },
          baseStats,
          abilities: poolPokemon?.abilities || [],
        };

        newTeam.push(set);
      } else {
        newTeam.push(makeEmptySet());
      }
    }

    setTeam(newTeam);
    setSelectedSlot(0);
    setEditor({ kind: 'pokemon' });
    alert('Team imported successfully!');
  }

  function SlotChip({
    slotIndex,
    slot,
  }: {
    slotIndex: number;
    slot: PokemonSet;
  }) {
    const isActive = slotIndex === selectedSlot;
    return (
      <button
        type="button"
        onClick={() => {
          setSelectedSlot(slotIndex);
          setEditor({ kind: 'pokemon' });
        }}
        className={cn(
          'flex w-full flex-col items-center gap-2 rounded-lg p-2 transition-colors',
          'hover:bg-accent/50',
          isActive ? 'bg-accent text-accent-foreground ring-2 ring-accent' : 'bg-background/50'
        )}
      >
        {slot.spriteUrl ? (
          <img src={slot.spriteUrl} alt={slot.name} className="h-12 w-12" />
        ) : (
          <div className="h-12 w-12 rounded bg-muted" />
        )}
        <div className="text-center">
          <div className="text-xs font-medium leading-tight">{slot.name}</div>
          <div className="text-[10px] text-muted-foreground">
            #{slotIndex + 1}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="mx-auto w-full min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 lg:p-6">
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* Header Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Team Builder</CardTitle>
              <p className="text-xs text-muted-foreground">
                Slot {selectedSlot + 1} selected
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleImportTeamSet}>
                Import
              </Button>
              <Button onClick={handleExportTeamSet}>
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {team.map((slot, i) => (
                <SlotChip key={i} slotIndex={i} slot={slot} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-0">
          {/* Details Card */}
          <div className="lg:col-span-8 sm:col-span-12 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className='grid gap-1 lg:grid-cols-3 md:grid-cols-2 sm: grid-cols-1'>
                  {/* Pokemon Header */}
                  <Card className="w-fit self-start cursor-pointer" onClick={() => setEditor({ kind: 'pokemon' })}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div>
                          {selected.spriteUrl ? (
                            <img
                              src={selected.spriteUrl}
                              alt={selected.name}
                              className="h-24 w-24"
                            />
                          ) : (
                            <div className="h-24 w-24 rounded bg-muted" />
                          )}
                        </div>

                        <div className="flex flex-col space-y-2">
                          <div className="text-2xl font-bold">{selected.name}</div>

                          {selected.types.length > 0 ? (
                            <div className="mt-1 flex gap-1">
                              {selected.types.map((t) => (
                                <span
                                  key={t.id}
                                  className="rounded px-2 py-0.5 text-xs font-semibold text-white"
                                  style={{ backgroundColor: t.color || '#999' }}
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          )
                            :
                            <div className="mt-1 flex gap-1">

                              <span
                                className="rounded px-2 py-0.5 text-xs font-semibold text-white"
                                style={{ backgroundColor: '#999', color: "#999" }}
                              >
                                {"type"}
                              </span>

                            </div>
                          }

                          <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">
                              Nickname
                            </label>
                            <input
                              type="text"
                              value={selected.nickName}
                              onChange={(e) => updateSelected({ nickName: e.target.value })}
                              placeholder="Optional"
                              className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Details */}
                  <div className='flex flex-col lg:col-span-1'>
                    <Card className="w-fit">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-3">
                          {/* Shiny */}
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selected.isShiny}
                              onChange={(e) =>
                                updateSelected({ isShiny: e.target.checked })
                              }
                              className="h-4 w-4 rounded border border-border"
                            />
                            <label className="text-sm">Shiny</label>
                          </div>

                          {/* Tera Type */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">
                              Tera Type
                            </label>
                            <input
                              type="text"
                              value={selected.teraType?.name || ''}
                              onChange={(e) =>
                                updateSelected({
                                  teraType: e.target.value
                                    ? { id: 0, name: e.target.value }
                                    : null,
                                })
                              }
                              // placeholder="None"
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>

                        </div>
                      </CardContent>
                    </Card>

                    {/* Item, Ability, Nature Grid */}
                    <Card className="grid-item grid">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-3">
                          {/* Item */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">
                              Item
                            </label>
                            <input
                              type="text"
                              value={selected.item}
                              onChange={(e) => updateSelected({ item: e.target.value })}
                              placeholder="None"
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>

                          {/* Ability*/}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">
                              Ability
                            </label>

                            <select
                              value={selected.ability || ''}
                              onChange={(e) =>
                                updateSelected({
                                  ability: e.target.value,
                                })
                              }
                              onClick={() => {setEditor({kind: 'ability'})}}
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                              {selected.abilities?.map((ability) => (
                                <option key={ability.id} value={ability.name}>
                                  {ability.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Moves */}
                  <Card className="grid-item grid">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Moves
                          </label>
                          <input
                            type="text"
                            value={selected.item}
                            onChange={(e) => updateSelected({ item: e.target.value })}
                            placeholder="None"
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>

                      </div>
                    </CardContent>
                  </Card>


                </div>

              </CardContent>
            </Card>

          </div>
          {/* Right: Stats Display */}
          <div className="lg:col-span-4 sm:col-span-12 space-y-4">
            {editor.kind !== 'stats' && (
              <Card className="overflow-hidden">
                <CardContent className="pt-6">
                  <StatsDisplay
                    baseStats={
                      selected.baseStats || {
                        hp: 0,
                        atk: 0,
                        def: 0,
                        spa: 0,
                        spd: 0,
                        spe: 0,
                      }
                    }
                    evs={selected.evs}
                    ivs={selected.ivs}
                    nature={selected.nature}
                    onStatsClick={() => setEditor({ kind: 'stats' })}
                  />
                </CardContent>
              </Card>
            )}

            {editor.kind === 'stats' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Edit Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatsModal
                    title="EVs"
                    value={selected.evs}
                    onChange={(evs) => updateSelected({ evs })}
                    maxPerStat={252}
                    maxTotal={510}
                    natures={NATURES}
                    selectedNature={selected.nature}
                    onNatureChange={(nature) => updateSelected({ nature })}
                    baseStats={selected.baseStats}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Editor */}
          <div className='col-span-12'>
            {/* Pokemon Search */}
            {editor.kind === 'pokemon' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Select Pokémon</CardTitle>
                </CardHeader>
                <CardContent>
                  <PokemonSlotSearch
                    generationId={9}
                    onSelect={assignPokemonToSlot}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}