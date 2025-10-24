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
import { Api } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import type { LeagueInputDto, LeagueOutputDto } from '@/types';

interface CreateLeagueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  league?: LeagueInputDto | null;
  onSuccess?: (league?: LeagueInputDto) => void;
}

export function CreateLeagueModal({
  open,
  onOpenChange,
  league,
  onSuccess,
}: CreateLeagueModalProps) {
  const isEditMode = !!league;
  const [form, setForm] = useState<LeagueOutputDto>({ name: '', abbreviation: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (league) {
      setForm({ name: league.name, abbreviation: league.abbreviation });
    } else {
      setForm({ name: '', abbreviation: '' });
    }
  }, [league, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result: LeagueInputDto;
      if (isEditMode && league) {
        result = await Api.put<LeagueInputDto>(`${BASE_ENDPOINTS.LEAGUE_BASE}/${league.id}`, form);
      } else {
        result = await Api.post<LeagueInputDto>(BASE_ENDPOINTS.LEAGUE_BASE, form);
      }
      setForm({ name: '', abbreviation: '' });
      onOpenChange(false);
      onSuccess?.(result);
    } catch (e) {
      const error = e as { body?: { message?: string }; message?: string };
      setError(
        error?.body?.message ||
          error?.message ||
          `Failed to ${isEditMode ? 'update' : 'create'} league`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      if (!newOpen) {
        setForm({ name: '', abbreviation: '' });
        setError(null);
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
