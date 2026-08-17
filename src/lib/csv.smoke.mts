/**
 * Standalone behavioral assertions for lib/csv.ts (no test framework).
 *
 * Run with: npx --yes tsx src/lib/csv.smoke.mts
 *
 * `@/types` imports inside csv.ts are `import type` only, so they are erased
 * at compile time — no path-alias resolution is needed to run this script.
 */

import assert from 'node:assert/strict';
import {
  parseCsvRows,
  validateCsvStructure,
  buildBulkUpsertEntries,
  generateExportRows,
} from './csv';
import { slugify } from './utils';

// ---------------------------------------------------------------------------
// parseCsvRows
// ---------------------------------------------------------------------------

assert.deepEqual(
  parseCsvRows('name,pointValue\nPikachu,3\n'),
  [
    ['name', 'pointValue'],
    ['Pikachu', '3'],
  ],
  'parseCsvRows: basic two-row parse',
);

assert.deepEqual(
  parseCsvRows('name,pointValue\n\nPikachu,3\n\n\nDitto,1\n'),
  [
    ['name', 'pointValue'],
    ['Pikachu', '3'],
    ['Ditto', '1'],
  ],
  'parseCsvRows: blank/interior lines produce no rows (D-CSV-07)',
);

assert.deepEqual(
  parseCsvRows(`name,pointValue\r\n"Farfetch'd",2\r\n`),
  [
    ['name', 'pointValue'],
    ["Farfetch'd", '2'],
  ],
  'parseCsvRows: quoted field + CRLF line endings',
);

assert.deepEqual(
  parseCsvRows('name,pointValue\n"He said ""hi""",1\n'),
  [
    ['name', 'pointValue'],
    ['He said "hi"', '1'],
  ],
  'parseCsvRows: escaped double-quote unescapes correctly',
);

// ---------------------------------------------------------------------------
// validateCsvStructure
// ---------------------------------------------------------------------------

assert.deepEqual(
  validateCsvStructure([['name', 'pointValue']]),
  { error: 'CSV file is empty — no data rows found after the header row.' },
  'validateCsvStructure: header-only input is an error (D-CSV-06)',
);

const wrongColumnResult = validateCsvStructure([
  ['name', 'pointValue'],
  ['Pikachu', '3'],
  ['Ditto'],
  ['Eevee', '1', 'extra'],
]);
assert.ok(
  'error' in wrongColumnResult,
  'validateCsvStructure: wrong column count row produces an error',
);
if ('error' in wrongColumnResult) {
  // 'Ditto' is the 2nd data row -> original file row 3.
  assert.match(wrongColumnResult.error, /row 3/i, 'validateCsvStructure: names the 1-based row');
}

const validStructureResult = validateCsvStructure([
  ['name', 'pointValue'],
  ['Pikachu', '3'],
  ['Ditto', ''],
]);
assert.deepEqual(
  validStructureResult,
  [
    { name: 'Pikachu', pointValue: '3' },
    { name: 'Ditto', pointValue: '' },
  ],
  'validateCsvStructure: valid 2-column body maps to data rows only, header skipped (D-CSV-01)',
);

// ---------------------------------------------------------------------------
// buildBulkUpsertEntries
// ---------------------------------------------------------------------------

assert.deepEqual(
  buildBulkUpsertEntries([{ name: 'Pikachu', pointValue: '3' }]),
  [{ name: 'Pikachu', pointValue: 3 }],
  'buildBulkUpsertEntries: integer cell converts to a real number',
);

const blankEntry = buildBulkUpsertEntries([{ name: 'Ditto', pointValue: '' }])[0];
assert.equal(blankEntry.name, 'Ditto');
assert.equal(
  blankEntry.pointValue,
  undefined,
  'buildBulkUpsertEntries: blank cell omits pointValue (D-CSV-03)',
);
assert.ok(
  !('pointValue' in blankEntry),
  'buildBulkUpsertEntries: blank cell does not set the pointValue key at all',
);

// WR-02 guard: a non-integer float MUST NOT be sent as pointValue, or it 400s
// the whole batch. The row must still be included (name intact) so it routes
// through the backend's safe per-entry INVALID_POINT_VALUE path.
const floatEntry = buildBulkUpsertEntries([{ name: 'Eevee', pointValue: '3.5' }])[0];
assert.equal(floatEntry.name, 'Eevee', 'buildBulkUpsertEntries: float row is still included');
assert.equal(
  floatEntry.pointValue,
  undefined,
  'buildBulkUpsertEntries: non-integer float cell omits pointValue (WR-02 guard)',
);

const nonNumericEntry = buildBulkUpsertEntries([{ name: 'abc-row', pointValue: 'abc' }])[0];
assert.equal(nonNumericEntry.name, 'abc-row');
assert.equal(
  nonNumericEntry.pointValue,
  undefined,
  'buildBulkUpsertEntries: non-numeric cell omits pointValue',
);

// ---------------------------------------------------------------------------
// generateExportRows
// ---------------------------------------------------------------------------

type FixtureSeasonPokemon = {
  pointValue: number;
  pokemon?: { name: string };
};

const fixture: FixtureSeasonPokemon[] = [
  { pointValue: 0, pokemon: { name: 'Metapod' } },
  { pointValue: 3, pokemon: { name: 'Charizard' } },
  { pointValue: 3, pokemon: { name: 'Blastoise' } },
  { pointValue: 1, pokemon: { name: 'Pidgey, the Bird' } },
];

// eslint/type-check note: cast is safe here — the smoke script only reads
// pointValue/pokemon.name, the exact fields generateExportRows uses.
const exportText = generateExportRows(
  fixture as unknown as Parameters<typeof generateExportRows>[0],
);

const exportLines = exportText.split('\n');
assert.equal(exportLines[0], 'name,pointValue', 'generateExportRows: header row (D-CSV-16)');
assert.deepEqual(
  exportLines.slice(1),
  ['Blastoise,3', 'Charizard,3', '"Pidgey, the Bird",1', 'Metapod,0'],
  'generateExportRows: sorted pointValue DESC then name ASC (D-CSV-15), literal 0 for unassigned (D-CSV-04), comma-name quoted',
);

// ---------------------------------------------------------------------------
// CSV-06 round-trip: export -> parse -> validate -> build reproduces the same
// logical entry set, including a preserved 0 for unassigned entries.
// ---------------------------------------------------------------------------

const roundTripRows = parseCsvRows(exportText);
const roundTripStructure = validateCsvStructure(roundTripRows);
assert.ok(!('error' in roundTripStructure), 'CSV-06 round-trip: re-parsed export is valid');
if (!('error' in roundTripStructure)) {
  const roundTripEntries = buildBulkUpsertEntries(roundTripStructure);
  const expected = [
    { name: 'Blastoise', pointValue: 3 },
    { name: 'Charizard', pointValue: 3 },
    { name: 'Pidgey, the Bird', pointValue: 1 },
    { name: 'Metapod', pointValue: 0 },
  ];
  assert.deepEqual(
    roundTripEntries,
    expected,
    'CSV-06 round-trip: reconstructed entries match the fixture (0 preserved as 0)',
  );
}

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

assert.equal(slugify('Summer 2026'), 'summer-2026', 'slugify: basic case');
assert.equal(slugify('   '), '', 'slugify: whitespace-only input returns empty string');
assert.equal(slugify(''), '', 'slugify: empty input returns empty string');

console.log('csv.smoke.mts: all assertions passed');
