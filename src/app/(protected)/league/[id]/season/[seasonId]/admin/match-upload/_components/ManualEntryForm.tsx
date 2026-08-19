'use client';

import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, ErrorAlert, Spinner, Tabs, TabsList, TabsTrigger } from '@/components';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useApiSWR } from '@/hooks';
import { MatchUploadApi, buildUrlWithQuery, type ApiRequestError } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import {
  MatchResultSource,
  type ManualGameInput,
  type ManualSubmitInputDto,
  type ManualSubmitResultDto,
  type MatchInput,
  type PaginatedResponse,
  type SeasonPokemonInput,
  type WeekInput,
} from '@/types';
import { ForfeitForm } from './ForfeitForm';
import { GameRowEditor } from './GameRowEditor';
import { MatchSelector } from './MatchSelector';
import { OverwriteDialog } from './OverwriteDialog';
import { SuccessState } from './SuccessState';
import type {
  ManualGameDraft,
  ManualMatchOption,
  ManualStatDraft,
  ManualTeamOption,
} from './manual-entry.types';

// Same 409 detail shape the replay flow reads off ApiRequestError.body.detail.
interface ExistingGameStat {
  seasonPokemonId: number;
  directKills: number;
  indirectKills: number;
  deaths: number;
}
interface ExistingGame {
  id: number;
  gameNumber: number;
  replayLink: string;
  winningTeamId: number;
  losingTeamId: number;
  differential: number;
  stats: ExistingGameStat[];
}

type SubMode = MatchResultSource.MANUAL | MatchResultSource.FORFEIT;
type FormState = 'input' | 'submitting' | 'success';

interface ManualEntryFormProps {
  leagueId: number;
  seasonId: number;
  numberOfGames: number;
  pool: SeasonPokemonInput[];
  poolLoading: boolean;
}

let draftKeySeq = 0;
function nextKey(prefix: string): string {
  draftKeySeq += 1;
  return `${prefix}-${draftKeySeq}`;
}

function emptyGameDraft(): ManualGameDraft {
  return {
    key: nextKey('game'),
    winningTeamId: null,
    differential: '',
    replayLink: '',
    statsOpen: false,
    stats: [],
    analyzing: false,
    analysisError: null,
    detectedPlayers: null,
    playerOverrides: {},
  };
}

function resultLabelFor(match: MatchInput): string | null {
  if (match.winningTeamId == null) return null;
  if (match.resultSource === MatchResultSource.MANUAL) return 'Manual';
  if (match.resultSource === MatchResultSource.FORFEIT) return 'Forfeit';
  return 'Recorded';
}

/**
 * Manual-entry counterpart to the replay flow: record a result for a match that
 * was played without a saved replay, or decided by forfeit. Mirrors the replay
 * page's local state-machine (input → submitting → success) with no Zustand store.
 */
