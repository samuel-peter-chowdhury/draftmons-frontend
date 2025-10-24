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
  Textarea,
} from '@/components';
import { useFetch, useMutation } from '@/hooks';
import { LeagueApi } from '@/lib/api';
import { BASE_ENDPOINTS } from '@/lib/constants';
import { formatGenerationName } from '@/lib/utils';
import type { SeasonOutputDto, SeasonStatus, GenerationOutputDto, PaginatedResponse } from '@/types';

interface CreateSeasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: number;
  onSuccess?: () => void;
}

export function CreateSeasonModal({
  open,
  onOpenChange,
  leagueId,
  onSuccess,
}: CreateSeasonModalProps) {
  const { data: generationsResponse, loading: generationsLoading, error: generationsError } =
    useFetch<PaginatedResponse<GenerationOutputDto>>(open ? BASE_ENDPOINTS.GENERATION_BASE : null);

  const generations = generationsResponse?.data;

  const defaultForm = {
    name: '',
    status: 'PRE_DRAFT' as SeasonStatus,
    rules: '',
    pointLimit: 100,
    maxPointValue: 20,
    generationId: 0,
    leagueId,
  };

  const [form, setForm] = useState<SeasonOutputDto>(defaultForm);

  const createSeasonMutation = useMutation((data: SeasonOutputDto) => LeagueApi.createSeason(leagueId, data), {
    onSuccess: () => {
      setForm(defaultForm);
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSeasonMutation.mutate({ ...form, leagueId });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!createSeasonMutation.loading) {
      if (!newOpen) {
        setForm(defaultForm);
        createSeasonMutation.reset();
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Season</DialogTitle>
        </DialogHeader>

        {createSeasonMutation.error && <ErrorAlert message={createSeasonMutation.error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="season-name">Name</Label>
            <Input
              id="season-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              disabled={createSeasonMutation.loading}
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
                disabled={createSeasonMutation.loading || !generations || generations.length === 0}
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
              disabled={createSeasonMutation.loading}
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
              disabled={createSeasonMutation.loading}
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
              disabled={createSeasonMutation.loading}
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="season-rules">Rules</Label>
            <Textarea
              id="season-rules"
              value={form.rules}
              onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
              disabled={createSeasonMutation.loading}
              placeholder="Enter season rules..."
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createSeasonMutation.loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSeasonMutation.loading}>
              {createSeasonMutation.loading ? <Spinner size={18} /> : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
