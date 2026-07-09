'use client';

import { Button, Card, CardContent } from '@/components';

interface SuccessStateProps {
  result: {
    matchId: number;
    games: { id: number; gameNumber: number; replayLink: string }[];
  };
  weekName: string | null;
  onReset: () => void;
}

export function SuccessState({ result, weekName, onReset }: SuccessStateProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-base font-semibold">Match recorded successfully</p>
        <p className="text-sm text-muted-foreground">
          Match #{result.matchId} — {weekName ?? '—'}
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {result.games.map((game) => (
            <li key={game.id} className="text-sm text-muted-foreground">
              Game {game.gameNumber}
            </li>
          ))}
        </ul>
        <Button variant="outline" className="mt-4" onClick={onReset}>
          Upload another match
        </Button>
      </CardContent>
    </Card>
  );
}
