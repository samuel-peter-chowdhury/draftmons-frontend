'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button, ErrorAlert, Spinner } from '@/components';
import { parseCsvRows, validateCsvStructure, buildBulkUpsertEntries } from '@/lib';
import type { BulkUpsertEntryInput } from '@/types';

export function ImportCsvButton({
  loading,
  disabled,
  onImport,
}: {
  loading: boolean;
  disabled?: boolean;
  onImport: (entries: BulkUpsertEntryInput[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    let text: string;
    try {
      text = await file.text();
    } catch {
      setFileError('Could not read file. Please choose a valid CSV file.');
      event.target.value = '';
      return;
    }

    const rows = parseCsvRows(text);
    const result = validateCsvStructure(rows);

    if ('error' in result) {
      setFileError(result.error);
      event.target.value = '';
      return;
    }

    setFileError(null);
    onImport(buildBulkUpsertEntries(result));
    event.target.value = '';
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={loading || disabled}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? (
          <Spinner size={18} />
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Import CSV
          </>
        )}
      </Button>
      <input
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        ref={inputRef}
        onChange={handleFile}
      />
      {fileError && <ErrorAlert message={fileError} />}
    </div>
  );
}
