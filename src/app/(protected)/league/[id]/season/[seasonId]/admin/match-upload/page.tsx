'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ErrorAlert, Spinner } from '@/components';
import {
  ReplayInputForm,
  UnresolvedBanner,
  MatchPreviewPanel,
  OverwriteDialog,
  SuccessState,
} from './_components';
import { useFetch, useMutation } from '@/hooks';
import { MatchUploadApi, buildUrlWithQuery, type ApiRequestError } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { useLeagueStore, useIsModerator } from '@/stores/useLeagueStore';
import { useAuthStore } from '@/stores';
import type {
  SeasonPokemonInput,
  PaginatedResponse,
  MatchPreviewDto,
  GamePreviewDto,
  StatPreviewDto,
  PlayerPreviewDto,
  PreviewErrorDto,
  SubmitInputDto,
  SubmitResultDto,
} from '@/types';
import { PreviewErrorCode } from '@/types';

// ─── Banner-only blocking codes that cannot be resolved in the UI ─────────────
const BLOCKING_CODES = new Set<PreviewErrorCode>([
  PreviewErrorCode.COUNT_OUT_OF_RANGE,
  PreviewErrorCode.PLAYERS_INCONSISTENT,
  PreviewErrorCode.SET_NOT_DECISIVE,
  PreviewErrorCode.MATCH_NOT_FOUND,
  PreviewErrorCode.MATCH_BLOCKED,
]);

type PageState = 'input' | 'analyzing' | 'review' | 'submitting' | 'success';

// Interfaces for the 409 overwrite detail shape returned by the server
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

function clonePreview(preview: MatchPreviewDto): MatchPreviewDto {
  return JSON.parse(JSON.stringify(preview)) as MatchPreviewDto;
}

export default function MatchUploadPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const router = useRouter();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);

  const { user } = useAuthStore();
  const isModerator = useIsModerator(user?.id);
  const season = useLeagueStore((s) => s.season);
  const seasonLoading = useLeagueStore((s) => s.seasonLoading);

  // Redirect non-moderators
  useEffect(() => {
    if (!seasonLoading && !isModerator && user) {
      router.replace(`/league/${leagueId}/season/${seasonId}`);
    }
  }, [isModerator, seasonLoading, user, leagueId, seasonId, router]);

  // Fetch the season Pokémon pool (mirrors tier-list page)
  const {
    data: spData,
    loading: spLoading,
    error: spError,
  } = useFetch<PaginatedResponse<SeasonPokemonInput>>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season-pokemon'], {
      seasonId,
      full: true,
      activeRelationsOnly: true,
      pageSize: 9999,
    }),
  );

  const pool: SeasonPokemonInput[] = spData?.data ?? [];

  // ─── State machine ────────────────────────────────────────────────────────
  const [pageState, setPageState] = useState<PageState>('input');
  const [preview, setPreview] = useState<MatchPreviewDto | null>(null);
  // Working copy of the preview — holds override state layered over the analyzed preview
  const [workingPreview, setWorkingPreview] = useState<MatchPreviewDto | null>(null);

  // Submit-related state
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [existingGames, setExistingGames] = useState<ExistingGame[]>([]);
  const [submittedResult, setSubmittedResult] = useState<SubmitResultDto | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Analyze mutation ─────────────────────────────────────────────────────
  const analyzeMutation = useMutation((urls: string[]) =>
    MatchUploadApi.analyze(leagueId, { seasonId, replayUrls: urls }),
  );

  const handleAnalyze = useCallback(
    async (urls: string[]) => {
      setPageState('analyzing');
      try {
        const result = await analyzeMutation.mutate(urls);
        // Deep-clone the preview into editable working state
        setPreview(result);
        setWorkingPreview(clonePreview(result));
        setPageState('review');
      } catch {
        // Error stored in analyzeMutation.error; return to input
        setPageState('input');
      }
    },
    [analyzeMutation, leagueId, seasonId],
  );

  const numberOfGames = season?.numberOfGames ?? 3;

  // ─── Guard ────────────────────────────────────────────────────────────────
  if (!isModerator && !seasonLoading) return null;

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Match Upload</h1>
      </div>

      {spError && <ErrorAlert message={spError} />}

      {/* Input state */}
      {(pageState === 'input' || pageState === 'analyzing') && (
        <ReplayInputForm
          numberOfGames={numberOfGames}
          loading={pageState === 'analyzing'}
          error={analyzeMutation.error}
          seasonLoading={spLoading || seasonLoading}
          onAnalyze={handleAnalyze}
        />
      )}

      {/* Review state — filled in Task 2 */}
      {pageState === 'review' && workingPreview && (
        <ReviewPanel
          workingPreview={workingPreview}
          setWorkingPreview={setWorkingPreview}
          preview={preview!}
          pool={pool}
          pageState={pageState}
          setPageState={setPageState}
          existingGames={existingGames}
          setExistingGames={setExistingGames}
          overwriteDialogOpen={overwriteDialogOpen}
          setOverwriteDialogOpen={setOverwriteDialogOpen}
          submitError={submitError}
          setSubmitError={setSubmitError}
          setSubmittedResult={setSubmittedResult}
          leagueId={leagueId}
          seasonId={seasonId}
        />
      )}

      {/* Submitting state — user is in review; submitting shows a spinner overlay */}
      {pageState === 'submitting' && workingPreview && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center py-10">
            <Spinner size={32} />
          </div>
        </div>
      )}

      {/* Success state — filled in Task 3 */}
      {pageState === 'success' && submittedResult && (
        <SuccessState
          result={submittedResult}
          weekName={workingPreview?.weekName ?? null}
          onReset={() => {
            setPreview(null);
            setWorkingPreview(null);
            setSubmittedResult(null);
            setExistingGames([]);
            setSubmitError(null);
            setPageState('input');
          }}
        />
      )}
    </div>
  );
}

