import { useState, useEffect } from 'react';
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
import { UserApi } from '@/lib/api';
import { TIMEZONES } from '@/lib/constants';
import { useAuthStore } from '@/stores';
import type { UserInput, UserOutput } from '@/types';

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserInput | null;
  onSuccess?: () => void;
}

export function EditUserModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserModalProps) {
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState<Partial<UserOutput>>({
    firstName: '',
    lastName: '',
    showdownUsername: '',
    discordUsername: '',
    timezone: '',
  });

  const updateMutation = useMutation(
    (data: Partial<UserOutput>) => UserApi.update(user!.id, data),
    {
      onSuccess: (result) => {
        // Update the auth store with the new user data
        setUser(result);
        onOpenChange(false);
        onSuccess?.();
      },
    },
  );

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        showdownUsername: user.showdownUsername || '',
        discordUsername: user.discordUsername || '',
        timezone: user.timezone || '',
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutate(form);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!updateMutation.loading) {
      if (!newOpen) {
        updateMutation.reset();
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        {updateMutation.error && <ErrorAlert message={updateMutation.error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                disabled={updateMutation.loading}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                disabled={updateMutation.loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              id="timezone"
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              disabled={updateMutation.loading}
            >
              <option value="">Select a timezone</option>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="showdownUsername">Showdown Username</Label>
            <Input
              id="showdownUsername"
              value={form.showdownUsername}
              onChange={(e) => setForm((f) => ({ ...f, showdownUsername: e.target.value }))}
              disabled={updateMutation.loading}
            />
          </div>

          <div>
            <Label htmlFor="discordUsername">Discord Username</Label>
            <Input
              id="discordUsername"
              value={form.discordUsername}
              onChange={(e) => setForm((f) => ({ ...f, discordUsername: e.target.value }))}
              disabled={updateMutation.loading}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={updateMutation.loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.loading}>
              {updateMutation.loading ? <Spinner size={18} /> : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
