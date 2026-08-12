'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useFetch, useCheckAuth } from '@/hooks';
import { LeagueApi, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { TeamInput, SeasonInput, SeasonPokemonTeamOutput } from '@/types';
import { useAuthStore } from '@/stores';



import TeamBuilder from './components/TeamBuilder';
import PokemonPool from './components/pokemonPool';
import SearchPokemonPanel from './components/PokemonSearchPanel';

export default function Page() {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);
  const { user: currentUser } = useAuthStore();

  // types 
  type Paginated<T> = {
    data: T[];
    page: number;
    pageSize: number;
    total: number;
  };

  type EvIv = { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };

  type PokemonPoolPokemon = {
    pokemonId: number | null;
    name: string;
    item: string;
    ability: string;
    nature: string;
    moves: string[];               // length 4
    spriteUrl: string;
    types: {
      id: number;
      name: string; 
      color: string;
    }[];
  };

  type PokemonSet = {
    pokemonId: number | null;
    name: string;
    item: string;
    ability: string;
    nature: string;
    moves: string[];               // length 4
    evs: EvIv;
    ivs: EvIv;
    sprite: string;
  };

  type BuilderState = {
    team: PokemonSet[];            // length 6
    selectedSlot: number;          // 0..5
    opponentTeam: PokemonSet[];    
  };

  // component states
  const [draftedPool, setDraftedPool] = useState<PokemonPoolPokemon[]>([]);
  const [team, setTeam] = useState<PokemonSet[]>([]);
  const [testFetch, setTestFetch] = useState("nothing yet");
  const [selectedSlot, setSelectedSlot] = useState(0);

  useCheckAuth();

  // fetching data
  const {
    data: season,
    loading: seasonLoading,
    error: seasonError,
    refetch: refetchSeason,
  } = useFetch<SeasonInput>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season', seasonId], { full: true }),
  );

  const myTeam = season?.teams?.find((t) => t.userId === currentUser?.id);
  const myTeamId = myTeam?.id.toString(); 

  const {
    data: draftedTeamData,
    loading,
    error,
    refetch,
  } = useFetch<Paginated<SeasonPokemonTeamOutput>>(
    buildUrlWithQuery(BASE_ENDPOINTS.SEASON_POKEMON_TEAM_BASE, [], { full: true, teamId: myTeamId, page: 1, pageSize: 100 }),
  );

  // const draftedRows = (allTeamData. || []).filter((r) => r.teamId === myTeamId);
  // debugging
  // const seasonUrl = buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season', seasonId], { full: true });
  // console.log('seasonUrl:', seasonUrl);
  useEffect(() => {
    // console.log('currentUser: ', currentUser)
    // console.log('currentUser id:', currentUser?.id);
    // console.log('myTeamId:', myTeamId);
    // console.log('draftedTeamData: ', draftedTeamData)
  }, [season, currentUser, myTeamId, draftedTeamData]);

  useEffect(() => {
    console.log('useEffect', draftedTeamData)
    if (!draftedTeamData) return;

    // adjust depending on actual response shape
    const rows = Array.isArray(draftedTeamData)
      ? draftedTeamData
      : draftedTeamData.data ?? [];

    const parsed: PokemonPoolPokemon[] = rows.map((row: any) => {
      console.log('row: ', row)
      const sp = row.seasonPokemon;
      const p = sp.pokemon;
      const pokemonId = p.id ?? sp?.pokemonId ?? null;
      const parsedPokemonObj: PokemonPoolPokemon = {
        pokemonId,
        name: p.name,
        item: '',
        ability: '',
        nature: '',
        moves: ['', '', '', ''],
        spriteUrl: p.spriteUrl,
        types: []
      }
      p.pokemonTypes.forEach((typeObj: any) => {
        parsedPokemonObj.types.push({
          id: typeObj.id,
          name: typeObj.name,
          color: typeObj.color
        })
      })
      return parsedPokemonObj;
    });
    console.log('parsed! ', parsed)
    setDraftedPool(parsed);

  }, [draftedTeamData]);



  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="text-2xl font-semibold mb-2">/league/{params.id}/season/{params.seasonId}/tools/team-builder</h1>
      <p className="text-muted-foreground">This section is scaffolded and ready for future functionality.</p>
      {/* <h6>{draftedTeamData ? JSON.stringify(draftedTeamData) : null}</h6> */}
      <PokemonPool
        drafted={draftedPool}
        selectedSlot={selectedSlot}
        onPickPokemon={(pokemonId : number|null) => {
          // later: assignPokemonToSlot(selectedSlot, pokemonId)
          console.log('pick', pokemonId, 'into slot', selectedSlot);
        }}      />

        <TeamBuilder initialPool={[]}/>
    </div>
  );
}
