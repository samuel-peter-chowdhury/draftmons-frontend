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

import { Api } from '@/lib/api';
import { BASE_ENDPOINTS, LEAGUE_ENDPOINTS } from '@/lib/constants';
import type { UserInputDto, LeagueUserInputDto, PaginatedResponse } from '@/types';

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
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get list of existing user IDs in the league
  const existingUserIds = existingLeagueUsers.map((lu) => lu.userId);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({
        nameLike: query,
        page: '1',
        pageSize: '10',
        sortBy: 'lastName',
        sortOrder: 'ASC',
      });
      const response = await Api.get<PaginatedResponse<UserInputDto>>(
        `${BASE_ENDPOINTS.USER_BASE}?${params.toString()}`,
      );
      // Keep as-is since this is already working for you:
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
      setError('Please select at least one user');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await Promise.all(
        selectedUsers.map((user) =>
          Api.post<LeagueUserInputDto>(BASE_ENDPOINTS.LEAGUE_BASE + `/${leagueId}` + LEAGUE_ENDPOINTS.LEAGUE_USER, {
            leagueId,
            userId: user.id,
            isModerator: false,
          }),
        ),
      );
      setSelectedUsers([]);
      setSearchQuery('');
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      const error = e as { body?: { message?: string }; message?: string };
      setError(error?.body?.message || error?.message || 'Failed to add league users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      if (!newOpen) {
        setSelectedUsers([]);
        setSearchQuery('');
        setUsers([]);
        setError(null);
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

        {error && <ErrorAlert message={error} />}

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
              disabled={loading}
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
                        disabled={loading}
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
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedUsers.length === 0}>
              {loading ? (
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
