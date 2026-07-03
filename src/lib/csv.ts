/**
 * CSV utilities for tier-list import/export (Phase 7: CSV-01..CSV-06).
 *
 * Hand-rolled, dependency-free comma-delimited parser and serializer per the
 * milestone's "minimal deps" constraint (PROJECT.md). All functions here are
 * pure — no DOM/React dependencies — so they are directly unit-testable via
 * the standalone `csv.smoke.mts` script.
 */

import type { BulkUpsertEntryInput } from '@/types';
import type { SeasonPokemonInput } from '@/types';

/**
 * Parses raw CSV text into an array of raw string-cell rows.
 *
 * Supports double-quote-wrapped fields with `""` as an escaped quote (so
 * names like `Farfetch'd` and `Nidoran♀` survive), handles both `\n` and
 * `\r\n` line endings, and silently skips fully blank lines (D-CSV-07). The
 * header row is NOT stripped here — that is `validateCsvStructure`'s job.
 *
 * @example
 * parseCsvRows("name,pointValue\nPikachu,3\n") // [["name","pointValue"],["Pikachu","3"]]
 */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  const pushField = (): void => {
    row.push(field);
    field = '';
  };

  const pushRow = (): void => {
    pushField();
    const isBlankLine = row.length === 1 && row[0].trim() === '';
    if (!isBlankLine) {
      rows.push(row);
    }
    row = [];
  };

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (char === ',') {
      pushField();
      i += 1;
      continue;
    }

    if (char === '\r') {
      if (text[i + 1] === '\n') {
        i += 1;
      }
      pushRow();
      i += 1;
      continue;
    }

    if (char === '\n') {
      pushRow();
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  // Flush a trailing row that wasn't terminated by a newline.
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows;
}

/**
 * Validates raw CSV rows and extracts the two-column data rows.
 *
 * Unconditionally drops `rows[0]` as the header regardless of content
 * (D-CSV-01). Returns `{ error }` if there are zero data rows after the
 * header (D-CSV-06), or if any data row does not have exactly 2 columns
 * (D-CSV-05) — naming the offending row's 1-based position in the original
 * file. Column recognition is strict-positional (D-CSV-02): column 1 is
 * always name, column 2 is always pointValue.
 */
export function validateCsvStructure(
  rows: string[][],
): { name: string; pointValue: string }[] | { error: string } {
  const dataRows = rows.slice(1);

  if (dataRows.length === 0) {
    return { error: 'CSV file is empty — no data rows found after the header row.' };
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (row.length !== 2) {
      const rowNumber = i + 2; // +1 for 0-index, +1 for the skipped header row
      return { error: `Row ${rowNumber} has ${row.length} columns, expected 2.` };
    }
  }

  return dataRows.map((row) => ({ name: row[0], pointValue: row[1] }));
}

/**
 * Converts raw string-cell rows into the bulk-upsert request entry shape.
 *
 * `pointValue` is set ONLY when the trimmed cell parses to a finite integer
 * (`Number.isInteger`). In every other case — blank/whitespace-only
 * (D-CSV-03), non-numeric (e.g. `'abc'`), or numeric-but-non-integer (e.g.
 * `'3.5'`) — `pointValue` is omitted entirely. This is mandatory per WR-02
 * (PROJECT.md): the backend's `@IsInt()` has no per-entry catch, so sending a
 * float 400s the ENTIRE batch, whereas an omitted pointValue comes back as a
 * single per-entry `INVALID_POINT_VALUE` failure inside the 200 result array.
 * Never throws client-side — malformed rows are still included so the
 * backend can report them per-row.
 */
export function buildBulkUpsertEntries(
  rows: { name: string; pointValue: string }[],
): BulkUpsertEntryInput[] {
  return rows.map((row) => {
    const name = row.name.trim();
    const trimmedValue = row.pointValue.trim();
    const entry: BulkUpsertEntryInput = { name };

    if (trimmedValue !== '') {
      const parsed = Number(trimmedValue);
      if (Number.isInteger(parsed)) {
        entry.pointValue = parsed;
      }
    }

    return entry;
  });
}

/**
 * Serializes the current tier list into two-column CSV text (the inverse of
 * import). Header is `name,pointValue` (D-CSV-16). Rows are sorted by
 * pointValue descending, then Pokémon name ascending (D-CSV-15). Unassigned
 * entries (pointValue 0 or null/undefined) are always written as a literal
 * `0`, never a blank cell (D-CSV-04) — this is what guarantees the CSV-06
 * round-trip never re-triggers the D-CSV-03 blank-cell path. Names
 * containing a comma, double-quote, or newline are CSV-quoted.
 */
export function generateExportRows(spData: SeasonPokemonInput[]): string {
  const escapeCsvField = (value: string): string => {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const dataRows = [...spData]
    .sort((a, b) => {
      const aPoint = a.pointValue || 0;
      const bPoint = b.pointValue || 0;
      if (bPoint !== aPoint) return bPoint - aPoint;
      const aName = a.pokemon?.name || '';
      const bName = b.pokemon?.name || '';
      return aName.localeCompare(bName);
    })
    .map((sp) => {
      const name = escapeCsvField(sp.pokemon?.name || '');
      const pointValue = sp.pointValue || 0;
      return `${name},${pointValue}`;
    });

  return ['name,pointValue', ...dataRows].join('\n');
}
