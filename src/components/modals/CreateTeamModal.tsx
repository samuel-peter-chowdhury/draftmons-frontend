import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  ErrorAlert,
  Spinner,
  Select,
} from '@/components';
import { useMutation } from '@/hooks';
import { LeagueApi } from '@/lib/api';
import type { LeagueUserInput, TeamOutput } from '@/types';

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: number;
  seasonId: number;
  leagueUsers: LeagueUserInput[];
  onSuccess?: () => void;
}

export function CreateTeamModal({
  open,
  onOpenChange,
  leagueId,
  seasonId,
  leagueUsers,
  onSuccess,
}: CreateTeamModalProps) {
  const defaultForm: TeamOutput = {
    name: '',
    seasonId,
    userId: 0,
  };

  const [form, setForm] = useState<TeamOutput>(defaultForm);

  const createTeamMutation = useMutation(
    (data: TeamOutput) => LeagueApi.createTeam(leagueId, data),
    {
      onSuccess: () => {
        setForm(defaultForm);
        onOpenChange(false);
        onSuccess?.();
      },
    },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTeamMutation.mutate({ ...form, seasonId });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!createTeamMutation.loading) {
      if (!newOpen) {
        setForm(defaultForm);
        createTeamMutation.reset();
      }
      onOpenChange(newOpen);
    }
  };

  const getUserDisplayName = (leagueUser: LeagueUserInput) => {
    const user = leagueUser.user;
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`.trim();
    }
    return user?.firstName || user?.lastName || user?.email || 'Unknown User';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team</DialogTitle>
        </DialogHeader>

        {createTeamMutation.error && <ErrorAlert message={createTeamMutation.error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              disabled={createTeamMutation.loading}
              placeholder="e.g., Team Rocket"
            />
          </div>

          <div>
            <Label htmlFor="team-user">User</Label>
            <Select
              id="team-user"
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: Number(e.target.value) }))}
              required
              disabled={createTeamMutation.loading || leagueUsers.length === 0}
            >
              <option value={0} disabled>
                Select a user
              </option>
              {leagueUsers.map((leagueUser) => (
                <option key={leagueUser.userId} value={leagueUser.userId}>
                  {getUserDisplayName(leagueUser)}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createTeamMutation.loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTeamMutation.loading}>
              {createTeamMutation.loading ? <Spinner size={18} /> : 'Add Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
