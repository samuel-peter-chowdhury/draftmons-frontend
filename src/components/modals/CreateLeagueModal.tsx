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
} from '@/components';
import { useMutation } from '@/hooks';
import { LeagueApi } from '@/lib/api';
import type { LeagueInput, LeagueOutput } from '@/types';

interface CreateLeagueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  league?: LeagueInput | null;
  onSuccess?: (league?: LeagueInput) => void;
}

export function CreateLeagueModal({
  open,
  onOpenChange,
  league,
  onSuccess,
}: CreateLeagueModalProps) {
  const isEditMode = !!league;
  const [form, setForm] = useState<LeagueOutput>({ name: '', abbreviation: '' });

  const createMutation = useMutation((data: LeagueOutput) => LeagueApi.create(data), {
    onSuccess: (result) => {
      setForm({ name: '', abbreviation: '' });
      onOpenChange(false);
      onSuccess?.(result);
    },
  });

  const updateMutation = useMutation((data: LeagueOutput) => LeagueApi.update(league!.id, data), {
    onSuccess: (result) => {
      setForm({ name: '', abbreviation: '' });
      onOpenChange(false);
      onSuccess?.(result);
    },
  });

  useEffect(() => {
    if (league) {
      setForm({ name: league.name, abbreviation: league.abbreviation });
    } else {
      setForm({ name: '', abbreviation: '' });
    }
  }, [league, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && league) {
      await updateMutation.mutate(form);
    } else {
      await createMutation.mutate(form);
    }
  };

  const loading = createMutation.loading || updateMutation.loading;
  const error = createMutation.error || updateMutation.error;

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      if (!newOpen) {
        setForm({ name: '', abbreviation: '' });
        createMutation.reset();
        updateMutation.reset();
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit League' : 'Create League'}</DialogTitle>
        </DialogHeader>

        {error && <ErrorAlert message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="abbr">Abbreviation</Label>
            <Input
              id="abbr"
              value={form.abbreviation}
              onChange={(e) => setForm((f) => ({ ...f, abbreviation: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner size={18} /> : isEditMode ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
