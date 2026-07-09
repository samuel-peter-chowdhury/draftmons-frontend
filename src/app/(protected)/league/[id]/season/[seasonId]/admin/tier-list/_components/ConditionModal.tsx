'use client';

import { useState, useEffect } from 'react';
import { Button, Spinner } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import type { SeasonPokemonInput } from '@/types';

export function ConditionModal({
  sp,
  open,
  onOpenChange,
  onSave,
  saving,
}: {
  sp: SeasonPokemonInput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sp: SeasonPokemonInput, condition: string) => void;
  saving: boolean;
}) {
  const [condition, setCondition] = useState('');

  useEffect(() => {
    if (sp) setCondition(sp.condition ?? '');
  }, [sp]);

  if (!sp) return null;

  const pkmn = sp.pokemon;
  if (!pkmn) return null;

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
            <span className="capitalize">{pkmn.name} — Condition</span>
          </DialogTitle>
        </DialogHeader>
        <Textarea
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="Enter condition notes..."
          rows={4}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => onSave(sp, condition)} disabled={saving}>
            {saving ? <Spinner size={18} /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
