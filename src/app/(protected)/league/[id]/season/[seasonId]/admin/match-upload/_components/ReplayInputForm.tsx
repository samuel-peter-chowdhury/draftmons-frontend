'use client';

import { useState } from 'react';
import { Button, Input, ErrorAlert, Spinner } from '@/components';
import { Skeleton } from '@/components/ui/skeleton';

interface ReplayInputFormProps {
  numberOfGames: number;
  loading: boolean;
  error: string | null;
  onAnalyze: (urls: string[]) => void;
  seasonLoading?: boolean;
}

export function ReplayInputForm({
  numberOfGames,
  loading,
  error,
  onAnalyze,
  seasonLoading,
}: ReplayInputFormProps) {
  const [replayUrls, setReplayUrls] = useState<string[]>(() =>
    Array(numberOfGames).fill(''),
  );

  const rows = seasonLoading ? (numberOfGames ?? 3) : numberOfGames;

  const allEmpty = replayUrls.every((u) => u.trim() === '');

  function handleAnalyze() {
    onAnalyze(replayUrls.filter((u) => u.trim() !== ''));
  }

  if (seasonLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: numberOfGames }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">Game {i + 1}</label>
          <Input
            type="url"
            placeholder="https://replay.pokemonshowdown.com/…"
            className="w-full"
            value={replayUrls[i] ?? ''}
            disabled={loading}
            onChange={(e) => {
              const updated = [...replayUrls];
              updated[i] = e.target.value;
              setReplayUrls(updated);
            }}
          />
        </div>
      ))}
      <Button
        variant="default"
        disabled={loading || allEmpty}
        onClick={handleAnalyze}
        className="mt-2 self-start"
      >
        {loading ? <Spinner size={18} /> : 'Analyze Replays'}
      </Button>
      {error && <ErrorAlert message={error} />}
    </div>
  );
}
