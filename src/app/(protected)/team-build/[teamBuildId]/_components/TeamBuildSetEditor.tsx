'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, ErrorAlert, Input, Select, Spinner } from '@/components';
import { Badge } from '@/components/ui/badge';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { useFetch, useMutation } from '@/hooks';
import { buildUrlWithQuery, TeamBuildSetApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { StatType } from '@/types';
import type {
  ItemInput,
  NatureInput,
  PaginatedResponse,
  PokemonInput,
  TeamBuildInput,
  TeamBuildSetInput,
  TeamBuildSetOutput,
} from '@/types';

interface TeamBuildSetEditorProps {
  set: TeamBuildSetInput;
  build: TeamBuildInput;
  onChanged: () => void;
}

const EV_KEYS = [
  { key: 'hpEv', label: 'HP' },
  { key: 'attackEv', label: 'Atk' },
  { key: 'defenseEv', label: 'Def' },
  { key: 'specialAttackEv', label: 'SpA' },
  { key: 'specialDefenseEv', label: 'SpD' },
  { key: 'speedEv', label: 'Spe' },
] as const;

const IV_KEYS = [
  { key: 'hpIv', label: 'HP' },
  { key: 'attackIv', label: 'Atk' },
  { key: 'defenseIv', label: 'Def' },
  { key: 'specialAttackIv', label: 'SpA' },
  { key: 'specialDefenseIv', label: 'SpD' },
  { key: 'speedIv', label: 'Spe' },
] as const;

const STAT_SHORT: Record<StatType, string> = {
  [StatType.HP]: 'HP',
  [StatType.ATTACK]: 'Atk',
  [StatType.DEFENSE]: 'Def',
  [StatType.SPECIAL_ATTACK]: 'Sp. Atk',
  [StatType.SPECIAL_DEFENSE]: 'Sp. Def',
  [StatType.SPEED]: 'Speed',
};

function natureHint(n: NatureInput): string {
  if (!n.positiveStat || !n.negativeStat) return 'Neutral';
  return `+${STAT_SHORT[n.positiveStat]}, -${STAT_SHORT[n.negativeStat]}`;
}

type MoveSlot = 'move1Id' | 'move2Id' | 'move3Id' | 'move4Id';
const MOVE_SLOTS: MoveSlot[] = ['move1Id', 'move2Id', 'move3Id', 'move4Id'];

type EvKey = (typeof EV_KEYS)[number]['key'];
type IvKey = (typeof IV_KEYS)[number]['key'];

interface EditorForm {
  itemId: number | null;
  abilityId: number | null;
  move1Id: number | null;
  move2Id: number | null;
  move3Id: number | null;
  move4Id: number | null;
  natureId: number | null;
  evs: Record<EvKey, number>;
  ivs: Record<IvKey, number>;
}

function formFromSet(set: TeamBuildSetInput): EditorForm {
  return {
    itemId: set.itemId ?? null,
    abilityId: set.abilityId ?? null,
    move1Id: set.move1Id ?? null,
    move2Id: set.move2Id ?? null,
    move3Id: set.move3Id ?? null,
    move4Id: set.move4Id ?? null,
    natureId: set.natureId ?? null,
    evs: {
      hpEv: set.hpEv,
      attackEv: set.attackEv,
      defenseEv: set.defenseEv,
      specialAttackEv: set.specialAttackEv,
      specialDefenseEv: set.specialDefenseEv,
      speedEv: set.speedEv,
    },
    ivs: {
      hpIv: set.hpIv,
      attackIv: set.attackIv,
      defenseIv: set.defenseIv,
      specialAttackIv: set.specialAttackIv,
      specialDefenseIv: set.specialDefenseIv,
      speedIv: set.speedIv,
    },
  };
}

export function TeamBuildSetEditor({ set, build, onChanged }: TeamBuildSetEditorProps) {
  const [form, setForm] = useState<EditorForm>(() => formFromSet(set));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(formFromSet(set));
    setSaved(false);
  }, [set]);

  // Full Pokemon (for movepool + abilities — the build's set.pokemon omits moves).
  const { data: pokemon, loading: pokemonLoading } = useFetch<PokemonInput>(
    buildUrlWithQuery(BASE_ENDPOINTS.POKEMON_BASE, [set.pokemonId], { full: true }),
  );

  const { data: itemsResp } = useFetch<PaginatedResponse<ItemInput>>(
    buildUrlWithQuery(BASE_ENDPOINTS.ITEM_BASE, [], {
      generationId: build.generationId,
      pageSize: 10000,
      sortBy: 'name',
      sortOrder: 'ASC',
    }),
  );

  const { data: naturesResp } = useFetch<PaginatedResponse<NatureInput>>(
    buildUrlWithQuery(BASE_ENDPOINTS.NATURE_BASE, [], { pageSize: 100, sortBy: 'name' }),
  );

  const abilities = pokemon?.abilities ?? [];
  const moves = useMemo(
    () => [...(pokemon?.moves ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [pokemon],
  );
  const items = itemsResp?.data ?? [];
  const natures = naturesResp?.data ?? [];

  const evTotal = useMemo(
    () => Object.values(form.evs).reduce((sum, v) => sum + (v || 0), 0),
    [form.evs],
  );

  const updateMutation = useMutation(
    (data: Partial<TeamBuildSetOutput>) => TeamBuildSetApi.update(set.id, data),
    {
      onSuccess: () => {
        setSaved(true);
        onChanged();
      },
    },
  );

  const setField = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const setEv = (key: EvKey, value: number) => {
    setForm((f) => ({ ...f, evs: { ...f.evs, [key]: value } }));
    setSaved(false);
  };

  const setIv = (key: IvKey, value: number) => {
    setForm((f) => ({ ...f, ivs: { ...f.ivs, [key]: value } }));
    setSaved(false);
  };

  const handleSave = () => {
    updateMutation.mutate({
      itemId: form.itemId,
      abilityId: form.abilityId,
      move1Id: form.move1Id,
      move2Id: form.move2Id,
      move3Id: form.move3Id,
      move4Id: form.move4Id,
      natureId: form.natureId,
      ...form.evs,
      ...form.ivs,
    });
  };

  // Move ids selected in slots other than the given one — for dedup.
  const selectedMoveIds = MOVE_SLOTS.map((slot) => form[slot]);

  const clampInt = (raw: string, min: number, max: number): number => {
    const n = Number(raw);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  };

  if (pokemonLoading && !pokemon) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {pokemon && (
          <PokemonSprite
            pokemonId={pokemon.id}
            spriteUrl={pokemon.spriteUrl}
            name={pokemon.name}
            className="size-12 object-contain"
            disableClick
          />
        )}
        <h3 className="text-lg font-semibold capitalize">{set.pokemon?.name ?? pokemon?.name}</h3>
      </div>

      {/* Item + Ability + Nature */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Item</label>
          <Select
            value={form.itemId?.toString() ?? ''}
            onChange={(e) => setField('itemId', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">None</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Ability</label>
          <Select
            value={form.abilityId?.toString() ?? ''}
            onChange={(e) => setField('abilityId', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">None</option>
            {abilities.map((a) => (
              <option key={a.id} value={a.id} className="capitalize">
                {a.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Nature</label>
          <Select
            value={form.natureId?.toString() ?? ''}
            onChange={(e) => setField('natureId', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">None</option>
            {natures.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({natureHint(n)})
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Moves */}
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Moves</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MOVE_SLOTS.map((slot, i) => (
            <Select
              key={slot}
              value={form[slot]?.toString() ?? ''}
              onChange={(e) => setField(slot, e.target.value ? Number(e.target.value) : null)}
              aria-label={`Move ${i + 1}`}
            >
              <option value="">Move {i + 1}</option>
              {moves.map((move) => {
                const usedElsewhere = selectedMoveIds.some(
                  (id, idx) => idx !== i && id === move.id,
                );
                return (
                  <option key={move.id} value={move.id} disabled={usedElsewhere}>
                    {move.name}
                  </option>
                );
              })}
            </Select>
          ))}
        </div>
      </div>

      {/* EVs */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs text-muted-foreground">EVs</label>
          <Badge
            variant={evTotal > 510 ? 'destructive' : 'secondary'}
            className={
              evTotal > 510
                ? undefined
                : evTotal > 508
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                  : undefined
            }
          >
            EVs used: {evTotal} / 510
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {EV_KEYS.map(({ key, label }) => (
            <div key={key}>
              <label className="text-[11px] text-muted-foreground">{label}</label>
              <Input
                type="number"
                min={0}
                max={252}
                value={form.evs[key]}
                onChange={(e) => setEv(key, clampInt(e.target.value, 0, 252))}
                className="h-8"
              />
            </div>
          ))}
        </div>
      </div>

      {/* IVs */}
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">IVs</label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {IV_KEYS.map(({ key, label }) => (
            <div key={key}>
              <label className="text-[11px] text-muted-foreground">{label}</label>
              <Input
                type="number"
                min={0}
                max={31}
                value={form.ivs[key]}
                onChange={(e) => setIv(key, clampInt(e.target.value, 0, 31))}
                className="h-8"
              />
            </div>
          ))}
        </div>
      </div>

      {updateMutation.error && <ErrorAlert message={updateMutation.error} />}

      <div className="flex items-center justify-end gap-3">
        {saved && !updateMutation.loading && (
          <span className="text-sm text-green-500">Saved</span>
        )}
        <Button onClick={handleSave} disabled={updateMutation.loading}>
          {updateMutation.loading ? <Spinner size={18} /> : 'Save'}
        </Button>
      </div>
    </div>
  );
}
