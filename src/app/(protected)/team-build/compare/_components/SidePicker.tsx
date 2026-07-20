'use client';

import { useEffect, useState } from 'react';
import { Button, Select } from '@/components';
import { useFetch } from '@/hooks';
import { buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { useAuthStore } from '@/stores';
import type {
  PaginatedResponse,
  SeasonInput,
  TeamBuildInput,
  TeamInput,
  LeagueInput,
} from '@/types';

type Mode = 'build' | 'team';

interface SidePickerProps {
  label: string;
  /** Encoded source: `teamBuild:<id>` or `team:<leagueId>:<seasonId>:<teamId>`. */
  value: string | null;
  onChange: (value: string | null) => void;
}

interface ParsedValue {
  mode: Mode;
  buildId: number | null;
  leagueId: number | null;
  seasonId: number | null;
  teamId: number | null;
}

function parse(value: string | null): ParsedValue {
  const empty: ParsedValue = {
    mode: 'build',
    buildId: null,
    leagueId: null,
    seasonId: null,
    teamId: null,
  };
  if (!value) return empty;
  const parts = value.split(':');
  if (parts[0] === 'teamBuild' && parts[1]) {
    return { ...empty, mode: 'build', buildId: Number(parts[1]) };
  }
  if (parts[0] === 'team' && parts[1] && parts[3]) {
    return {
      mode: 'team',
      buildId: null,
      leagueId: Number(parts[1]),
      seasonId: parts[2] ? Number(parts[2]) : null,
      teamId: Number(parts[3]),
    };
  }
  return empty;
}

export function SidePicker({ label, value, onChange }: SidePickerProps) {
  const { user } = useAuthStore();
  const initial = parse(value);

  const [mode, setMode] = useState<Mode>(initial.mode);
  const [buildId, setBuildId] = useState<number | null>(initial.buildId);
  const [leagueId, setLeagueId] = useState<number | null>(initial.leagueId);
  const [seasonId, setSeasonId] = useState<number | null>(initial.seasonId);
  const [teamId, setTeamId] = useState<number | null>(initial.teamId);

  // My team builds
  const buildsUrl = user
    ? buildUrlWithQuery(BASE_ENDPOINTS.TEAM_BUILD_BASE, [], {
        userId: user.id,
        pageSize: 100,
        sortBy: 'name',
        sortOrder: 'ASC',
      })
    : null;
  const { data: builds } = useFetch<PaginatedResponse<TeamBuildInput>>(buildsUrl);

  // Leagues → Seasons → Teams cascade
  const { data: leagues } = useFetch<PaginatedResponse<LeagueInput>>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [], {
      page: 1,
      pageSize: 100,
      sortBy: 'name',
      sortOrder: 'ASC',
    }),
  );

  const seasonsUrl = leagueId
    ? buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season'], {
        leagueId,
        pageSize: 100,
      })
    : null;
  const { data: seasons } = useFetch<PaginatedResponse<SeasonInput>>(seasonsUrl);

  const teamsUrl =
    leagueId && seasonId
      ? buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'team'], {
          seasonId,
          pageSize: 100,
          sortBy: 'name',
          sortOrder: 'ASC',
        })
      : null;
  const { data: teams } = useFetch<PaginatedResponse<TeamInput>>(teamsUrl);

  const selectBuild = (id: number | null) => {
    setBuildId(id);
    onChange(id ? `teamBuild:${id}` : null);
  };

  const selectTeam = (tid: number | null) => {
    setTeamId(tid);
    onChange(tid && leagueId && seasonId ? `team:${leagueId}:${seasonId}:${tid}` : null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    // Emit the current selection for the new mode, or clear it.
    if (next === 'build') {
      onChange(buildId ? `teamBuild:${buildId}` : null);
    } else {
      onChange(teamId && leagueId && seasonId ? `team:${leagueId}:${seasonId}:${teamId}` : null);
    }
  };

  // If the incoming value changes externally (e.g. deep link), resync state.
  useEffect(() => {
    const p = parse(value);
    setMode(p.mode);
    setBuildId(p.buildId);
    setLeagueId(p.leagueId);
    setSeasonId(p.seasonId);
    setTeamId(p.teamId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="w-full space-y-2 rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={mode === 'build' ? 'default' : 'outline'}
            onClick={() => switchMode('build')}
          >
            My Builds
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'team' ? 'default' : 'outline'}
            onClick={() => switchMode('team')}
          >
            A Team
          </Button>
        </div>
      </div>

      {mode === 'build' ? (
        <Select
          value={buildId?.toString() ?? ''}
          onChange={(e) => selectBuild(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Select a build...</option>
          {builds?.data.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      ) : (
        <div className="space-y-2">
          <Select
            value={leagueId?.toString() ?? ''}
            onChange={(e) => {
              setLeagueId(e.target.value ? Number(e.target.value) : null);
              setSeasonId(null);
              setTeamId(null);
              onChange(null);
            }}
          >
            <option value="">Select a league...</option>
            {leagues?.data.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
          <Select
            value={seasonId?.toString() ?? ''}
            disabled={!leagueId}
            onChange={(e) => {
              setSeasonId(e.target.value ? Number(e.target.value) : null);
              setTeamId(null);
              onChange(null);
            }}
          >
            <option value="">Select a season...</option>
            {seasons?.data.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select
            value={teamId?.toString() ?? ''}
            disabled={!seasonId}
            onChange={(e) => selectTeam(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select a team...</option>
            {teams?.data.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}
