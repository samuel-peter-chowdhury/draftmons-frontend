'use client';

import { Button, ErrorAlert, Spinner } from '@/components';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import type { SeasonPokemonInput } from '@/types';

interface RemoveRosterEntryDialogProps {
  sp: SeasonPokemonInput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSoftUnassign: () => void;
  onHardDelete: () => void;
  loading: boolean;
  error: string | null;
}

export function RemoveRosterEntryDialog({
  sp,
  open,
  onOpenChange,
  onSoftUnassign,
  onHardDelete,
  loading,
  error,
}: RemoveRosterEntryDialogProps) {
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
            <span className="capitalize">Remove {pkmn.name} from roster?</span>
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Soft-unassign keeps the pick in the team&apos;s roster history. Hard-delete removes it
          permanently.
        </p>
        {error && <ErrorAlert message={error} />}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onHardDelete} disabled={loading}>
            Hard-delete
          </Button>
          <Button onClick={onSoftUnassign} disabled={loading}>
            {loading ? <Spinner size={18} /> : 'Soft-unassign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
