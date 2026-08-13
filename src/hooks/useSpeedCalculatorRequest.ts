'use client';

import { useCallback, useRef, useState } from 'react';
import type {
  CalculatorSideKey,
  SpeedCalculatorRequest,
} from '@/components/comparison/SpeedCalculatorModal';

/**
 * Open/close state for the shared speed calculator, owned by the comparison
 * pages because they're the only level that can see both sides at once.
 *
 * Each open carries a fresh nonce so the modal re-applies its auto-selection
 * even when the same Pokemon is clicked twice in a row — the request object
 * alone would look unchanged.
 */
export function useSpeedCalculatorRequest() {
  const [request, setRequest] = useState<SpeedCalculatorRequest | null>(null);
  const nonce = useRef(0);

  const open = useCallback((side: CalculatorSideKey, pokemonId: number | null) => {
    nonce.current += 1;
    setRequest({ side, pokemonId, nonce: nonce.current });
  }, []);

  const setOpen = useCallback((next: boolean) => {
    if (!next) setRequest(null);
  }, []);

  return { request, open, setOpen };
}
