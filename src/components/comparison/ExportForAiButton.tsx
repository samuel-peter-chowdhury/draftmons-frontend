'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components';
import type { ExportContext, ExportSide } from '@/lib/aiTeamBuilder/buildExport';
import { ExportForAiDialog } from './ExportForAiDialog';

/**
 * "Export for AI" trigger + dialog, shared by the Team Matchup and Team Build
 * Compare pages. Disabled (with an explanatory tooltip) until both sides are
 * selected and each has at least one Pokemon.
 */
export function ExportForAiButton({
  sideA,
  sideB,
  context,
  generationName,
}: {
  sideA: ExportSide | null;
  sideB: ExportSide | null;
  context: ExportContext;
  generationName?: string;
}) {
  const [open, setOpen] = useState(false);

  const ready = !!sideA && !!sideB && sideA.pokemon.length > 0 && sideB.pokemon.length > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Wrapper span keeps the tooltip working while the button is disabled. */}
          <span className="inline-flex">
            <Button
              variant="outline"
              size="sm"
              disabled={!ready}
              onClick={() => setOpen(true)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Export for AI
            </Button>
          </span>
        </TooltipTrigger>
        {!ready && <TooltipContent>Select two teams with Pokemon to export.</TooltipContent>}
      </Tooltip>

      {sideA && sideB && (
        <ExportForAiDialog
          open={open}
          onOpenChange={setOpen}
          sideA={sideA}
          sideB={sideB}
          context={context}
          generationName={generationName}
        />
      )}
    </TooltipProvider>
  );
}
