'use client';

import { Card, CardContent, Input, Select } from '@/components';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { GamePreviewDto, SeasonPokemonInput } from '@/types';
import { StatOverrideRow } from './StatOverrideRow';

interface Team {
  teamId: number;
  teamName: string;
}

interface GamePreviewCardProps {
  game: GamePreviewDto;
  teams: Team[];
  seasonPool: SeasonPokemonInput[];
  onOverrideGame: (
    field: 'winnerTeamId' | 'loserTeamId' | 'differential',
    value: number,
  ) => void;
  onOverridePokemon: (statIndex: number, seasonPokemonId: number) => void;
  onOverrideStat: (
    statIndex: number,
    field: 'directKills' | 'indirectKills' | 'deaths',
    value: number,
  ) => void;
}

export function GamePreviewCard({
  game,
  teams,
  seasonPool,
  onOverrideGame,
  onOverridePokemon,
  onOverrideStat,
}: GamePreviewCardProps) {
  const teamsDisabled = teams.length < 2;

  return (
    <Card>
      <CardContent className="p-4">
        {/* Game header */}
        <div className="mb-3">
          <p className="text-base font-semibold">Game {game.gameNumber}</p>
          <p className="truncate text-sm text-muted-foreground">{game.replayUrl}</p>
        </div>

        {/* Winner / Loser / Differential controls */}
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Winner</label>
            <Select
              value={game.winnerTeamId !== null ? String(game.winnerTeamId) : ''}
              disabled={teamsDisabled}
              className={cn(
                'w-48',
                game.winnerTeamId === null && 'ring-1 ring-destructive',
              )}
              onChange={(e) => onOverrideGame('winnerTeamId', Number(e.target.value))}
            >
              {teamsDisabled ? (
                <option value="">Resolve players first</option>
              ) : (
                <>
                  <option value="" disabled>
                    Select winner
                  </option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={String(t.teamId)}>
                      {t.teamName}
                    </option>
                  ))}
                </>
              )}
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Loser</label>
            <Select
              value={game.loserTeamId !== null ? String(game.loserTeamId) : ''}
              disabled={teamsDisabled}
              className={cn(
                'w-48',
                game.loserTeamId === null && 'ring-1 ring-destructive',
              )}
              onChange={(e) => onOverrideGame('loserTeamId', Number(e.target.value))}
            >
              {teamsDisabled ? (
                <option value="">Resolve players first</option>
              ) : (
                <>
                  <option value="" disabled>
                    Select loser
                  </option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={String(t.teamId)}>
                      {t.teamName}
                    </option>
                  ))}
                </>
              )}
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Differential</label>
            <Input
              type="number"
              min="0"
              className={cn(
                'w-24',
                game.differential === null && 'ring-1 ring-destructive',
              )}
              value={game.differential ?? ''}
              onChange={(e) => onOverrideGame('differential', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Stats table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">Pokémon</TableHead>
              <TableHead className="text-muted-foreground">Direct Kills</TableHead>
              <TableHead className="text-muted-foreground">Indirect Kills</TableHead>
              <TableHead className="text-muted-foreground">Deaths</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {game.stats.map((stat, statIndex) => (
              <StatOverrideRow
                key={statIndex}
                stat={stat}
                seasonPool={seasonPool}
                onOverridePokemon={(seasonPokemonId) =>
                  onOverridePokemon(statIndex, seasonPokemonId)
                }
                onOverrideStat={(field, value) => onOverrideStat(statIndex, field, value)}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
