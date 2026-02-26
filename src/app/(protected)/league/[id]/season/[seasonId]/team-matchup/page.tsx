'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
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
import type {
  SeasonInput,
  PaginatedResponse,
  SeasonPokemonTeamInput,
  PokemonInput,
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

export default function TeamMatchupPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  const [teamAId, setTeamAId] = useState<number | null>(null);
  const [teamBId, setTeamBId] = useState<number | null>(null);
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
                onChange={(e) => setTeamAId(e.target.value ? Number(e.target.value) : null)}
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
                onChange={(e) => setTeamBId(e.target.value ? Number(e.target.value) : null)}
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
          <Tabs defaultValue="speed-tiers">
            <TabsList>
              <TabsTrigger value="speed-tiers">Speed Tiers</TabsTrigger>
              <TabsTrigger value="type-coverage" disabled>
                Team Info
              </TabsTrigger>
              <TabsTrigger value="stat-comparison" disabled>
                Type Effectiveness
              </TabsTrigger>
              <TabsTrigger value="matchup-matrix" disabled>
                Special Moves
              </TabsTrigger>
              <TabsTrigger value="move-coverage" disabled>
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

            {/* Placeholder tabs */}
            <TabsContent value="type-coverage">
              <Card>
                <CardContent className="pt-6">
                  <p className="py-6 text-center text-sm text-muted-foreground">Coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="stat-comparison">
              <Card>
                <CardContent className="pt-6">
                  <p className="py-6 text-center text-sm text-muted-foreground">Coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="matchup-matrix">
              <Card>
                <CardContent className="pt-6">
                  <p className="py-6 text-center text-sm text-muted-foreground">Coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="move-coverage">
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
