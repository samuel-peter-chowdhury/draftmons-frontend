'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  ErrorAlert,
  Spinner,
} from '@/components';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useMutation } from '@/hooks';
import { LeagueApi } from '@/lib/api';

interface EditRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: number;
  seasonId: number;
  currentRules: string;
  onSuccess?: () => void;
}

export function EditRulesModal({
  open,
  onOpenChange,
  leagueId,
  seasonId,
  currentRules,
  onSuccess,
}: EditRulesModalProps) {
  const [rules, setRules] = useState(currentRules);

  // Reset rules when modal opens with new content
  useEffect(() => {
    if (open) {
      setRules(currentRules);
    }
  }, [open, currentRules]);

  const updateRulesMutation = useMutation(
    (data: { rules: string }) => LeagueApi.updateSeason(leagueId, seasonId, data),
    {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
    },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateRulesMutation.mutate({ rules });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!updateRulesMutation.loading) {
      if (!newOpen) {
        setRules(currentRules);
        updateRulesMutation.reset();
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Season Rules</DialogTitle>
        </DialogHeader>

        {updateRulesMutation.error && <ErrorAlert message={updateRulesMutation.error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <RichTextEditor
            content={rules}
            onChange={setRules}
            disabled={updateRulesMutation.loading}
            placeholder="Enter the rules for this season..."
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={updateRulesMutation.loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateRulesMutation.loading}>
              {updateRulesMutation.loading ? <Spinner size={18} /> : 'Save Rules'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