export function ManualEntryForm({
  leagueId,
  seasonId,
  numberOfGames,
  pool,
  poolLoading,
}: ManualEntryFormProps) {
  // ─── Season schedule (matches to pick from) ───────────────────────────────
  const weeksUrl = buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'week'], {
    seasonId,
    full: true,
    pageSize: 100,
    sortBy: 'weekNumber',
    sortOrder: 'ASC',
  });
  const {
    data: weekData,
    loading: weeksLoading,
    error: weeksError,
    refetch: refetchWeeks,
  } = useApiSWR<PaginatedResponse<WeekInput>>(weeksUrl);

  const matchOptions = useMemo((): ManualMatchOption[] => {
    const options: ManualMatchOption[] = [];
    for (const week of weekData?.data ?? []) {
      for (const match of week.matches ?? []) {
        const teams = match.teams ?? [];
        // A match without both teams assigned can't have a result recorded.
        if (teams.length !== 2) continue;
        options.push({
          matchId: match.id,
          weekId: week.id,
          weekName: week.name,
          weekNumber: week.weekNumber,
          teams: teams.map((t) => ({ teamId: t.id, teamName: t.name })),
          hasResult: match.winningTeamId != null,
          resultLabel: resultLabelFor(match),
        });
      }
    }
    return options;
  }, [weekData]);

  // ─── Form state ───────────────────────────────────────────────────────────
  const [formState, setFormState] = useState<FormState>('input');
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [subMode, setSubMode] = useState<SubMode>(MatchResultSource.MANUAL);

  const [forfeitWinnerTeamId, setForfeitWinnerTeamId] = useState<number | null>(null);
  const [forfeitScore, setForfeitScore] = useState('');

  const [games, setGames] = useState<ManualGameDraft[]>(() => [emptyGameDraft()]);

  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [existingGames, setExistingGames] = useState<ExistingGame[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<ManualSubmitResultDto | null>(null);

  const selectedMatch = matchOptions.find((m) => m.matchId === selectedMatchId) ?? null;
  // Memoized so the `?? []` fallback doesn't hand a fresh array to every dependent
  // useMemo on each render.
  const teams: ManualTeamOption[] = useMemo(() => selectedMatch?.teams ?? [], [selectedMatch]);

  // Each team's drafted Pokémon, for the stat pickers.
  const poolByTeam = useMemo(
    () =>
      teams.map((team) => ({
        team,
        pool: pool.filter((sp) =>
          (sp.seasonPokemonTeams ?? []).some((spt) => spt.teamId === team.teamId),
        ),
      })),
    [teams, pool],
  );

  function resetForMatchChange(matchId: number) {
    setSelectedMatchId(matchId);
    setForfeitWinnerTeamId(null);
    setForfeitScore('');
    setGames([emptyGameDraft()]);
    setSubmitError(null);
    setExistingGames([]);
  }

  function patchGame(key: string, patch: Partial<ManualGameDraft>) {
    setGames((prev) => prev.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  }

  // ─── Fetch & Parse (per row) ──────────────────────────────────────────────
  const runAnalyzeGame = useCallback(
    async (key: string, replayUrl: string, overrides: Record<number, number>) => {
      if (selectedMatchId === null) return;

      patchGame(key, { analyzing: true, analysisError: null });

      try {
        const preview = await MatchUploadApi.analyzeGame(leagueId, {
          matchId: selectedMatchId,
          replayUrl,
          playerOverrides: Object.entries(overrides).map(([playerIndex, teamId]) => ({
            playerIndex: Number(playerIndex),
            teamId,
          })),
        });

        const errorText =
          preview.errors.length > 0 ? preview.errors.map((e) => e.message).join(' ') : null;

        if (!preview.game) {
          // Fetch/parse failed outright — leave the row in manual-entry mode.
          patchGame(key, {
            analyzing: false,
            analysisError: errorText ?? 'Could not parse that replay.',
            detectedPlayers: preview.players.length > 0 ? preview.players : null,
            playerOverrides: overrides,
          });
          return;
        }

        const stats: ManualStatDraft[] = preview.game.stats.map((s) => ({
          key: nextKey('stat'),
          seasonPokemonId: s.seasonPokemonId,
          rawName: s.seasonPokemonId === null ? s.rawName : null,
          directKills: String(s.directKills),
          indirectKills: String(s.indirectKills),
          deaths: String(s.deaths),
        }));

        patchGame(key, {
          analyzing: false,
          analysisError: errorText,
          detectedPlayers: preview.players,
          playerOverrides: overrides,
          winningTeamId: preview.game.winnerTeamId,
          differential: preview.game.differential !== null ? String(preview.game.differential) : '',
          stats,
          statsOpen: stats.length > 0,
        });
      } catch (e) {
        const err = e as ApiRequestError;
        patchGame(key, {
          analyzing: false,
          analysisError: err.body?.message || err.message || 'Fetch & Parse failed.',
        });
      }
    },
    [leagueId, selectedMatchId],
  );

  // ─── Validation ───────────────────────────────────────────────────────────
  const { blockers, payloadWinnerTeamId } = useMemo((): {
    blockers: string[];
    payloadWinnerTeamId: number | null;
  } => {
    const issues: string[] = [];

    if (selectedMatchId === null || teams.length !== 2) {
      return { blockers: ['Select a match with two assigned teams.'], payloadWinnerTeamId: null };
    }

    if (subMode === MatchResultSource.FORFEIT) {
      if (forfeitWinnerTeamId === null) {
        issues.push('Select the team that wins the forfeit.');
      }
      if (forfeitScore.trim() !== '') {
        const score = Number(forfeitScore);
        if (!Number.isInteger(score) || score < 0) {
          issues.push('Games credited must be a whole number of 0 or more.');
        } else if (score > numberOfGames) {
          issues.push(`Games credited cannot exceed the season's ${numberOfGames} game(s).`);
        }
      }
      return { blockers: issues, payloadWinnerTeamId: forfeitWinnerTeamId };
    }

    // MANUAL
    if (games.length === 0) {
      issues.push('Add at least one game.');
      return { blockers: issues, payloadWinnerTeamId: null };
    }
    if (games.length > numberOfGames) {
      issues.push(`This season allows at most ${numberOfGames} game(s) per match.`);
    }

    games.forEach((game, i) => {
      if (game.winningTeamId === null) {
        issues.push(`Game ${i + 1}: select the winning team.`);
      }
      if (game.differential.trim() !== '') {
        const diff = Number(game.differential);
        if (!Number.isInteger(diff) || diff < 0) {
          issues.push(`Game ${i + 1}: differential must be a whole number of 0 or more.`);
        }
      }
      game.stats.forEach((stat, si) => {
        if (stat.seasonPokemonId === null) {
          issues.push(
            `Game ${i + 1}, stat ${si + 1}: pick a Pokémon${stat.rawName ? ` for "${stat.rawName}"` : ''} or remove the row.`,
          );
        }
      });
    });

    // Strict-majority winner — the backend rejects an indecisive set, so catch it here.
    const wins = new Map<number, number>();
    for (const game of games) {
      if (game.winningTeamId !== null) {
        wins.set(game.winningTeamId, (wins.get(game.winningTeamId) ?? 0) + 1);
      }
    }
    let winner: number | null = null;
    for (const [teamId, count] of wins.entries()) {
      if (count > games.length / 2) {
        winner = teamId;
        break;
      }
    }
    if (winner === null && !games.some((g) => g.winningTeamId === null)) {
      issues.push(
        'No team won a majority of these games — a match result must have a decisive winner.',
      );
    }

    return { blockers: issues, payloadWinnerTeamId: winner };
  }, [selectedMatchId, teams, subMode, forfeitWinnerTeamId, forfeitScore, games, numberOfGames]);

  // ─── Submit ───────────────────────────────────────────────────────────────
  function buildPayload(confirmOverwrite: boolean): ManualSubmitInputDto | null {
    if (selectedMatchId === null || payloadWinnerTeamId === null || teams.length !== 2) {
      return null;
    }
    const losingTeamId = teams.find((t) => t.teamId !== payloadWinnerTeamId)?.teamId;
    if (losingTeamId === undefined) return null;

    let payloadGames: ManualGameInput[];

    if (subMode === MatchResultSource.FORFEIT) {
      const score = forfeitScore.trim() === '' ? 0 : Number(forfeitScore);
      payloadGames = Array.from({ length: score }, () => ({
        winningTeamId: payloadWinnerTeamId,
        losingTeamId,
      }));
    } else {
      payloadGames = games.map((game) => {
        const gameWinner = game.winningTeamId!;
        const gameLoser = teams.find((t) => t.teamId !== gameWinner)!.teamId;
        const entry: ManualGameInput = {
          winningTeamId: gameWinner,
          losingTeamId: gameLoser,
        };
        if (game.differential.trim() !== '') {
          entry.differential = Number(game.differential);
        }
        if (game.replayLink.trim() !== '') {
          entry.replayLink = game.replayLink.trim();
        }
        if (game.stats.length > 0) {
          entry.stats = game.stats.map((stat) => ({
            seasonPokemonId: stat.seasonPokemonId!,
            directKills: Number(stat.directKills || 0),
            indirectKills: Number(stat.indirectKills || 0),
            deaths: Number(stat.deaths || 0),
          }));
        }
        return entry;
      });
    }

    return {
      matchId: selectedMatchId,
      resultSource: subMode,
      confirmOverwrite,
      winningTeamId: payloadWinnerTeamId,
      losingTeamId,
      games: payloadGames,
    };
  }

  async function handleSubmit(confirmOverwrite = false) {
    const payload = buildPayload(confirmOverwrite);
    if (!payload) return;

    setFormState('submitting');
    setSubmitError(null);

    try {
      const result = await MatchUploadApi.submitManual(leagueId, payload);
      setSubmittedResult(result);
      setFormState('success');
      // The schedule list now shows a result for this match.
      refetchWeeks();
    } catch (e) {
      const err = e as ApiRequestError;
      setFormState('input');
      if (err.status === 409) {
        const detail = err.body?.detail as
          | { existingGames?: ExistingGame[]; duplicateLinks?: string[] }
          | undefined;
        if (detail?.existingGames) {
          setExistingGames(detail.existingGames);
          setOverwriteDialogOpen(true);
          return;
        }
        if (detail?.duplicateLinks) {
          setSubmitError('One or more replay links are already recorded for another match.');
          return;
        }
      }
      setSubmitError(err.body?.message || err.message || 'Submit failed. Please try again.');
    }
  }

  function handleReset() {
    setSubmittedResult(null);
    setSelectedMatchId(null);
    setSubMode(MatchResultSource.MANUAL);
    setForfeitWinnerTeamId(null);
    setForfeitScore('');
    setGames([emptyGameDraft()]);
    setExistingGames([]);
    setSubmitError(null);
    setFormState('input');
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (formState === 'success' && submittedResult) {
    return (
      <SuccessState
        result={{
          matchId: submittedResult.matchId,
          games: submittedResult.games.map((g) => ({
            id: g.id,
            gameNumber: g.gameNumber,
            replayLink: g.replayLink ?? '',
          })),
        }}
        weekName={selectedMatch?.weekName ?? null}
        onReset={handleReset}
      />
    );
  }

  const submitting = formState === 'submitting';

  return (
    <div className="flex flex-col gap-6">
      {weeksError && <ErrorAlert message={weeksError} />}

      <MatchSelector
        matches={matchOptions}
        value={selectedMatchId}
        loading={weeksLoading && !weekData}
        disabled={submitting}
        onSelect={resetForMatchChange}
      />

      {selectedMatch && (
        <>
          {/* Sub-mode: played-but-no-replay vs forfeit */}
          <Tabs value={subMode} onValueChange={(v) => setSubMode(v as SubMode)}>
            <TabsList>
              <TabsTrigger value={MatchResultSource.MANUAL}>Manual</TabsTrigger>
              <TabsTrigger value={MatchResultSource.FORFEIT}>Forfeit</TabsTrigger>
            </TabsList>
          </Tabs>

          {subMode === MatchResultSource.FORFEIT ? (
            <ForfeitForm
              teams={teams}
              winningTeamId={forfeitWinnerTeamId}
              score={forfeitScore}
              numberOfGames={numberOfGames}
              onChangeWinner={setForfeitWinnerTeamId}
              onChangeScore={setForfeitScore}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {games.map((game, i) => (
                <GameRowEditor
                  key={game.key}
                  game={game}
                  gameNumber={i + 1}
                  teams={teams}
                  poolByTeam={poolByTeam}
                  canRemove={games.length > 1}
                  onChange={(patch) => patchGame(game.key, patch)}
                  onFetchParse={() =>
                    runAnalyzeGame(game.key, game.replayLink.trim(), game.playerOverrides)
                  }
                  onOverridePlayer={(playerIndex, teamId) =>
                    runAnalyzeGame(game.key, game.replayLink.trim(), {
                      ...game.playerOverrides,
                      [playerIndex]: teamId,
                    })
                  }
                  onRemove={() => setGames((prev) => prev.filter((g) => g.key !== game.key))}
                />
              ))}

              <Button
                variant="outline"
                className="self-start"
                disabled={games.length >= numberOfGames || submitting}
                onClick={() => setGames((prev) => [...prev, emptyGameDraft()])}
              >
                <Plus className="mr-1 size-4" />
                Add game
              </Button>
            </div>
          )}

          {submitError && <ErrorAlert message={submitError} />}

          {/* Submit footer — mirrors the replay flow's blocked-count affordance */}
          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {blockers.length > 0 ? (
                <ul className="list-disc pl-4">
                  {blockers.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              ) : (
                'Ready to submit.'
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* span wrapper so the tooltip fires while the button is disabled */}
                  <span
                    tabIndex={blockers.length > 0 ? 0 : undefined}
                    className="inline-flex shrink-0"
                  >
                    <Button
                      disabled={blockers.length > 0 || submitting || poolLoading}
                      onClick={() => handleSubmit(false)}
                    >
                      {submitting ? <Spinner size={18} /> : 'Record Result'}
                    </Button>
                  </span>
                </TooltipTrigger>
                {blockers.length > 0 && (
                  <TooltipContent>
                    Resolve {blockers.length} item(s) before submitting
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </>
      )}

      <OverwriteDialog
        open={overwriteDialogOpen}
        onOpenChange={setOverwriteDialogOpen}
        existingGames={existingGames}
        seasonPool={pool}
        teams={teams}
        confirming={submitting}
        onConfirm={() => {
          setOverwriteDialogOpen(false);
          handleSubmit(true);
        }}
      />
    </div>
  );
}
