'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, ErrorAlert, Input, Label, Select, Spinner } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMutation } from '@/hooks';
import { LeagueApi } from '@/lib/api';
import { formatUserDisplayName } from '@/lib/utils';
import type { LeagueUserInput, TeamInput } from '@/types';

interface TeamDetailsCardProps {
  leagueId: number;
  teamId: number;
  team: TeamInput;
  leagueUsers: LeagueUserInput[];
  onSaved: () => void;
  onDeleted: () => void;
}

export function TeamDetailsCard({
  leagueId,
  teamId,
  team,
  leagueUsers,
  onSaved,
  onDeleted,
}: TeamDetailsCardProps) {
  const [name, setName] = useState(team.name);
  const [userId, setUserId] = useState(team.userId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setName(team.name);
    setUserId(team.userId);
  }, [team.id, team.name, team.userId]);

  const saveMutation = useMutation(
    (data: { name: string; userId: number }) => LeagueApi.updateTeam(leagueId, teamId, data),
    { onSuccess: () => onSaved() },
  );

  const deleteMutation = useMutation(() => LeagueApi.deleteTeam(leagueId, teamId), {
    onSuccess: () => {
      setDeleteDialogOpen(false);
      onDeleted();
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMutation.mutate({ name, userId });
  };

  const selectedOwner = leagueUsers.find((lu) => lu.userId === userId)?.user;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {saveMutation.error && <ErrorAlert message={saveMutation.error} />}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="team-detail-name">Name</Label>
            <Input
              id="team-detail-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saveMutation.loading}
            />
          </div>

          <div>
            <Label htmlFor="team-detail-owner">Owner</Label>
            <Select
              id="team-detail-owner"
              value={userId}
              onChange={(e) => setUserId(Number(e.target.value))}
              required
              disabled={saveMutation.loading || leagueUsers.length === 0}
            >
              <option value={0} disabled>
                Select a user
              </option>
              {leagueUsers.map((leagueUser) => (
                <option key={leagueUser.userId} value={leagueUser.userId}>
                  {formatUserDisplayName(leagueUser.user)}
                </option>
              ))}
            </Select>
            {selectedOwner && (
              <div className="mt-1 text-xs text-muted-foreground">
                {formatUserDisplayName(selectedOwner)}
                {selectedOwner.discordUsername && ` · Discord: ${selectedOwner.discordUsername}`}
                {selectedOwner.showdownUsername && ` · Showdown: ${selectedOwner.showdownUsername}`}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={saveMutation.loading}
            >
              Delete Team
            </Button>
            <Button type="submit" disabled={saveMutation.loading}>
              {saveMutation.loading ? <Spinner size={18} /> : 'Save'}
            </Button>
          </div>
        </form>
      </CardContent>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!deleteMutation.loading) {
            setDeleteDialogOpen(open);
            if (!open) deleteMutation.reset();
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Delete {team.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This permanently deletes the team. This action cannot be undone.
          </p>
          {deleteMutation.error && <ErrorAlert message={deleteMutation.error} />}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(undefined)}
              disabled={deleteMutation.loading}
            >
              {deleteMutation.loading ? <Spinner size={18} /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
