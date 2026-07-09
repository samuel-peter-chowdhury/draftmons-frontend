'use client';

import { Button, ErrorAlert, Spinner } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import type { SeasonPokemonInput } from '@/types';

export function DeleteConfirmDialog({
  sp,
  open,
  onOpenChange,
  onConfirm,
  deleting,
  error,
}: {
  sp: SeasonPokemonInput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting: boolean;
  error: string | null;
}) {
  if (!sp) return null;

  const pkmn = sp.pokemon;
  if (!pkmn) return null;

  const isDrafted = (sp.seasonPokemonTeams?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <span className="capitalize">Remove {pkmn.name}?</span>
          </DialogTitle>
        </DialogHeader>
        {isDrafted && (
          <p className="text-sm text-destructive">
            This pokemon has team assignments and cannot be removed until those are cleared.
          </p>
        )}
        {error && <ErrorAlert message={error} />}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? <Spinner size={18} /> : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
