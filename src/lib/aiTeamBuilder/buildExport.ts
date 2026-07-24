import { MoveCategory } from '@/types';
import type {
  MoveInput,
  PaginatedResponse,
  PokemonInput,
  SeasonPokemonTeamInput,
  TeamBuildInput,
} from '@/types';
import { AI_TEAM_BUILDER_PROMPT } from './prompt';

/**
 * Pure module (no React) that assembles the "Export for AI" payload for a
 * matchup: the polished prompt (Appendix A) followed by a fenced JSON dataset
 * describing both selected sides. Trivially unit-testable and importable by
 * both comparison pages and the export dialog.
 */

export interface ExportSide {
  /** Team / build name. */
  label: string;
  pointTotal: number;
  /** The `*WithMoves` array — Pokemon with their `moves` relation enriched. */
  pokemon: PokemonInput[];
  /** pokemonId -> pointValue for this side's Pokemon. */
  pointByPokemonId: Map<number, number>;
}

export interface CompactMove {
  name: string;
  /** pokemonType.name, or null if unknown. */
  type: string | null;
  category: MoveCategory;
  power: number;
  accuracy: number;
  priority: number;
  /** special-move-category names + derived `multi-hit` / `charge` tags. */
  tags: string[];
}

export interface PokemonExport {
  name: string;
  types: string[];
  /** pointByPokemonId.get(id) ?? null. */
  pointValue: number | null;
  stats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
    bst: number;
  };
  abilities: string[];
  /** Defensive multiplier taken from each attacking type (typeName -> value). */
  typeEffectiveness: Record<string, number>;
  /** Only "useable" moves — see `deriveMove`. */
  moves: CompactMove[];
}

export type ExportContext = 'matchup' | 'teamBuildCompare';

export interface ExportOptions {
  context: ExportContext;
  /** Optional generation name (e.g. "Gen 9"); omitted from output when absent. */
  generationName?: string;
}

const EXPORT_NOTE = 'Base stats only; EVs/natures are for the AI to decide.';

// Multi-hit: catches "Hits twice", "Hits two to five times", "Hits ten times", etc.
const MULTI_HIT_RE = /hits\b[^.]*\b(?:twice|times)\b/i;
// Charge: two-turn (and recharge) moves — a negative signal for the LLM.
const CHARGE_RE = /charge/i;

/**
 * Applies the "useable moves" filter and derives a compact, description-free
 * encoding for a single move. Returns `null` when the move is not useable.
 *
 * A move is useable if it satisfies at least one of:
 *  1. Has any special-move-category (always useable).
 *  2. Is a useable attacking move (PHYSICAL/SPECIAL) — power >= 60 with
 *     accuracy >= 70, or power >= 60 that never misses (accuracy 0), or a
 *     variable/fixed-damage move (power 0 or 1).
 *  3. Is a multi-hit move (per its description), regardless of power/accuracy.
 */
export function deriveMove(move: MoveInput): CompactMove | null {
  const description = move.description ?? '';
  const isMultiHit = MULTI_HIT_RE.test(description);
  const isCharge = CHARGE_RE.test(description);

  const specialCategories = move.specialMoveCategories ?? [];
  const hasSpecialCategory = specialCategories.length > 0;

  const isAttacking =
    move.category === MoveCategory.PHYSICAL || move.category === MoveCategory.SPECIAL;
  const useableAttacking =
    isAttacking &&
    ((move.power >= 60 && move.accuracy >= 70) ||
      (move.power >= 60 && move.accuracy === 0) ||
      move.power === 0 ||
      move.power === 1);

  if (!hasSpecialCategory && !useableAttacking && !isMultiHit) return null;

  const tags: string[] = [];
  for (const smc of specialCategories) {
    if (smc.name) tags.push(smc.name);
  }
  if (isMultiHit) tags.push('multi-hit');
  if (isCharge) tags.push('charge');

  return {
    name: move.name,
    type: move.pokemonType?.name ?? null,
    category: move.category,
    power: move.power,
    accuracy: move.accuracy,
    priority: move.priority,
    tags,
  };
}

