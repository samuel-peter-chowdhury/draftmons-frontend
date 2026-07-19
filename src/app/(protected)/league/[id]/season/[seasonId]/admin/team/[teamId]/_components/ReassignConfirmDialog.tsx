'use client';

import { Button, ErrorAlert, Spinner } from '@/components';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import type { SeasonPokemonInput } from '@/types';

interface ReassignConfirmDialogProps {
  sp: SeasonPokemonInput | null;
  oldTeamName: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mode: 'soft' | 'hard') => void;
  loading: boolean;
  error: string | null;
}

export function ReassignConfirmDialog({
  sp,
  oldTeamName,
  open,
  onOpenChange,
  onConfirm,
  loading,
  error,
}: ReassignConfirmDialogProps) {
  if (!sp?.pokemon) return null;
  const pkmn = sp.pokemon;

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <PokemonSprite
              pokemonId={pkmn.id}
              spriteUrl={pkmn.spriteUrl}
              name={pkmn.name}
              className="h-10 w-10 object-contain"
              disableClick
            />
            <span className="capitalize">Reassign {pkmn.name}?</span>
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Currently on <span className="font-medium">{oldTeamName ?? 'another team'}</span>&apos;s
          roster — assigning it here will unassign it from {oldTeamName ?? 'that team'}.
        </p>
        {error && <ErrorAlert message={error} />}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm('hard')} disabled={loading}>
            Hard-delete old
          </Button>
          <Button onClick={() => onConfirm('soft')} disabled={loading}>
            {loading ? <Spinner size={18} /> : 'Soft-unassign old (default)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
