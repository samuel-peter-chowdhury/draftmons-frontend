'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { Button, ErrorAlert, Spinner } from '@/components';
import { EditRulesModal } from '@/components/modals/EditRulesModal';
import { sanitizeHtml } from '@/lib/sanitize';
import { useAuthStore } from '@/stores';
import { useLeagueStore, useIsModerator } from '@/stores/useLeagueStore';

export default function SeasonRulesPage() {
  const params = useParams<{ id: string; seasonId: string }>();
  const leagueId = Number(params.id);
  const seasonId = Number(params.seasonId);
  const { user: currentUser } = useAuthStore();

  const season = useLeagueStore((s) => s.season);
  const seasonLoading = useLeagueStore((s) => s.seasonLoading);
  const seasonError = useLeagueStore((s) => s.seasonError);
  const refetchSeason = useLeagueStore((s) => s.refetchSeason);

  const handleRefetchSeason = useCallback(() => {
    refetchSeason(leagueId, seasonId);
  }, [refetchSeason, leagueId, seasonId]);

  const [isEditRulesModalOpen, setIsEditRulesModalOpen] = useState(false);

  const isModerator = useIsModerator(currentUser?.id);

  return (
    <div className="mx-auto max-w-7xl p-4">
      {seasonError && <ErrorAlert message={seasonError} />}

      {seasonLoading && !season && (
        <div className="flex items-center justify-center py-10">
          <Spinner size={32} />
        </div>
      )}

      {season && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Rules</h1>
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
          </div>

          {season.rules ? (
            <div
              className="prose prose-sm prose-invert max-w-none [&_a]:text-primary [&_a]:underline [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-medium [&_li]:mb-1 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-2 [&_p]:leading-relaxed [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(season.rules) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No rules have been set for this season.</p>
          )}
        </div>
      )}

      {isModerator && (
        <EditRulesModal
          open={isEditRulesModalOpen}
          onOpenChange={setIsEditRulesModalOpen}
          leagueId={leagueId}
          seasonId={seasonId}
          currentRules={season?.rules || ''}
          onSuccess={handleRefetchSeason}
        />
      )}
    </div>
  );
}
