import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  ErrorAlert,
  Spinner,
} from '@/components';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { useMutation } from '@/hooks';
import { UserApi, LeagueApi } from '@/lib/api';
import type { UserInputDto, LeagueUserInputDto } from '@/types';

interface AddLeagueUsersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: number;
  existingLeagueUsers?: LeagueUserInputDto[];
  onSuccess?: () => void;
}

export function AddLeagueUsersModal({
  open,
  onOpenChange,
  leagueId,
  existingLeagueUsers = [],
  onSuccess,
}: AddLeagueUsersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserInputDto[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserInputDto[]>([]);
  const [searching, setSearching] = useState(false);

  const addUsersMutation = useMutation(
    async (userIds: number[]) => {
      return Promise.all(
        userIds.map((userId) => LeagueApi.addUser(leagueId, { userId, isModerator: false })),
      );
    },
    {
      onSuccess: () => {
        setSelectedUsers([]);
        setSearchQuery('');
        onOpenChange(false);
        onSuccess?.();
      },
    },
  );

  // Get list of existing user IDs in the league
  const existingUserIds = existingLeagueUsers.map((lu) => lu.userId);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setSearching(true);
    try {
      const response = await UserApi.search({
        nameLike: query,
        page: 1,
        pageSize: 10,
        sortBy: 'lastName',
        sortOrder: 'ASC',
      });
      setUsers(response.data || []);
    } catch (e) {
      console.error('Failed to search users:', e);
      setUsers([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const handleSelectUser = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user && !selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers((prev) => [...prev, user]);
      setSearchQuery('');
      setUsers([]);
    }
  };

  const handleRemoveUser = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      return;
    }

    const userIds = selectedUsers.map((u) => u.id);
    await addUsersMutation.mutate(userIds);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!addUsersMutation.loading) {
      if (!newOpen) {
        setSelectedUsers([]);
        setSearchQuery('');
        setUsers([]);
        addUsersMutation.reset();
      }
      onOpenChange(newOpen);
    }
  };

  // Filter out users that are already selected or already in the league
  const selectedUserIds = selectedUsers.map((u) => u.id);
  const filteredUsers = users.filter(
    (user) => !selectedUserIds.includes(user.id) && !existingUserIds.includes(user.id),
  );

  // Map to combobox options
  const options: ComboboxOption[] = filteredUsers.map((user) => {
    const label =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.firstName || user.lastName || user.email;
    return { value: String(user.id), label, email: user.email ?? undefined };
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add League Users</DialogTitle>
        </DialogHeader>

        {addUsersMutation.error && <ErrorAlert message={addUsersMutation.error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user-search">Search Users</Label>

            {/* Reusable Combobox: selection adds user and closes dropdown */}
            <Combobox
              options={options}
              value={undefined} // multi-select pattern: keep placeholder shown
              onSelect={(val) => handleSelectUser(Number(val))}
              placeholder="Search by name or email..."
              emptyText={searchQuery ? 'No users found.' : 'Type to search...'}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              loading={searching}
              disabled={addUsersMutation.loading}
            />
          </div>

          {selectedUsers.length > 0 && (
            <div>
              <Label>Selected Users ({selectedUsers.length})</Label>
              <div className="mt-2 space-y-2">
                {selectedUsers.map((user) => {
                  const displayName =
                    user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : user.firstName || user.lastName || user.email;

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-md border border-border bg-card p-2"
                    >
                      <span className="text-sm">{displayName}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id)}
                        disabled={addUsersMutation.loading}
                        aria-label={`Remove ${displayName}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={addUsersMutation.loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addUsersMutation.loading || selectedUsers.length === 0}>
              {addUsersMutation.loading ? (
                <Spinner size={18} />
              ) : (
                `Add ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
