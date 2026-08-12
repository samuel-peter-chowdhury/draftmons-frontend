/**
 * Converts Pokémon Showdown format to PokemonSet array
 * Handles the Showdown team format as shown in the example
 */
export function parseShowdownTeam(text: string): Partial<any>[] {
  const sets = text
    .trim()
    .split('\n\n')
    .filter((block) => block.trim().length > 0);

  return sets.map((block) => {
    const lines = block.split('\n').map((l) => l.trim());
    const pokemonLine = lines[0]; // e.g., "shed (Shedinja) @ Heavy-Duty Boots"

    const result: Record<string, any> = {
      name: '',
      nickName: '',
      item: '',
      ability: '',
      nature: '',
      teraType: null,
      isShiny: false,
      moves: ['', '', '', ''],
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    };

    // Parse first line: "nickName (PokemonName) @ Item"
    const match = pokemonLine.match(/^(?:(.+?)\s+)?\((.+?)\)\s*@\s*(.+)$|^(.+)$/);
    if (match) {
      if (match[2]) {
        // Has parentheses format
        result.nickName = match[1] || '';
        result.name = match[2];
        result.item = match[3] || '';
      } else {
        // Just pokemon name, no item
        result.name = match[4] || pokemonLine;
      }
    } else {
      result.name = pokemonLine.split('@')[0].trim();
      result.item = pokemonLine.split('@')[1]?.trim() || '';
    }

    // Parse remaining lines
    let moveCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      if (line.startsWith('Ability:')) {
        result.ability = line.replace('Ability:', '').trim();
      } else if (line.startsWith('Tera Type:')) {
        const teraName = line.replace('Tera Type:', '').trim();
        result.teraType = { id: 0, name: teraName };
      } else if (line.startsWith('Nature:')) {
        result.nature = line.replace('Nature:', '').trim();
      } else if (line.startsWith('EVs:')) {
        const evsStr = line.replace('EVs:', '').trim();
        parseStats(evsStr, result.evs);
      } else if (line.startsWith('IVs:')) {
        const ivsStr = line.replace('IVs:', '').trim();
        parseStats(ivsStr, result.ivs);
      } else if (line.startsWith('-')) {
        const move = line.replace('-', '').trim();
        if (moveCount < 4) {
          result.moves[moveCount] = move;
          moveCount++;
        }
      }
    }

    return result;
  });
}

/**
 * Parses stat strings like "252 Atk / 4 SpA / 252 Spe"
 */
function parseStats(
  statsStr: string,
  target: Record<string, number>
) {
  const parts = statsStr.split('/').map((p) => p.trim());
  for (const part of parts) {
    const match = part.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const stat = match[2].toLowerCase();

      // Map shorthand to full stat names
      let key: string | null = null;
      if (stat === 'hp') key = 'hp';
      else if (stat === 'atk') key = 'atk';
      else if (stat === 'def') key = 'def';
      else if (stat === 'spa' || stat === 'spA') key = 'spa';
      else if (stat === 'spd' || stat === 'spD') key = 'spd';
      else if (stat === 'spe') key = 'spe';

      if (key && target.hasOwnProperty(key)) {
        target[key] = value;
      }
    }
  }
}

/**
 * Converts a PokemonSet to Showdown format
 */
export function pokemonSetToShowdown(set: any): string {
  const lines: string[] = [];

  // First line: nickName (Name) @ Item
  const baseName = set.name || 'Unknown';
  let firstLine = '';
  if (set.nickName && set.nickName !== set.name) {
    firstLine = `${set.nickName} (${baseName})`;
  } else {
    firstLine = baseName;
  }

  if (set.item) {
    firstLine += ` @ ${set.item}`;
  }
  lines.push(firstLine);

  // Ability
  if (set.ability) {
    lines.push(`Ability: ${set.ability}`);
  }

  // Tera Type
  if (set.teraType?.name) {
    lines.push(`Tera Type: ${set.teraType.name}`);
  }

  // Nature + EVs on same line or separate
  const evsStr = formatStats(set.evs);
  if (set.nature && evsStr) {
    lines.push(`EVs: ${evsStr}`);
    lines.push(`${set.nature} Nature`);
  } else if (evsStr) {
    lines.push(`EVs: ${evsStr}`);
  } else if (set.nature) {
    lines.push(`${set.nature} Nature`);
  }

  // IVs if not all 31
  if (set.ivs && !isDefaultIVs(set.ivs)) {
    const ivsStr = formatStats(set.ivs);
    lines.push(`IVs: ${ivsStr}`);
  }

  // Moves
  const validMoves = set.moves?.filter((m: string) => m && m.trim()) || [];
  for (const move of validMoves) {
    lines.push(`- ${move}`);
  }

  return lines.join('\n');
}

/**
 * Formats stats object back to Showdown string: "252 Atk / 4 SpA / 252 Spe"
 */
function formatStats(stats: Record<string, number>): string {
  const parts: string[] = [];

  const order: (keyof typeof stats)[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  const labels: Record<string, string> = {
    hp: 'HP',
    atk: 'Atk',
    def: 'Def',
    spa: 'SpA',
    spd: 'SpD',
    spe: 'Spe',
  };

  for (const key of order) {
    const value = stats[key];
    if (value && value > 0) {
      parts.push(`${value} ${labels[key]}`);
    }
  }

  return parts.join(' / ');
}

/**
 * Check if IVs are default (all 31)
 */
function isDefaultIVs(ivs: Record<string, number>): boolean {
  return (
    ivs.hp === 31 &&
    ivs.atk === 31 &&
    ivs.def === 31 &&
    ivs.spa === 31 &&
    ivs.spd === 31 &&
    ivs.spe === 31
  );
}

/**
 * Converts entire team to Showdown format (full export string)
 */
export function teamToShowdown(team: any[]): string {
  return team
    .filter((set) => set.pokemonId !== null) // Skip empty slots
    .map((set) => pokemonSetToShowdown(set))
    .join('\n\n');
}