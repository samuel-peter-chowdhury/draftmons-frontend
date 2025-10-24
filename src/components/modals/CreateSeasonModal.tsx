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
import { useFetch } from '@/hooks';
import { Api } from '@/lib/api';
import { BASE_ENDPOINTS, LEAGUE_ENDPOINTS } from '@/lib/constants';
import { formatGenerationName } from '@/lib/utils';
import type { SeasonInputDto, SeasonOutputDto, SeasonStatus, GenerationOutputDto, PaginatedResponse } from '@/types';

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
  const { data: generationsResponse, loading: generationsLoading, error: generationsError } = useFetch<PaginatedResponse<GenerationOutputDto>>(
    BASE_ENDPOINTS.GENERATION_BASE,
  );

  const generations = generationsResponse?.data;

  const [form, setForm] = useState<Omit<SeasonOutputDto, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    status: 'PRE_DRAFT' as SeasonStatus,
    rules: '',
    pointLimit: 100,
    maxPointValue: 20,
    generationId: 0,
    leagueId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await Api.post<SeasonInputDto>(BASE_ENDPOINTS.LEAGUE_BASE + `/${leagueId}` + LEAGUE_ENDPOINTS.SEASON, {
        ...form,
        leagueId,
      });
      setForm({
        name: '',
        status: 'PRE_DRAFT' as SeasonStatus,
        rules: '',
        pointLimit: 100,
        maxPointValue: 20,
        generationId: 0,
        leagueId,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      const error = e as { body?: { message?: string }; message?: string };
      setError(error?.body?.message || error?.message || 'Failed to create season');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      if (!newOpen) {
        setForm({
          name: '',
          status: 'PRE_DRAFT' as SeasonStatus,
          rules: '',
          pointLimit: 100,
          maxPointValue: 20,
          generationId: 0,
          leagueId,
        });
        setError(null);
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

        {error && <ErrorAlert message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="season-name">Name</Label>
            <Input
              id="season-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              disabled={loading}
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
                disabled={loading || !generations || generations.length === 0}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="season-rules">Rules</Label>
            <Textarea
              id="season-rules"
              value={form.rules}
              onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
              disabled={loading}
              placeholder="Enter season rules..."
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
              {loading ? <Spinner size={18} /> : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
