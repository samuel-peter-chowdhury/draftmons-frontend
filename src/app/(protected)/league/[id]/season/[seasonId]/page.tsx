'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { X, Pencil } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorAlert,
  Spinner,
} from '@/components';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateSeasonModal } from '@/components/modals/CreateSeasonModal';
import { CreateTeamModal } from '@/components/modals/CreateTeamModal';
import { EditRulesModal } from '@/components/modals/EditRulesModal';
import { useCheckAuth, useFetch, useMutation } from '@/hooks';
import { LeagueApi, buildUrlWithQuery } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatGenerationName, formatUserDisplayName } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import type { LeagueInput, SeasonInput } from '@/types';

export default function SeasonDetailPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);
  const { user: currentUser } = useAuthStore();

  // Fetch league data for moderator check and league users
  const {
    data: league,
    loading: leagueLoading,
    error: leagueError,
  } = useFetch<LeagueInput>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId], { full: true }),
  );

  // Fetch season with teams
  const {
    data: season,
    loading: seasonLoading,
    error: seasonError,
    refetch: refetchSeason,
  } = useFetch<SeasonInput>(
    buildUrlWithQuery(BASE_ENDPOINTS.LEAGUE_BASE, [leagueId, 'season', seasonId], { full: true }),
  );

  const [isEditSeasonModalOpen, setIsEditSeasonModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isEditRulesModalOpen, setIsEditRulesModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<number | null>(null);

  useCheckAuth();

  // Check if the current user is a moderator of this league
  const isModerator =
    league?.leagueUsers?.some(
      (leagueUser) => leagueUser.userId === currentUser?.id && leagueUser.isModerator,
    ) ?? false;

  const deleteTeamMutation = useMutation(
    (teamId: number) => LeagueApi.deleteTeam(leagueId, teamId),
    {
      onSuccess: () => {
        refetchSeason();
        setTeamToDelete(null);
      },
    },
  );

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    await deleteTeamMutation.mutate(teamToDelete);
  };

  const loading = leagueLoading || seasonLoading;
  const error = leagueError || seasonError;

  return (
    <div className="mx-auto max-w-7xl p-4">
      {error && <ErrorAlert message={error} />}

      {loading && !season && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {season && (
        <div className="space-y-6">
          {/* Season Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <span>{season.name}</span>
                  <div className="mt-1 text-sm font-normal text-muted-foreground">
                    {season.generation?.name
                      ? formatGenerationName(season.generation.name)
                      : 'Unknown Generation'}
                  </div>
                </div>
                {isModerator && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditSeasonModalOpen(true)}
                    aria-label="Edit season"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>Status: {season.status.replace(/_/g, ' ')}</div>
              <div>Point Limit: {season.pointLimit}</div>
              <div>Max Point Value: {season.maxPointValue}</div>
              <div>
                Created:{' '}
                {new Date(season.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </CardContent>
          </Card>

          {/* Teams Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Teams</span>
                {isModerator && (
                  <Button onClick={() => setIsCreateTeamModalOpen(true)} size="sm">
                    Add Team
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!season.teams || season.teams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No teams in this season yet.</p>
              ) : (
                <div className="space-y-2">
                  {season.teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between rounded-md border border-border bg-card p-3"
                    >
                      <div>
                        <div className="text-sm font-medium">{team.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatUserDisplayName(team.user)}
                        </div>
                      </div>
                      {isModerator && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTeamToDelete(team.id)}
                          aria-label={`Remove ${team.name}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rules Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Rules</span>
                {isModerator && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditRulesModalOpen(true)}
                    aria-label="Edit rules"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {season.rules ? (
                <div
                  className="prose prose-sm prose-invert max-w-none [&_a]:text-primary [&_a]:underline [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-medium [&_li]:mb-1 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-2 [&_p]:leading-relaxed [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: season.rules }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No rules have been set for this season.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isModerator && season && (
        <CreateSeasonModal
          open={isEditSeasonModalOpen}
          onOpenChange={setIsEditSeasonModalOpen}
          leagueId={leagueId}
          season={season}
          onSuccess={refetchSeason}
        />
      )}

      {isModerator && league?.leagueUsers && (
        <>
          <CreateTeamModal
            open={isCreateTeamModalOpen}
            onOpenChange={setIsCreateTeamModalOpen}
            leagueId={leagueId}
            seasonId={seasonId}
            leagueUsers={league.leagueUsers}
            onSuccess={refetchSeason}
          />

          <EditRulesModal
            open={isEditRulesModalOpen}
            onOpenChange={setIsEditRulesModalOpen}
            leagueId={leagueId}
            seasonId={seasonId}
            currentRules={season?.rules || ''}
            onSuccess={refetchSeason}
          />

          <AlertDialog
            open={teamToDelete !== null}
            onOpenChange={(open) => !open && setTeamToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Team</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this team from the season? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteTeamMutation.loading}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTeam} disabled={deleteTeamMutation.loading}>
                  {deleteTeamMutation.loading ? <Spinner size={18} /> : 'Remove'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
