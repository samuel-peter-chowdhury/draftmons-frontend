'use client';

import { useState } from 'react';

interface Ability {
  id: number;
  name: string;
  description?: string;
}

interface Move {
  id?: number;
  name: string;
  description?: string;
}

interface MovesAbilitiesEditorProps {
  abilities: Ability[];
  selectedAbility: string;
  onAbilityChange: (ability: string) => void;

  moves: [string, string, string, string];
  onMovesChange: (moves: [string, string, string, string]) => void;
  availableMoves?: string[]; // If you have a list of all available moves
}

export function MovesAbilitiesEditor({
  abilities,
  selectedAbility,
  onAbilityChange,
  moves,
  onMovesChange,
  availableMoves = [],
}: MovesAbilitiesEditorProps) {
  const [focusedMove, setFocusedMove] = useState<number | null>(null);

  function updateMove(index: 0 | 1 | 2 | 3, moveName: string) {
    const newMoves: [string, string, string, string] = [...moves] as any;
    newMoves[index] = moveName;
    onMovesChange(newMoves);
  }

  return (
    <div className="space-y-6">
      {/* Abilities Section */}
      <div className="space-y-3">
        <label className="text-sm font-semibold uppercase tracking-wide">
          Ability
        </label>
        <div className="space-y-2">
          {abilities.length > 0 ? (
            <select
              value={selectedAbility}
              onChange={(e) => onAbilityChange(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select ability...</option>
              {abilities.map((ability) => (
                <option key={ability.id} value={ability.name}>
                  {ability.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-md bg-muted p-2 text-sm text-muted-foreground">
              No abilities available
            </div>
          )}
          {selectedAbility && (
            <div className="rounded-md bg-background/50 p-2">
              <p className="text-xs text-muted-foreground">
                {abilities.find((a) => a.name === selectedAbility)?.description ||
                  'No description available'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Moves Section */}
      <div className="space-y-3 border-t pt-4">
        <label className="text-sm font-semibold uppercase tracking-wide">
          Moves
        </label>
        <div className="grid gap-2">
          {moves.map((move, idx) => (
            <div key={idx} className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Move {idx + 1}
              </label>
              <input
                type="text"
                value={move}
                onChange={(e) => updateMove(idx as any, e.target.value)}
                placeholder={`Enter move ${idx + 1}`}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
        {availableMoves.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">Quick select:</p>
            <div className="flex flex-wrap gap-1">
              {availableMoves.slice(0, 6).map((moveName) => (
                <button
                  key={moveName}
                  type="button"
                  onClick={() => {
                    // Find first empty move slot
                    const emptyIdx = moves.findIndex((m) => !m);
                    if (emptyIdx !== -1) {
                      updateMove(emptyIdx as any, moveName);
                    }
                  }}
                  className="rounded-full border border-border bg-background/50 px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {moveName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}