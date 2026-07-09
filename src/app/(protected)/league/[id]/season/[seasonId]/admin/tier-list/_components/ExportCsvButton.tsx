'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components';
import { generateExportRows, slugify } from '@/lib';
import type { SeasonPokemonInput } from '@/types';

export function ExportCsvButton({
  spData,
  seasonName,
  disabled,
}: {
  spData: SeasonPokemonInput[];
  seasonName?: string;
  disabled?: boolean;
}) {
  function handleExport() {
    const csv = generateExportRows(spData);
    const slug = seasonName ? slugify(seasonName) : '';
    const filename = slug ? `${slug}-tier-list.csv` : 'tier-list.csv';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={disabled || spData.length === 0}
      onClick={handleExport}
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
