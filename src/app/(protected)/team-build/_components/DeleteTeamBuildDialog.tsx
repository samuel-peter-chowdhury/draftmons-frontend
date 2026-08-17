'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorAlert,
  Spinner,
} from '@/components';
import type { TeamBuildInput } from '@/types';

interface DeleteTeamBuildDialogProps {
  teamBuild: TeamBuildInput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}

export function DeleteTeamBuildDialog({
  teamBuild,
  open,
  onOpenChange,
  onConfirm,
  loading,
  error,
}: DeleteTeamBuildDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{teamBuild?.name}&rdquo;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This permanently deletes the team build and every Pokémon set in it. This can&apos;t be
          undone.
        </p>
        {error && <ErrorAlert message={error} />}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner size={18} /> : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
