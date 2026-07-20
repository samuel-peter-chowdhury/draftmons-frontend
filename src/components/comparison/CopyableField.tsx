'use client';

import { memo, useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const CopyableField = memo(function CopyableField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API not available (e.g. insecure context)
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="truncate text-sm">{value || '—'}</p>
      </div>
      {value && (
        <button
          onClick={handleCopy}
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
});
