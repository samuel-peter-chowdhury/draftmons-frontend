import type { PlayerPreviewDto } from '@/types';

// ─── Local draft shapes for the manual-entry flow ────────────────────────────
// These are editable working copies, not API payloads: numeric fields stay as
// raw strings so a half-typed input isn't coerced to 0, and seasonPokemonId can
// be null while a Fetch & Parse result is still unresolved. ManualEntryForm maps
// them into ManualSubmitInputDto only at submit time.

export interface ManualStatDraft {
  key: string;
  seasonPokemonId: number | null;
  // rawName is only set for rows that came back from Fetch & Parse unresolved —
  // it's what the replay called the Pokémon, shown so the moderator knows which
  // one to pick.
  rawName: string | null;
  directKills: string;
  indirectKills: string;
  deaths: string;
}

export interface ManualGameDraft {
  key: string;
  // The loser is always the match's other team, so only the winner is picked.
  winningTeamId: number | null;
  differential: string;
  replayLink: string;
  statsOpen: boolean;
  stats: ManualStatDraft[];
  // ─── Fetch & Parse state, per row ───
  analyzing: boolean;
  // Inline preview-error text from the last analyze-game attempt.
  analysisError: string | null;
  // The replay's two players as detected by the parser, or null if this row has
  // never been parsed. Drives the player-override affordance.
  detectedPlayers: PlayerPreviewDto[] | null;
  // playerIndex → teamId, accumulated across re-analyses of this row.
  playerOverrides: Record<number, number>;
}

export interface ManualTeamOption {
  teamId: number;
  teamName: string;
}

/** One selectable match in the manual-entry match picker. */
export interface ManualMatchOption {
  matchId: number;
  weekId: number;
  weekName: string;
  weekNumber: number;
  teams: ManualTeamOption[];
  hasResult: boolean;
  resultLabel: string | null;
}
