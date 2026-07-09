'use client';

import { Button } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BulkUpsertEntryStatus, type BulkUpsertEntryResult } from '@/types';

export function ImportResultsDialog({
  results,
  open,
  onOpenChange,
}: {
  results: BulkUpsertEntryResult[] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!results) return null;

  const total = results.length;
  const succeeded = results.filter((r) => r.status === BulkUpsertEntryStatus.SUCCESS).length;
  const failed = results.filter((r) => r.status === BulkUpsertEntryStatus.FAILURE);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            Imported {succeeded} of {total} rows
          </DialogTitle>
        </DialogHeader>
        {failed.length > 0 ? (
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {failed.map((r, i) => (
              <li key={i} className="text-sm">
                <span className="capitalize">{r.name}</span>{' '}
                <span className="text-muted-foreground">
                  ({r.pointValue === undefined ? '—' : r.pointValue})
                </span>
                {' — '}
                <span className="text-destructive">{r.message ?? r.code}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">All rows applied successfully.</p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