// ─── ReviewPanel sub-component ───────────────────────────────────────────────
// Extracted to keep the main component readable. All state is lifted to the page.
function ReviewPanel({
  workingPreview,
  setWorkingPreview,
  pool,
  pageState,
  setPageState,
  existingGames,
  setExistingGames,
  overwriteDialogOpen,
  setOverwriteDialogOpen,
  submitError,
  setSubmitError,
  setSubmittedResult,
  leagueId,
  seasonId,
}: {
  workingPreview: MatchPreviewDto;
  setWorkingPreview: React.Dispatch<React.SetStateAction<MatchPreviewDto | null>>;
  preview: MatchPreviewDto;
  pool: SeasonPokemonInput[];
  pageState: PageState;
  setPageState: (s: PageState) => void;
  existingGames: ExistingGame[];
  setExistingGames: (g: ExistingGame[]) => void;
  overwriteDialogOpen: boolean;
  setOverwriteDialogOpen: (v: boolean) => void;
  submitError: string | null;
  setSubmitError: (v: string | null) => void;
  setSubmittedResult: (r: SubmitResultDto) => void;
  leagueId: number;
  seasonId: number;
}) {
  // ─── Override handlers ──────────────────────────────────────────────────
  function onOverridePlayer(playerIndex: number, userId: number) {
    setWorkingPreview((prev) => {
      if (!prev) return prev;
      const updated = clonePreview(prev);
      const player = updated.players[playerIndex];
      if (!player) return prev;
      player.userId = userId;

      // Clear the USER_NOT_FOUND error for this player index from the errors list
      updated.errors = updated.errors.filter((e) => {
        if (e.code !== PreviewErrorCode.USER_NOT_FOUND) return true;
        const match = e.field.match(/players\[(\d+)\]/);
        return match ? Number(match[1]) !== playerIndex : true;
      });

      return updated;
    });
  }

  function onOverrideMatch(matchId: number) {
    setWorkingPreview((prev) => {
      if (!prev) return prev;
      const updated = clonePreview(prev);
      updated.matchId = matchId;
      // Clear the MATCH_AMBIGUOUS error
      updated.errors = updated.errors.filter(
        (e) => e.code !== PreviewErrorCode.MATCH_AMBIGUOUS,
      );
      return updated;
    });
  }

  function onOverrideGame(
    gameIndex: number,
    field: 'winnerTeamId' | 'loserTeamId' | 'differential',
    value: number,
  ) {
    setWorkingPreview((prev) => {
      if (!prev) return prev;
      const updated = clonePreview(prev);
      const game = updated.games[gameIndex];
      if (!game) return prev;
      if (field === 'winnerTeamId') game.winnerTeamId = value;
      else if (field === 'loserTeamId') game.loserTeamId = value;
      else if (field === 'differential') game.differential = value;
      return updated;
    });
  }

  function onOverridePokemon(gameIndex: number, statIndex: number, seasonPokemonId: number) {
    setWorkingPreview((prev) => {
      if (!prev) return prev;
      const updated = clonePreview(prev);
      const stat = updated.games[gameIndex]?.stats[statIndex];
      if (!stat) return prev;
      stat.seasonPokemonId = seasonPokemonId;

      // Resolve name from the pool
      const sp = pool.find((s) => s.id === seasonPokemonId);
      if (sp?.pokemon?.name) {
        stat.name = sp.pokemon.name;
      }

      // Clear POKEMON_NOT_FOUND error for this field
      const fieldPrefix = `games[${gameIndex}].stats[${statIndex}]`;
      updated.errors = updated.errors.filter(
        (e) =>
          !(
            e.code === PreviewErrorCode.POKEMON_NOT_FOUND &&
            e.field.startsWith(fieldPrefix)
          ),
      );

      return updated;
    });
  }

  function onOverrideStat(
    gameIndex: number,
    statIndex: number,
    field: 'directKills' | 'indirectKills' | 'deaths',
    value: number,
  ) {
    setWorkingPreview((prev) => {
      if (!prev) return prev;
      const updated = clonePreview(prev);
      const stat = updated.games[gameIndex]?.stats[statIndex];
      if (!stat) return prev;
      if (field === 'directKills') stat.directKills = value;
      else if (field === 'indirectKills') stat.indirectKills = value;
      else if (field === 'deaths') stat.deaths = value;
      return updated;
    });
  }

  // ─── Derive resolved teams from players ───────────────────────────────────
  const teams = useMemo(() => {
    return workingPreview.players
      .filter((p): p is PlayerPreviewDto & { teamId: number; teamName: string } =>
        p.teamId !== null && p.teamName !== null,
      )
      .map((p) => ({ teamId: p.teamId, teamName: p.teamName }));
  }, [workingPreview.players]);

  // ─── Compute unresolved errors ─────────────────────────────────────────────
  const unresolvedErrors = useMemo((): PreviewErrorDto[] => {
    const errors: PreviewErrorDto[] = [];

    // 1. Players with null userId
    workingPreview.players.forEach((p, i) => {
      if (p.userId === null) {
        errors.push({
          field: `players[${i}].user`,
          code: PreviewErrorCode.USER_NOT_FOUND,
          message: `Player "${p.rawShowdownName}" could not be resolved to a user.`,
        });
      }
    });

    // 2. Null matchId
    if (workingPreview.matchId === null) {
      const matchErr = workingPreview.errors.find(
        (e) =>
          e.code === PreviewErrorCode.MATCH_NOT_FOUND ||
          e.code === PreviewErrorCode.MATCH_AMBIGUOUS,
      );
      errors.push({
        field: 'match',
        code: matchErr?.code ?? PreviewErrorCode.MATCH_NOT_FOUND,
        message: matchErr?.message ?? 'Match could not be identified.',
      });
    }

    // 3. Game-level nulls
    workingPreview.games.forEach((game, gi) => {
      if (game.winnerTeamId === null) {
        errors.push({
          field: `games[${gi}].winnerTeamId`,
          code: PreviewErrorCode.GAME_INDECISIVE,
          message: `Game ${game.gameNumber}: winning team not resolved.`,
        });
      }
      if (game.loserTeamId === null) {
        errors.push({
          field: `games[${gi}].loserTeamId`,
          code: PreviewErrorCode.GAME_INDECISIVE,
          message: `Game ${game.gameNumber}: losing team not resolved.`,
        });
      }
      if (
        game.winnerTeamId !== null &&
        game.loserTeamId !== null &&
        game.winnerTeamId === game.loserTeamId
      ) {
        errors.push({
          field: `games[${gi}].loserTeamId`,
          code: PreviewErrorCode.GAME_INDECISIVE,
          message: `Game ${game.gameNumber}: winning and losing team must be different.`,
        });
      }
      if (game.differential === null) {
        errors.push({
          field: `games[${gi}].differential`,
          code: PreviewErrorCode.GAME_INDECISIVE,
          message: `Game ${game.gameNumber}: differential not resolved.`,
        });
      }

      // 4. Pokémon-level nulls
      game.stats.forEach((stat, si) => {
        if (stat.seasonPokemonId === null) {
          errors.push({
            field: `games[${gi}].stats[${si}].pokemon`,
            code: PreviewErrorCode.POKEMON_NOT_FOUND,
            message: `Game ${game.gameNumber}, stat ${si + 1}: Pokémon "${stat.rawName}" not resolved.`,
          });
        }
      });
    });

    // 5. Banner-only blocking codes from the working preview errors
    workingPreview.errors.forEach((e) => {
      if (BLOCKING_CODES.has(e.code)) {
        errors.push(e);
      }
    });

    return errors;
  }, [workingPreview]);

  const unresolvedCount = unresolvedErrors.length;

  // ─── Build submit payload ─────────────────────────────────────────────────
  function buildSubmitPayload(confirmOverwrite: boolean): SubmitInputDto {
    return {
      seasonId,
      matchId: workingPreview.matchId!,
      confirmOverwrite,
      games: workingPreview.games.map((game: GamePreviewDto) => ({
        gameNumber: game.gameNumber,
        replayLink: game.replayUrl,
        winningTeamId: game.winnerTeamId!,
        losingTeamId: game.loserTeamId!,
        differential: game.differential!,
        stats: game.stats.map((stat: StatPreviewDto) => ({
          seasonPokemonId: stat.seasonPokemonId!,
          directKills: stat.directKills,
          indirectKills: stat.indirectKills,
          deaths: stat.deaths,
        })),
      })),
    };
  }

  // ─── Submit handler ───────────────────────────────────────────────────────
  async function handleSubmit(confirmOverwrite = false) {
    setPageState('submitting');
    setSubmitError(null);
    try {
      const result = await MatchUploadApi.submit(leagueId, buildSubmitPayload(confirmOverwrite));
      setSubmittedResult(result);
      setPageState('success');
    } catch (e) {
      const err = e as ApiRequestError;
      setPageState('review');
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
          setSubmitError(
            'One or more replay links are already recorded for another match.',
          );
          return;
        }
      }
      setSubmitError(err.body?.message || err.message || 'Submit failed. Please try again.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <UnresolvedBanner errors={unresolvedErrors} />

      <MatchPreviewPanel
        preview={workingPreview}
        seasonPool={pool}
        teams={teams}
        onOverridePlayer={onOverridePlayer}
        onOverrideMatch={onOverrideMatch}
        onOverrideGame={onOverrideGame}
        onOverridePokemon={onOverridePokemon}
        onOverrideStat={onOverrideStat}
      />

      {submitError && <ErrorAlert message={submitError} />}

      {/* Submit footer */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {unresolvedCount > 0
            ? `${unresolvedCount} item(s) must be resolved before submitting.`
            : 'All items resolved. Ready to submit.'}
        </span>
        <SubmitButton
          unresolvedCount={unresolvedCount}
          submitting={pageState === 'submitting'}
          onSubmit={() => handleSubmit(false)}
        />
      </div>

      <OverwriteDialog
        open={overwriteDialogOpen}
        onOpenChange={setOverwriteDialogOpen}
        existingGames={existingGames}
        seasonPool={pool}
        teams={teams}
        confirming={pageState === 'submitting'}
        onConfirm={() => {
          setOverwriteDialogOpen(false);
          handleSubmit(true);
        }}
      />
    </div>
  );
}

// ─── SubmitButton with tooltip ────────────────────────────────────────────────
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button, Spinner as SpinnerComponent } from '@/components';

function SubmitButton({
  unresolvedCount,
  submitting,
  onSubmit,
}: {
  unresolvedCount: number;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const disabled = unresolvedCount > 0 || submitting;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* span wrapper so tooltip fires even while button is disabled */}
          <span tabIndex={disabled ? 0 : undefined} className="inline-flex">
            <Button disabled={disabled} onClick={onSubmit}>
              {submitting ? <SpinnerComponent size={18} /> : 'Submit Match'}
            </Button>
          </span>
        </TooltipTrigger>
        {unresolvedCount > 0 && (
          <TooltipContent>
            Resolve {unresolvedCount} item(s) before submitting
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