function toPokemonExport(
  pokemon: PokemonInput,
  pointByPokemonId: Map<number, number>,
): PokemonExport {
  const typeEffectiveness: Record<string, number> = {};
  for (const te of pokemon.typeEffectiveness ?? []) {
    if (te.pokemonType?.name) {
      typeEffectiveness[te.pokemonType.name.toLowerCase()] = te.value;
    }
  }

  const moves: CompactMove[] = [];
  for (const move of pokemon.moves ?? []) {
    const derived = deriveMove(move);
    if (derived) moves.push(derived);
  }

  return {
    name: pokemon.name,
    types: (pokemon.pokemonTypes ?? []).map((t) => t.name),
    pointValue: pointByPokemonId.get(pokemon.id) ?? null,
    stats: {
      hp: pokemon.hp,
      atk: pokemon.attack,
      def: pokemon.defense,
      spa: pokemon.specialAttack,
      spd: pokemon.specialDefense,
      spe: pokemon.speed,
      bst: pokemon.baseStatTotal,
    },
    abilities: (pokemon.abilities ?? []).map((a) => a.name),
    typeEffectiveness,
    moves,
  };
}

/** Sort by pointValue descending, nulls last. */
function byPointValueDesc(a: PokemonExport, b: PokemonExport): number {
  if (a.pointValue === null && b.pointValue === null) return 0;
  if (a.pointValue === null) return 1;
  if (b.pointValue === null) return -1;
  return b.pointValue - a.pointValue;
}

function toSideExport(side: ExportSide) {
  return {
    label: side.label,
    pointTotal: side.pointTotal,
    pokemon: side.pokemon
      .map((pkmn) => toPokemonExport(pkmn, side.pointByPokemonId))
      .sort(byPointValueDesc),
  };
}

/**
 * Reads point values off a comparison side, using whichever of `rosterData`
 * (drafted team source) or `teamBuild` (build source) is populated.
 */
export function pointMapForSide(side: {
  rosterData: PaginatedResponse<SeasonPokemonTeamInput> | null;
  teamBuild: TeamBuildInput | null;
}): Map<number, number> {
  const map = new Map<number, number>();
  if (side.rosterData) {
    for (const spt of side.rosterData.data) {
      const pkmn = spt.seasonPokemon?.pokemon;
      const pointValue = spt.seasonPokemon?.pointValue;
      if (pkmn && pointValue != null) map.set(pkmn.id, pointValue);
    }
  } else if (side.teamBuild) {
    for (const set of side.teamBuild.teamBuildSets ?? []) {
      if (set.pointValue != null) map.set(set.pokemonId, set.pointValue);
    }
  }
  return map;
}

/**
 * Assembles the full export document: the polished prompt followed by a fenced
 * ```json block containing the matchup dataset (`myTeam` vs `opponent`).
 */
export function buildExport(
  myTeam: ExportSide,
  opponent: ExportSide,
  options: ExportOptions,
): string {
  const payload = {
    meta: {
      ...(options.generationName ? { generation: options.generationName } : {}),
      context: options.context,
      note: EXPORT_NOTE,
    },
    myTeam: toSideExport(myTeam),
    opponent: toSideExport(opponent),
  };

  const json = JSON.stringify(payload, null, 2);
  return `${AI_TEAM_BUILDER_PROMPT}\n\n## Matchup Data\n\n\`\`\`json\n${json}\n\`\`\`\n`;
}

/** Slugify a label for use in a download filename ('' if nothing usable). */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Build the download filename, falling back to `export.md`. */
export function exportFilename(myLabel: string, opponentLabel: string): string {
  const my = slugify(myLabel);
  const opponent = slugify(opponentLabel);
  if (!my && !opponent) return 'export.md';
  return `draftmons-matchup-${my || 'team'}-vs-${opponent || 'team'}.md`;
}
