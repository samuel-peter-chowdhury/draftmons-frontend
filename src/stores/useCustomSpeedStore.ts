'use client';

import { create } from 'zustand';
import {
  DEFAULT_CUSTOM_SPEED_INPUT,
  SPEED_EV_MAX,
  SPEED_IV_MAX,
  type CustomSpeedInput,
  type SpeedNature,
} from '@/lib/pokemon';

const LS_CUSTOM_SPEED_KEY = 'draftmons:customSpeedInput';

type CustomSpeedState = {
  input: CustomSpeedInput;
  /** False until `hydrate` has run, so the first paint always matches the server. */
  hydrated: boolean;
};

type CustomSpeedActions = {
  hydrate: () => void;
  setInput: (patch: Partial<CustomSpeedInput>) => void;
  reset: () => void;
};

function clampInput(input: CustomSpeedInput): CustomSpeedInput {
  return {
    ev: Math.max(0, Math.min(SPEED_EV_MAX, Math.round(input.ev))),
    iv: Math.max(0, Math.min(SPEED_IV_MAX, Math.round(input.iv))),
    nature: input.nature,
    stage: input.stage === null ? null : Math.max(-6, Math.min(6, Math.round(input.stage))),
  };
}

/**
 * Anything could be sitting under the key — a value from an older shape, or
 * hand-edited junk. Validate field by field and fall back to the default rather
 * than trusting the parse.
 */
function parseStored(raw: string): CustomSpeedInput | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const { ev, iv, nature, stage } = parsed as Record<string, unknown>;
  const natures: SpeedNature[] = ['positive', 'neutral', 'negative'];

  return clampInput({
    ev: typeof ev === 'number' && Number.isFinite(ev) ? ev : DEFAULT_CUSTOM_SPEED_INPUT.ev,
    iv: typeof iv === 'number' && Number.isFinite(iv) ? iv : DEFAULT_CUSTOM_SPEED_INPUT.iv,
    nature: natures.includes(nature as SpeedNature)
      ? (nature as SpeedNature)
      : DEFAULT_CUSTOM_SPEED_INPUT.nature,
    stage: typeof stage === 'number' && Number.isFinite(stage) && stage !== 0 ? stage : null,
  });
}

function persist(input: CustomSpeedInput): void {
  try {
    localStorage.setItem(LS_CUSTOM_SPEED_KEY, JSON.stringify(input));
  } catch {
    // Private browsing / quota — the calculator still works for this session.
  }
}

/**
 * The one EV/IV/nature/stage spread behind the Speed Tiers "Custom" column.
 *
 * Deliberately global rather than per-row or per-column: the same spread drives
 * every Pokemon on both sides, on both the team-matchup and team-build/compare
 * pages, so tiers stay comparable against a single scenario.
 *
 * Hydration is hand-rolled in `hydrate` (called from an effect) instead of
 * zustand's `persist` middleware, matching how the comparison pages already
 * read localStorage and keeping the server-rendered markup free of client-only
 * values.
 */
export const useCustomSpeedStore = create<CustomSpeedState & CustomSpeedActions>((set, get) => ({
  input: DEFAULT_CUSTOM_SPEED_INPUT,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const raw = typeof window === 'undefined' ? null : localStorage.getItem(LS_CUSTOM_SPEED_KEY);
    const stored = raw ? parseStored(raw) : null;
    set({ input: stored ?? DEFAULT_CUSTOM_SPEED_INPUT, hydrated: true });
  },

  setInput: (patch) => {
    const next = clampInput({ ...get().input, ...patch });
    set({ input: next });
    persist(next);
  },

  reset: () => {
    set({ input: DEFAULT_CUSTOM_SPEED_INPUT });
    persist(DEFAULT_CUSTOM_SPEED_INPUT);
  },
}));
