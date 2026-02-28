'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  ErrorAlert,
  Select,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components';
import { PokemonModal } from '@/components/pokemon/PokemonModal';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { getStatColor, calculateSpeedTiers } from '@/lib/pokemon';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { formatUserDisplayName } from '@/lib/utils';
import type {
  SeasonInput,
  PaginatedResponse,
  SeasonPokemonTeamInput,
  PokemonInput,
  TeamInput,
  GameInput,
  GameStatInput,
} from '@/types';

interface SpeedTierPokemon {
  pokemon: PokemonInput;
  speedTiers: ReturnType<typeof calculateSpeedTiers>;
}

function SpeedTierColumn({
  teamName,
  pokemon,
  loading,
  error,
  onSpriteClick,
}: {
  teamName: string;
  pokemon: SpeedTierPokemon[];
  loading: boolean;
  error: string | null;
  onSpriteClick: (pokemonId: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1">
        <ErrorAlert message={error} />
      </div>
    );
  }

  if (pokemon.length === 0) {
    return (
      <div className="flex-1">
        <p className="py-6 text-center text-sm text-muted-foreground">No Pokemon found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto">
      <h3 className="mb-3 text-sm font-semibold">{teamName}</h3>
      {/* Column headers */}
      <div className="grid grid-cols-[48px_1fr_60px_60px_60px_60px] items-center gap-x-2 px-2 pb-1 text-[11px] font-medium text-muted-foreground">
        <span />
        <span>Name</span>
        <span className="text-right">Base</span>
        <span className="text-right">Neutral</span>
        <span className="text-right">+Nat</span>
        <span className="text-right">+Nat/+1</span>
      </div>
      <div className="space-y-0">
        {pokemon.map(({ pokemon: pkmn, speedTiers }) => (
          <div
            key={pkmn.id}
            className="grid grid-cols-[48px_1fr_60px_60px_60px_60px] items-center gap-x-2 rounded-md px-2 py-1 transition-colors hover:bg-secondary/50"
          >
            <PokemonSprite
              pokemonId={pkmn.id}
              spriteUrl={pkmn.spriteUrl}
              name={pkmn.name}
              className="h-10 w-10 object-contain"
              onClick={onSpriteClick}
            />
            <span className="truncate text-sm capitalize">{pkmn.name}</span>
            <span
              className="text-right text-sm font-semibold"
              style={{ color: getStatColor(pkmn.speed) }}
            >
              {pkmn.speed}
            </span>
            <span className="text-right text-sm text-muted-foreground">
              {speedTiers.maxNeutral}
            </span>
            <span className="text-right text-sm text-muted-foreground">
              {speedTiers.maxPositive}
            </span>
            <span className="text-right text-sm text-muted-foreground">
              {speedTiers.maxPositivePlus1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="truncate text-sm">{value || '—'}</p>
      </div>
      {value && (
        <button
          onClick={handleCopy}
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

function TeamInfoColumn({
  team,
  teamPokemon,
  gameStats,
  seasonTeams,
  loading,
  error,
  onSpriteClick,
}: {
  team: TeamInput | null;
  teamPokemon: SeasonPokemonTeamInput[];
  gameStats: GameStatInput[];
  seasonTeams: TeamInput[];
  loading: boolean;
  error: string | null;
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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1">
        <ErrorAlert message={error} />
      </div>
    );
  }

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
        <h3 className="text-sm font-semibold">{team.name}</h3>
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
                  spriteUrl={leader.pokemon.spriteUrl}
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
            <span className="font-normal text-muted-foreground">({matchRecord.pct.toFixed(1)}%)</span>
          </p>
        </div>
        <div className="rounded-md border border-border p-3">
          <span className="text-xs font-medium text-muted-foreground">Game Record</span>
          <p className="text-sm font-semibold">
            {gameRecord.wins}-{gameRecord.losses}{' '}
            <span className="font-normal text-muted-foreground">({gameRecord.pct.toFixed(1)}%)</span>
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
                    ? 'border-l-green-500 bg-green-500/5'
                    : 'border-l-red-500 bg-red-500/5'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {match.weekName}
                    <span className="ml-1 text-muted-foreground">vs {match.opponentName}</span>
                  </span>
                  <span
                    className={`text-xs font-semibold ${match.matchWon ? 'text-green-500' : 'text-red-500'}`}
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
                            gameWon ? 'text-green-500' : 'text-red-500'
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

export default function TeamMatchupPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [teamAId, setTeamAId] = useState<number | null>(() => {
    const val = searchParams.get('teamAId');
    return val ? Number(val) : null;
  });
  const [teamBId, setTeamBId] = useState<number | null>(() => {
    const val = searchParams.get('teamBId');
    return val ? Number(val) : null;
  });
  const [activeTab, setActiveTab] = useState<string>(
    () => searchParams.get('tab') || 'speed-tiers',
  );

  const updateSearchParams = useCallback(
    (newTeamAId: number | null, newTeamBId: number | null, tab?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newTeamAId !== null) {
        params.set('teamAId', String(newTeamAId));
      } else {
        params.delete('teamAId');
      }
      if (newTeamBId !== null) {
        params.set('teamBId', String(newTeamBId));
      } else {
        params.delete('teamBId');
      }
      const tabValue = tab ?? activeTab;
      if (tabValue && tabValue !== 'speed-tiers') {
        params.set('tab', tabValue);
      } else {
        params.delete('tab');
      }
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}` as any, { scroll: false });
    },
    [searchParams, pathname, router, activeTab],
  );
  const [modalPokemonId, setModalPokemonId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch season with teams
  const {
    data: season,
    loading: seasonLoading,
    error: seasonError,
  } = useFetch<SeasonInput>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season', seasonId], { full: true }),
  );

  const teams = season?.teams ?? [];

  // Fetch Team A Pokemon
  const teamAUrl = teamAId
    ? buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_TEAM_BASE, [], {
        teamId: teamAId,
        full: true,
        pageSize: 50,
      })
    : null;
  const {
    data: teamAData,
    loading: teamALoading,
    error: teamAError,
  } = useFetch<PaginatedResponse<SeasonPokemonTeamInput>>(teamAUrl);

  // Fetch Team B Pokemon
  const teamBUrl = teamBId
    ? buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_TEAM_BASE, [], {
        teamId: teamBId,
        full: true,
        pageSize: 50,
      })
    : null;
  const {
    data: teamBData,
    loading: teamBLoading,
    error: teamBError,
  } = useFetch<PaginatedResponse<SeasonPokemonTeamInput>>(teamBUrl);

  // Fetch full team data (user info, matches, games)
  const teamAFullUrl = teamAId
    ? buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'team', teamAId], { full: true })
    : null;
  const {
    data: teamAFull,
    loading: teamAFullLoading,
    error: teamAFullError,
  } = useFetch<TeamInput>(teamAFullUrl);

  const teamBFullUrl = teamBId
    ? buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'team', teamBId], { full: true })
    : null;
  const {
    data: teamBFull,
    loading: teamBFullLoading,
    error: teamBFullError,
  } = useFetch<TeamInput>(teamBFullUrl);

  // Fetch game stats filtered by game IDs (dependent on full team data)
  const teamAGameIds = useMemo(() => {
    if (!teamAFull) return null;
    const won = teamAFull.wonGames?.map((g) => g.id) ?? [];
    const lost = teamAFull.lostGames?.map((g) => g.id) ?? [];
    const ids = [...won, ...lost];
    return ids.length > 0 ? ids : null;
  }, [teamAFull]);

  const teamAGameStatsUrl = teamAGameIds
    ? buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'game-stat'], {
        gameIds: teamAGameIds,
        pageSize: 999,
      })
    : null;
  const {
    data: teamAGameStatsRaw,
    loading: teamAGameStatsLoading,
    error: teamAGameStatsError,
  } = useFetch<PaginatedResponse<GameStatInput>>(teamAGameStatsUrl);

  const teamBGameIds = useMemo(() => {
    if (!teamBFull) return null;
    const won = teamBFull.wonGames?.map((g) => g.id) ?? [];
    const lost = teamBFull.lostGames?.map((g) => g.id) ?? [];
    const ids = [...won, ...lost];
    return ids.length > 0 ? ids : null;
  }, [teamBFull]);

  const teamBGameStatsUrl = teamBGameIds
    ? buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'game-stat'], {
        gameIds: teamBGameIds,
        pageSize: 999,
      })
    : null;
  const {
    data: teamBGameStatsRaw,
    loading: teamBGameStatsLoading,
    error: teamBGameStatsError,
  } = useFetch<PaginatedResponse<GameStatInput>>(teamBGameStatsUrl);

  // Extract game stats arrays (handle both paginated and direct array responses)
  const teamAGameStats = useMemo<GameStatInput[]>(() => {
    if (!teamAGameStatsRaw) return [];
    return Array.isArray(teamAGameStatsRaw)
      ? (teamAGameStatsRaw as unknown as GameStatInput[])
      : teamAGameStatsRaw.data;
  }, [teamAGameStatsRaw]);

  const teamBGameStats = useMemo<GameStatInput[]>(() => {
    if (!teamBGameStatsRaw) return [];
    return Array.isArray(teamBGameStatsRaw)
      ? (teamBGameStatsRaw as unknown as GameStatInput[])
      : teamBGameStatsRaw.data;
  }, [teamBGameStatsRaw]);

  // Extract and sort pokemon by speed desc
  const teamAPokemon = useMemo<SpeedTierPokemon[]>(() => {
    if (!teamAData) return [];
    return teamAData.data
      .filter((spt) => spt.seasonPokemon?.pokemon)
      .map((spt) => ({
        pokemon: spt.seasonPokemon!.pokemon!,
        speedTiers: calculateSpeedTiers(spt.seasonPokemon!.pokemon!.speed),
      }))
      .sort((a, b) => b.pokemon.speed - a.pokemon.speed);
  }, [teamAData]);

  const teamBPokemon = useMemo<SpeedTierPokemon[]>(() => {
    if (!teamBData) return [];
    return teamBData.data
      .filter((spt) => spt.seasonPokemon?.pokemon)
      .map((spt) => ({
        pokemon: spt.seasonPokemon!.pokemon!,
        speedTiers: calculateSpeedTiers(spt.seasonPokemon!.pokemon!.speed),
      }))
      .sort((a, b) => b.pokemon.speed - a.pokemon.speed);
  }, [teamBData]);

  const teamAName = teams.find((t) => t.id === teamAId)?.name ?? 'Team A';
  const teamBName = teams.find((t) => t.id === teamBId)?.name ?? 'Team B';

  const handleSpriteClick = (pokemonId: number) => {
    setModalPokemonId(pokemonId);
    setModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Team Matchup</h1>

      {seasonError && <ErrorAlert message={seasonError} />}

      {seasonLoading && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {season && (
        <div className="space-y-4">
          {/* Team selectors */}
          <div className="flex flex-wrap gap-4">
            <div className="w-64">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Team A
              </label>
              <Select
                value={teamAId?.toString() ?? ''}
                onChange={(e) => {
                  const newId = e.target.value ? Number(e.target.value) : null;
                  setTeamAId(newId);
                  updateSearchParams(newId, teamBId);
                }}
              >
                <option value="">Select a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-64">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Team B
              </label>
              <Select
                value={teamBId?.toString() ?? ''}
                onChange={(e) => {
                  const newId = e.target.value ? Number(e.target.value) : null;
                  setTeamBId(newId);
                  updateSearchParams(teamAId, newId);
                }}
              >
                <option value="">Select a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              updateSearchParams(teamAId, teamBId, value);
            }}
          >
            <TabsList>
              <TabsTrigger value="speed-tiers">Speed Tiers</TabsTrigger>
              <TabsTrigger value="team-info">Team Info</TabsTrigger>
              <TabsTrigger value="type-effectiveness" disabled>
                Type Effectiveness
              </TabsTrigger>
              <TabsTrigger value="special-moves" disabled>
                Special Moves
              </TabsTrigger>
              <TabsTrigger value="coverage-moves" disabled>
                Coverage Moves
              </TabsTrigger>
            </TabsList>

            {/* Speed Tiers tab */}
            <TabsContent value="speed-tiers">
              <Card>
                <CardContent className="pt-6">
                  {!teamAId && !teamBId ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Select at least one team to view speed tiers.
                    </p>
                  ) : (
                    <div className="flex gap-8">
                      {teamAId && (
                        <SpeedTierColumn
                          teamName={teamAName}
                          pokemon={teamAPokemon}
                          loading={teamALoading}
                          error={teamAError}
                          onSpriteClick={handleSpriteClick}
                        />
                      )}
                      {teamBId && (
                        <SpeedTierColumn
                          teamName={teamBName}
                          pokemon={teamBPokemon}
                          loading={teamBLoading}
                          error={teamBError}
                          onSpriteClick={handleSpriteClick}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Info tab */}
            <TabsContent value="team-info">
              <Card>
                <CardContent className="pt-6">
                  {!teamAId && !teamBId ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Select at least one team to view team info.
                    </p>
                  ) : (
                    <div className="flex gap-8">
                      {teamAId && (
                        <TeamInfoColumn
                          team={teamAFull}
                          teamPokemon={teamAData?.data ?? []}
                          gameStats={teamAGameStats}
                          seasonTeams={teams}
                          loading={teamAFullLoading || teamAGameStatsLoading}
                          error={teamAFullError || teamAGameStatsError}
                          onSpriteClick={handleSpriteClick}
                        />
                      )}
                      {teamBId && (
                        <TeamInfoColumn
                          team={teamBFull}
                          teamPokemon={teamBData?.data ?? []}
                          gameStats={teamBGameStats}
                          seasonTeams={teams}
                          loading={teamBFullLoading || teamBGameStatsLoading}
                          error={teamBFullError || teamBGameStatsError}
                          onSpriteClick={handleSpriteClick}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="type-effectiveness">
              <Card>
                <CardContent className="pt-6">
                  <p className="py-6 text-center text-sm text-muted-foreground">Coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="special-moves">
              <Card>
                <CardContent className="pt-6">
                  <p className="py-6 text-center text-sm text-muted-foreground">Coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="coverage-moves">
              <Card>
                <CardContent className="pt-6">
                  <p className="py-6 text-center text-sm text-muted-foreground">Coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <PokemonModal pokemonId={modalPokemonId} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
