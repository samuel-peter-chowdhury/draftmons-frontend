'use client';

import { memo, useMemo } from 'react';
import { ErrorAlert, Spinner, TeamLogo } from '@/components';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { ExternalLink } from 'lucide-react';
import { formatUserDisplayName } from '@/lib/utils';
import type {
  SeasonPokemonTeamInput,
  PokemonInput,
  TeamInput,
  TeamBuildInput,
  GameInput,
  GameStatInput,
} from '@/types';
import { CopyableField } from './CopyableField';

type TeamInfoColumnProps =
  | {
      mode: 'team';
      team: TeamInput | null;
      teamPokemon: SeasonPokemonTeamInput[];
      gameStats: GameStatInput[];
      seasonTeams: TeamInput[];
      loading: boolean;
      error: string | null;
      onSpriteClick: (pokemonId: number) => void;
    }
  | {
      mode: 'teamBuild';
      teamBuild: TeamBuildInput | null;
      pointTotal: number;
      loading: boolean;
      error: string | null;
    };

/**
 * Team Info column for the comparison views. Renders full team stats (records,
 * kill leaders, match history) for a real Team, or lightweight metadata
 * (generation / season / point total) for a TeamBuild.
 */
export const TeamInfoColumn = memo(function TeamInfoColumn(props: TeamInfoColumnProps) {
  if (props.loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <Spinner size={24} />
      </div>
    );
  }

  if (props.error) {
    return (
      <div className="flex-1">
        <ErrorAlert message={props.error} />
      </div>
    );
  }

  if (props.mode === 'teamBuild') {
    return <TeamBuildInfo teamBuild={props.teamBuild} pointTotal={props.pointTotal} />;
  }

  return (
    <TeamInfo
      team={props.team}
      teamPokemon={props.teamPokemon}
      gameStats={props.gameStats}
      seasonTeams={props.seasonTeams}
      onSpriteClick={props.onSpriteClick}
    />
  );
});

