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
import { useFetch, useMutation } from '@/hooks';
import { LeagueApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatGenerationName } from '@/lib/utils';
import type { SeasonInput, SeasonOutput, SeasonStatus, GenerationOutput, PaginatedResponse } from '@/types';

interface CreateSeasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: number;
  /** When provided, the modal operates in edit mode */
  season?: SeasonInput;
  onSuccess?: () => void;
}

export function CreateSeasonModal({
  open,
  onOpenChange,
  leagueId,
  season,
  onSuccess,
}: CreateSeasonModalProps) {
  const isEditMode = !!season;

  const { data: generationsResponse, loading: generationsLoading, error: generationsError } =
    useFetch<PaginatedResponse<GenerationOutput>>(open ? BASE_ENDPOINTS.GENERATION_BASE : null);

  const generations = generationsResponse?.data;

  const getDefaultForm = (): Omit<SeasonOutput, 'rules'> => ({
    name: season?.name || '',
    status: season?.status || ('PRE_DRAFT' as SeasonStatus),
    pointLimit: season?.pointLimit ?? 100,
    maxPointValue: season?.maxPointValue ?? 20,
    generationId: season?.generationId || 0,
    leagueId,
  });

  const [form, setForm] = useState<Omit<SeasonOutput, 'rules'>>(getDefaultForm());

  // Reset form when modal opens or season changes
  useEffect(() => {
    if (open) {
      setForm(getDefaultForm());
    }
  }, [open, season]);

  const createSeasonMutation = useMutation(
    (data: Omit<SeasonOutput, 'rules'>) => LeagueApi.createSeason(leagueId, data as SeasonOutput),
    {
      onSuccess: () => {
        setForm(getDefaultForm());
        onOpenChange(false);
        onSuccess?.();
      },
    },
  );

  const updateSeasonMutation = useMutation(
    (data: Partial<SeasonOutput>) => LeagueApi.updateSeason(leagueId, season!.id, data),
    {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
    },
  );

  const mutation = isEditMode ? updateSeasonMutation : createSeasonMutation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
      await updateSeasonMutation.mutate({
        name: form.name,
        status: form.status,
        pointLimit: form.pointLimit,
        maxPointValue: form.maxPointValue,
        generationId: form.generationId,
      });
    } else {
      await createSeasonMutation.mutate({ ...form, leagueId });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!mutation.loading) {
      if (!newOpen) {
        setForm(getDefaultForm());
        mutation.reset();
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Season' : 'Create Season'}</DialogTitle>
        </DialogHeader>

        {mutation.error && <ErrorAlert message={mutation.error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="season-name">Name</Label>
            <Input
              id="season-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              disabled={mutation.loading}
              placeholder="e.g., Season 1"
            />
          </div>

          <div>
            <Label htmlFor="season-generation">Generation</Label>
            {generationsLoading ? (
              <div className="flex h-10 items-center justify-center rounded-md border border-input bg-background">
                <Spinner size={16} />
              </div>
            ) : generationsError ? (
              <ErrorAlert message="Failed to load generations" />
            ) : (
              <Select
                id="season-generation"
                value={form.generationId}
                onChange={(e) => setForm((f) => ({ ...f, generationId: Number(e.target.value) }))}
                required
                disabled={mutation.loading || !generations || generations.length === 0}
              >
                <option value={0} disabled>
                  Select a generation
                </option>
                {generations?.map((generation) => (
                  <option key={generation.id} value={generation.id}>
                    {formatGenerationName(generation.name)}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="season-status">Status</Label>
            <Select
              id="season-status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SeasonStatus }))}
              required
              disabled={mutation.loading}
            >
              <option value="PRE_DRAFT">Pre-Draft</option>
              <option value="DRAFT">Draft</option>
              <option value="PRE_SEASON">Pre-Season</option>
              <option value="REGULAR_SEASON">Regular Season</option>
              <option value="POST_SEASON">Post-Season</option>
              <option value="PLAYOFFS">Playoffs</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="season-point-limit">Point Limit</Label>
            <Input
              id="season-point-limit"
              type="number"
              value={form.pointLimit}
              onChange={(e) => setForm((f) => ({ ...f, pointLimit: Number(e.target.value) }))}
              required
              disabled={mutation.loading}
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="season-max-point">Max Point Value</Label>
            <Input
              id="season-max-point"
              type="number"
              value={form.maxPointValue}
              onChange={(e) => setForm((f) => ({ ...f, maxPointValue: Number(e.target.value) }))}
              required
              disabled={mutation.loading}
              min="0"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.loading}>
              {mutation.loading ? <Spinner size={18} /> : isEditMode ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
