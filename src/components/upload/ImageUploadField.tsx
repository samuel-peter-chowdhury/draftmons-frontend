'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { upload } from '@vercel/blob/client';
import { Button, ErrorAlert } from '@/components';

// The double-submit CSRF token is a readable cookie; every mutating request
// (including our Blob upload-token exchange) must echo it back as a header,
// exactly like lib/api.ts's apiFetch does.
function getCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

interface ImageUploadFieldProps {
  /**
   * Same-origin (relative) path to the entity's upload-token route, e.g.
   * `/api/pokemon/1/sprite-upload-token`. Relative so the browser's fetch is
   * same-origin (session cookie + CSRF flow) and proxied to the backend by the
   * Next.js /api rewrite in both dev and prod.
   */
  uploadTokenEndpoint: string;
  /**
   * Blob path prefix the backend enforces for this entity, e.g.
   * `sprites/pokemon/1/`. The uploaded filename is appended to it.
   */
  pathPrefix: string;
  /** Currently-stored image URL, shown as a preview (or an empty state if unset). */
  currentUrl?: string | null;
  /** Called with the new public Blob URL once an upload completes. */
  onUploadComplete: (url: string) => void;
  /** Optional "remove" affordance; the parent decides what to persist (null/''). */
  onRemove?: () => void;
  maxSizeMB?: number;
  accept?: string;
  /** Accessible label for the upload button. */
  label?: string;
  disabled?: boolean;
}

const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/webp';

export function ImageUploadField({
  uploadTokenEndpoint,
  pathPrefix,
  currentUrl,
  onUploadComplete,
  onRemove,
  maxSizeMB = 5,
  accept = DEFAULT_ACCEPT,
  label = 'Upload image',
  disabled = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const busy = uploading || disabled;

  const handleFile = async (file: File) => {
    setError(null);

    // Client-side pre-checks for fast feedback. The real enforcement lives in
    // the backend's handleUpload token constraints — a bypassed client is still
    // blocked there.
    const allowed = accept.split(',').map((t) => t.trim());
    if (!allowed.includes(file.type)) {
      setError(`Unsupported file type. Allowed: ${allowed.join(', ')}.`);
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB} MB.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const csrfToken = getCsrfToken();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await upload(`${pathPrefix}${safeName}`, file, {
        access: 'public',
        handleUploadUrl: uploadTokenEndpoint,
        headers: csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : undefined,
        onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
      });
      onUploadComplete(blob.url);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt="Current image"
            width={96}
            height={96}
            unoptimized
            className="h-16 w-16 rounded-lg border border-border/[0.08] object-contain"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border/[0.15] text-xs text-muted-foreground">
            None
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? `Uploading… ${progress}%` : label}
            </Button>
            {onRemove && currentUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  onRemove();
                }}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPEG or WebP. Max {maxSizeMB} MB.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so selecting the same file again re-fires onChange.
          e.target.value = '';
          if (file) void handleFile(file);
        }}
      />

      {error && <ErrorAlert title="Upload failed" message={error} />}
    </div>
  );
}