function TeamBuildInfo({
  teamBuild,
  pointTotal,
}: {
  teamBuild: TeamBuildInput | null;
  pointTotal: number;
}) {
  if (!teamBuild) {
    return (
      <div className="flex-1">
        <p className="py-6 text-center text-sm text-muted-foreground">No build data available.</p>
      </div>
    );
  }

  const rosterCount = teamBuild.teamBuildSets?.length ?? 0;

  return (
    <div className="flex-1 space-y-4 overflow-x-auto">
      <div>
        <h3 className="text-sm font-semibold">{teamBuild.name}</h3>
        <p className="text-xs text-muted-foreground">
          {teamBuild.season?.name ?? 'Standalone'}
        </p>
      </div>

      <div className="rounded-md border border-border p-3">
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-muted-foreground">Generation</span>
          <span className="text-sm">{teamBuild.generation?.name ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-muted-foreground">Season</span>
          <span className="text-sm">{teamBuild.season?.name ?? 'Standalone'}</span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-muted-foreground">Roster size</span>
          <span className="text-sm">
            {rosterCount} {rosterCount === 1 ? 'mon' : 'mons'}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-muted-foreground">Point total</span>
          <span className="text-sm font-semibold">{pointTotal} pts</span>
        </div>
      </div>
    </div>
  );
}

function TeamInfo({
  team,
  teamPokemon,
  gameStats,
  seasonTeams,
  onSpriteClick,
}: {
  team: TeamInput | null;
  teamPokemon: SeasonPokemonTeamInput[];
  gameStats: GameStatInput[];
  seasonTeams: TeamInput[];
  onSpriteClick: (pokemonId: number) => void;
}) {
  // Build seasonPokemonId → PokemonInput map from team's roster
  const seasonPokemonMap = useMemo(() => {
    const map = new Map<number, PokemonInput>();
    teamPokemon.forEach((spt) => {
      if (spt.seasonPokemon?.pokemon) {
        map.set(spt.seasonPokemonId, spt.seasonPokemon.pokemon);
      }
    });
    return map;
  }, [teamPokemon]);

  // Compute top 3 kill leaders: aggregate kills per seasonPokemonId, filter to team's pokemon
  const killLeaders = useMemo(() => {
    if (gameStats.length === 0 || seasonPokemonMap.size === 0) return [];
    const killMap = new Map<number, number>();
    gameStats.forEach((stat) => {
      if (seasonPokemonMap.has(stat.seasonPokemonId)) {
        const current = killMap.get(stat.seasonPokemonId) ?? 0;
        killMap.set(stat.seasonPokemonId, current + stat.directKills + stat.indirectKills);
      }
    });
    return Array.from(killMap.entries())
      .map(([spId, totalKills]) => ({ pokemon: seasonPokemonMap.get(spId)!, totalKills }))
      .filter((entry) => entry.pokemon)
      .sort((a, b) => b.totalKills - a.totalKills)
      .slice(0, 3);
  }, [gameStats, seasonPokemonMap]);

  // Compute records
  const matchRecord = useMemo(() => {
    if (!team) return { wins: 0, losses: 0, pct: 0 };
    const wins = team.wonMatches?.length ?? 0;
    const losses = team.lostMatches?.length ?? 0;
    const total = wins + losses;
    return { wins, losses, pct: total > 0 ? (wins / total) * 100 : 0 };
  }, [team]);

  const gameRecord = useMemo(() => {
    if (!team) return { wins: 0, losses: 0, pct: 0 };
    const wins = team.wonGames?.length ?? 0;
    const losses = team.lostGames?.length ?? 0;
    const total = wins + losses;
    return { wins, losses, pct: total > 0 ? (wins / total) * 100 : 0 };
  }, [team]);

  // Build match history from wonGames + lostGames, grouped by matchId
  const teamNameMap = useMemo(() => {
    const map = new Map<number, string>();
    seasonTeams.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [seasonTeams]);

  const matchHistory = useMemo(() => {
    if (!team) return [];
    const teamId = team.id;
    const wonMatchIds = new Set((team.wonMatches ?? []).map((m) => m.id));
    const allGames = [...(team.wonGames ?? []), ...(team.lostGames ?? [])];

    const groupMap = new Map<
      number,
      { weekName: string; opponentName: string; games: GameInput[] }
    >();
    allGames.forEach((game) => {
      const existing = groupMap.get(game.matchId);
      if (existing) {
        existing.games.push(game);
      } else {
        const opponentId =
          game.winningTeamId === teamId ? game.losingTeamId : game.winningTeamId;
        groupMap.set(game.matchId, {
          weekName: game.match?.week?.name ?? 'Unknown Week',
          opponentName: teamNameMap.get(opponentId) ?? 'Unknown',
          games: [game],
        });
      }
    });

    return Array.from(groupMap.entries())
      .map(([matchId, { weekName, opponentName, games }]) => ({
        matchId,
        weekName,
        opponentName,
        matchWon: wonMatchIds.has(matchId),
        games,
      }))
      .sort((a, b) => a.weekName.localeCompare(b.weekName, undefined, { numeric: true }));
  }, [team, teamNameMap]);

  if (!team) {
    return (
      <div className="flex-1">
        <p className="py-6 text-center text-sm text-muted-foreground">No team data available.</p>
      </div>
    );
  }

  const teamId = team.id;

  return (
    <div className="flex-1 space-y-4 overflow-x-auto">
      {/* Team Header */}
      <div>
        <div className="flex items-center gap-2">
          <TeamLogo logoUrl={team.logoUrl} name={team.name} className="h-7 w-7" />
          <h3 className="text-sm font-semibold">{team.name}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{formatUserDisplayName(team.user)}</p>
      </div>

      {/* User Details */}
      <div className="rounded-md border border-border p-3">
        <CopyableField label="Discord" value={team.user?.discordUsername ?? ''} />
        <CopyableField label="Showdown" value={team.user?.showdownUsername ?? ''} />
        <CopyableField label="Timezone" value={team.user?.timezone ?? ''} />
      </div>

      {/* Kill Leaders */}
      <div className="rounded-md border border-border p-3">
        <span className="text-xs font-medium text-muted-foreground">Kill Leaders</span>
        {killLeaders.length > 0 ? (
          <div className="mt-1 flex gap-4">
            {killLeaders.map((leader, index) => (
              <div key={leader.pokemon.id} className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">{index + 1}</span>
                <PokemonSprite
                  pokemonId={leader.pokemon.id}
                  spriteUrl={leader.pokemon.spritePngUrl}
                  name={leader.pokemon.name}
                  className="h-8 w-8 object-contain"
                  onClick={onSpriteClick}
                />
                <div>
                  <p className="text-xs font-medium capitalize">{leader.pokemon.name}</p>
                  <p className="text-[11px] text-muted-foreground">{leader.totalKills} kills</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">No data</p>
        )}
      </div>

      {/* Records */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border p-3">
          <span className="text-xs font-medium text-muted-foreground">Match Record</span>
          <p className="text-sm font-semibold">
            {matchRecord.wins}-{matchRecord.losses}{' '}
            <span className="font-normal text-muted-foreground">
              ({matchRecord.pct.toFixed(1)}%)
            </span>
          </p>
        </div>
        <div className="rounded-md border border-border p-3">
          <span className="text-xs font-medium text-muted-foreground">Game Record</span>
          <p className="text-sm font-semibold">
            {gameRecord.wins}-{gameRecord.losses}{' '}
            <span className="font-normal text-muted-foreground">
              ({gameRecord.pct.toFixed(1)}%)
            </span>
          </p>
        </div>
      </div>

      {/* Match History */}
      <div>
        <span className="text-xs font-medium text-muted-foreground">Match History</span>
        {matchHistory.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">No matches played.</p>
        ) : (
          <div className="mt-2 space-y-3">
            {matchHistory.map((match) => (
              <div
                key={match.matchId}
                className={`rounded-md border-l-4 p-3 ${
                  match.matchWon
                    ? 'border-l-success bg-success/5'
                    : 'border-l-destructive bg-destructive/5'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {match.weekName}
                    <span className="ml-1 text-muted-foreground">vs {match.opponentName}</span>
                  </span>
                  <span
                    className={`text-xs font-semibold ${match.matchWon ? 'text-success' : 'text-destructive'}`}
                  >
                    {match.matchWon ? 'W' : 'L'}
                  </span>
                </div>
                <div className="space-y-1">
                  {match.games.map((game) => {
                    const gameWon = game.winningTeamId === teamId;
                    return (
                      <div
                        key={game.id}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span
                          className={`font-mono text-xs font-semibold ${
                            gameWon ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {gameWon ? '+' : '-'}
                          {game.differential}
                        </span>
                        {game.replayLink && (
                          <a
                            href={game.replayLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                          >
                            Replay
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
