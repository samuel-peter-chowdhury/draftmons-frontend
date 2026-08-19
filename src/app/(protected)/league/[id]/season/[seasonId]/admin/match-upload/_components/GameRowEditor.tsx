'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Select,
  Spinner,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components';
import { cn } from '@/lib/utils';
import type { SeasonPokemonInput } from '@/types';
import { StatRowEditor } from './StatRowEditor';
import type { ManualGameDraft, ManualStatDraft, ManualTeamOption } from './manual-entry.types';

interface GameRowEditorProps {
  game: ManualGameDraft;
  gameNumber: number;
  teams: ManualTeamOption[];
  poolByTeam: { team: ManualTeamOption; pool: SeasonPokemonInput[] }[];
  canRemove: boolean;
  onChange: (patch: Partial<ManualGameDraft>) => void;
  onFetchParse: () => void;
  onOverridePlayer: (playerIndex: number, teamId: number) => void;
  onRemove: () => void;
}

// Stable React keys for locally-added stat rows; only needs to be unique within a
// single game's stats array.
let statKeySeq = 0;

/** Cheap client-side gate for the Fetch & Parse button — the server does the real check. */
function looksLikeUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function GameRowEditor({
  game,
  gameNumber,
  teams,
  poolByTeam,
  canRemove,
  onChange,
  onFetchParse,
  onOverridePlayer,
  onRemove,
}: GameRowEditorProps) {
  // Auto-expand the override panel when the parser couldn't place a player.
  const [overridesOpen, setOverridesOpen] = useState(false);
  const hasUnresolvedPlayer = (game.detectedPlayers ?? []).some((p) => p.teamId === null);
  const showOverrides = overridesOpen || hasUnresolvedPlayer;

  function updateStat(key: string, patch: Partial<ManualStatDraft>) {
    onChange({
      stats: game.stats.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    });
  }

  function addStat() {
    onChange({
      statsOpen: true,
      stats: [
        ...game.stats,
        {
          key: `local-stat-${(statKeySeq += 1)}`,
          seasonPokemonId: null,
          rawName: null,
          directKills: '0',
          indirectKills: '0',
          deaths: '0',
        },
      ],
    });
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Row header */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-semibold">Game {gameNumber}</p>
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Remove game ${gameNumber}`}
              onClick={onRemove}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>

        {/* Winner + differential */}
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Winner</label>
            <Select
              value={game.winningTeamId !== null ? String(game.winningTeamId) : ''}
              className={cn('w-48', game.winningTeamId === null && 'ring-1 ring-destructive')}
              onChange={(e) =>
                onChange({ winningTeamId: e.target.value === '' ? null : Number(e.target.value) })
              }
            >
              <option value="" disabled>
                Select winner
              </option>
              {teams.map((t) => (
                <option key={t.teamId} value={String(t.teamId)}>
                  {t.teamName}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Differential</label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              className="w-24"
              value={game.differential}
              onChange={(e) => onChange({ differential: e.target.value })}
            />
          </div>
        </div>

        {/* Optional replay link + Fetch & Parse */}
        <div className="mb-4 flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Replay link (optional)</label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="url"
              placeholder="Showdown replay link, or a third-party server's .html replay"
              className="max-w-xl"
              value={game.replayLink}
              disabled={game.analyzing}
              onChange={(e) => onChange({ replayLink: e.target.value })}
            />
            <Button
              variant="secondary"
              disabled={game.analyzing || !looksLikeUrl(game.replayLink)}
              onClick={onFetchParse}
            >
              {game.analyzing ? <Spinner size={16} /> : 'Fetch & Parse'}
            </Button>
          </div>
          {game.analysisError && <p className="text-sm text-destructive">{game.analysisError}</p>}
          {game.detectedPlayers && !game.analysisError && (
            <p className="text-sm text-muted-foreground">
              Parsed — winner, differential and stats pre-filled below. Edit anything that looks
              wrong before submitting.
            </p>
          )}
        </div>

        {/* Player overrides — only meaningful once a replay has been parsed */}
        {game.detectedPlayers && (
          <div className="mb-4 rounded-md border border-border">
            <button
              type="button"
              className="flex w-full items-center gap-2 p-2 text-left text-sm"
              onClick={() => setOverridesOpen((prev) => !prev)}
            >
              {showOverrides ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
              <span className="flex-1">Player → team mapping</span>
              {hasUnresolvedPlayer && <Badge variant="destructive">Unresolved</Badge>}
            </button>
            {showOverrides && (
              <div className="flex flex-col gap-2 border-t border-border p-3">
                {game.detectedPlayers.map((player, playerIndex) => (
                  <div key={playerIndex} className="flex flex-wrap items-center gap-2">
                    <span className="min-w-40 text-sm">{player.rawShowdownName}</span>
                    <Select
                      value={player.teamId !== null ? String(player.teamId) : ''}
                      className={cn('w-48', player.teamId === null && 'ring-1 ring-destructive')}
                      disabled={game.analyzing}
                      onChange={(e) =>
                        e.target.value !== '' &&
                        onOverridePlayer(playerIndex, Number(e.target.value))
                      }
                    >
                      <option value="" disabled>
                        Select team
                      </option>
                      {teams.map((t) => (
                        <option key={t.teamId} value={String(t.teamId)}>
                          {t.teamName}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Changing a mapping re-parses this replay against the chosen team.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Optional stats */}
        <div className="rounded-md border border-border">
          <button
            type="button"
            className="flex w-full items-center gap-2 p-2 text-left text-sm"
            onClick={() => onChange({ statsOpen: !game.statsOpen })}
          >
            {game.statsOpen ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
            <span className="flex-1">
              Stats {game.stats.length > 0 && `(${game.stats.length})`}
            </span>
          </button>

          {game.statsOpen && (
            <div className="border-t border-border p-2">
              {game.stats.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                  No stats recorded for this game.
                </p>
              ) : (
                <Table className="[&_td]:p-2 [&_th]:h-8 [&_th]:px-2 [&_th]:py-1">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground">Pokémon</TableHead>
                      <TableHead className="text-muted-foreground">Direct Kills</TableHead>
                      <TableHead className="text-muted-foreground">Indirect Kills</TableHead>
                      <TableHead className="text-muted-foreground">Deaths</TableHead>
                      <TableHead className="sr-only">Remove</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {game.stats.map((stat) => (
                      <StatRowEditor
                        key={stat.key}
                        stat={stat}
                        poolByTeam={poolByTeam}
                        onChange={(patch) => updateStat(stat.key, patch)}
                        onRemove={() =>
                          onChange({ stats: game.stats.filter((s) => s.key !== stat.key) })
                        }
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
              <Button variant="outline" size="sm" className="mt-2" onClick={addStat}>
                <Plus className="mr-1 size-4" />
                Add Pokémon
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
