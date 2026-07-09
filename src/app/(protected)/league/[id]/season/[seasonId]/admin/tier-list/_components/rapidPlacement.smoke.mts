/**
 * Standalone behavioral assertions for rapidPlacement.utils.ts (no test framework).
 *
 * Run with: npx --yes tsx "draftmons-frontend/src/app/(protected)/league/[id]/season/[seasonId]/admin/tier-list/_components/rapidPlacement.smoke.mts"
 *
 * `@/types` imports inside rapidPlacement.utils.ts are `import type` only, so
 * they are erased at compile time — no path-alias resolution is needed to
 * run this script.
 */

import assert from 'node:assert/strict';
import {
  buildSpByPokemonId,
  decideTierAction,
  placeholderIdFor,
  canRemove,
} from './rapidPlacement.utils';
import type { SeasonPokemonInput } from '@/types';

// ---------------------------------------------------------------------------
// buildSpByPokemonId
// ---------------------------------------------------------------------------

assert.deepEqual(
  buildSpByPokemonId([]),
  new Map(),
  'buildSpByPokemonId: empty input returns an empty Map',
);

const sp25 = { id: 1, pokemonId: 25, pointValue: 3 } as SeasonPokemonInput;
const mapWith25 = buildSpByPokemonId([sp25]);
assert.equal(mapWith25.get(25), sp25, 'buildSpByPokemonId: get(25) returns the matching sp');
assert.equal(mapWith25.get(99), undefined, 'buildSpByPokemonId: get(99) is undefined (no match)');

// ---------------------------------------------------------------------------
// decideTierAction
// ---------------------------------------------------------------------------

assert.equal(
  decideTierAction(undefined),
  'create',
  'decideTierAction: no row existing -> create',
);

const spPointValueZero = { id: 2, pokemonId: 1, pointValue: 0 } as SeasonPokemonInput;
assert.equal(
  decideTierAction(spPointValueZero),
  'update',
  'decideTierAction: row exists with pointValue 0 -> update (Pitfall 1: branch on existence, not pointValue)',
);

const spPointValueFive = { id: 3, pokemonId: 2, pointValue: 5 } as SeasonPokemonInput;
assert.equal(
  decideTierAction(spPointValueFive),
  'update',
  'decideTierAction: row exists with pointValue 5 -> update',
);

// ---------------------------------------------------------------------------
// placeholderIdFor
// ---------------------------------------------------------------------------

assert.equal(placeholderIdFor(25), -25, 'placeholderIdFor: -pokemonId for pokemonId 25');
assert.ok(
  placeholderIdFor(1) < 0 && placeholderIdFor(9999) < 0,
  'placeholderIdFor: always negative for any positive pokemonId (Pitfall 3 / Open Question 2)',
);

// ---------------------------------------------------------------------------
// canRemove
// ---------------------------------------------------------------------------

assert.equal(canRemove(undefined), false, 'canRemove: no row existing -> false');
assert.equal(canRemove(spPointValueZero), true, 'canRemove: any existing sp -> true');

console.log('rapidPlacement.smoke.mts: all assertions passed');
