'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components';

type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
type EvIv = Record<StatKey, number>;

const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
};

interface StatsModalProps {
  title: string;
  value: EvIv;
  onChange: (next: EvIv) => void;
  maxPerStat: number;
  maxTotal: number;
  natures?: string[];
  selectedNature?: string;
  onNatureChange?: (nature: string) => void;
  baseStats?: Record<StatKey, number>; // For calculating final stats
}

export function StatsModal({
  title,
  value,
  onChange,
  maxPerStat,
  maxTotal,
  natures = [],
  selectedNature = '',
  onNatureChange,
  baseStats,
}: StatsModalProps) {
  const total = Object.values(value).reduce((a, b) => a + b, 0);

  function setStat(k: StatKey, val: number) {
    const clamped = Math.max(0, Math.min(maxPerStat, val));
    onChange({ ...value, [k]: clamped });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-sm text-muted-foreground">
          Total: {total} / {maxTotal}
        </div>
      </div>

      {/* Stat Sliders */}
      <div className="space-y-4">
        {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).map((k) => (
          <div key={k} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium uppercase tracking-wide">
                {STAT_LABELS[k]}
              </label>
              <div className="text-sm font-mono">{value[k]}</div>
            </div>
            <input
              type="range"
              min="0"
              max={maxPerStat}
              value={value[k]}
              onChange={(e) => setStat(k, parseInt(e.target.value, 10))}
              className="w-full cursor-pointer accent-blue-500"
            />
          </div>
        ))}
      </div>

      {/* Nature Selector */}
      {natures.length > 0 && onNatureChange && (
        <div className="space-y-3 border-t pt-4">
          <label className="text-sm font-medium">Nature</label>
          <select
            value={selectedNature}
            onChange={(e) => onNatureChange(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select Nature...</option>
            {natures.map((nature) => (
              <option key={nature} value={nature}>
                {nature}
              </option>
            ))}
          </select>
        </div>
      )}

      {total > maxTotal && (
        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">
          Total exceeds {maxTotal}
        </div>
      )}
    </div>
  );
}