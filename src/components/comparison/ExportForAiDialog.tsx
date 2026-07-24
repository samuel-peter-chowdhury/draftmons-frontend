'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
} from '@/components';
import {
  buildExport,
  exportFilename,
  type ExportContext,
  type ExportSide,
} from '@/lib/aiTeamBuilder/buildExport';

type Role = 'A' | 'B';

export function ExportForAiDialog({
  open,
  onOpenChange,
  sideA,
  sideB,
  context,
  generationName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sideA: ExportSide;
  sideB: ExportSide;
  context: ExportContext;
  generationName?: string;
}) {
  // Which selected side is "my team". The opponent is always the other one, so
  // the two roles stay filled and distinct by construction.
  const [myTeamRole, setMyTeamRole] = useState<Role>('A');
  const [copied, setCopied] = useState(false);

  const myTeam = myTeamRole === 'A' ? sideA : sideB;
  const opponent = myTeamRole === 'A' ? sideB : sideA;

  const exportText = useMemo(
    () => buildExport(myTeam, opponent, { context, generationName }),
    [myTeam, opponent, context, generationName],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API not available (e.g. insecure context) — Download still works.
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exportFilename(myTeam.label, opponent.label);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>Export for AI</DialogTitle>
          <DialogDescription>
            Assign a role to each side, then copy or download the prompt + dataset to paste into the
            LLM of your choice.
          </DialogDescription>
        </DialogHeader>

        {/* Role picker */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">My team (build for this)</Label>
            <Select value={myTeamRole} onChange={(e) => setMyTeamRole(e.target.value as Role)}>
              <option value="A">{sideA.label || 'Side A'}</option>
              <option value="B">{sideB.label || 'Side B'}</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Opponent</Label>
            <Select
              value={myTeamRole === 'A' ? 'B' : 'A'}
              onChange={(e) => setMyTeamRole(e.target.value === 'A' ? 'B' : 'A')}
            >
              <option value="A">{sideA.label || 'Side A'}</option>
              <option value="B">{sideB.label || 'Side B'}</option>
            </Select>
          </div>
        </div>

        {/* Preview */}
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border/[0.08] bg-background/60 p-3">
          <pre className="whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
            {exportText}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-success" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download .md
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
