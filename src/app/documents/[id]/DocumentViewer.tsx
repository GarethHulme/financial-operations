'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DocumentViewerProps {
  fileUrl: string | null;
  mimeType: string | null;
  fileName: string;
  sizeBytes: number | null;
}

function formatBytes(b: number | null): string {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function detectKind(mime: string | null, name: string): 'pdf' | 'image' | 'other' {
  const m = (mime || '').toLowerCase();
  const n = name.toLowerCase();
  if (m.includes('pdf') || n.endsWith('.pdf')) return 'pdf';
  if (m.startsWith('image/') || /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(n)) return 'image';
  return 'other';
}

export function DocumentViewer({ fileUrl, mimeType, fileName, sizeBytes }: DocumentViewerProps) {
  const [zoomed, setZoomed] = useState(false);
  const kind = detectKind(mimeType, fileName);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <div className="truncate pr-2">
          <span className="font-medium text-text-primary">{fileName}</span>
        </div>
        <div className="flex gap-3 whitespace-nowrap text-text-muted">
          <span className="uppercase">{kind}</span>
          <span>{formatBytes(sizeBytes)}</span>
          {mimeType && <span className="hidden sm:inline">{mimeType}</span>}
        </div>
      </div>

      <div className="bg-bg rounded-md border border-border overflow-hidden max-h-[80vh] overflow-y-auto">
        {!fileUrl ? (
          <div className="aspect-[3/4] flex items-center justify-center text-text-muted text-sm">
            No file attached
          </div>
        ) : kind === 'pdf' ? (
          <iframe
            src={fileUrl}
            title={fileName}
            className="w-full h-[80vh] bg-white"
          />
        ) : kind === 'image' ? (
          <div
            className={cn(
              'flex items-center justify-center cursor-pointer transition-all',
              zoomed ? 'overflow-auto' : '',
            )}
            onClick={() => setZoomed((z) => !z)}
            title={zoomed ? 'Click to fit' : 'Click to zoom'}
          >
            <img
              src={fileUrl}
              alt={fileName}
              className={cn(
                'transition-all',
                zoomed ? 'max-w-none' : 'max-w-full max-h-[80vh] object-contain',
              )}
            />
          </div>
        ) : (
          <div className="aspect-[3/4] flex flex-col items-center justify-center gap-3 p-6">
            <div className="w-16 h-20 border-2 border-border-strong rounded-md flex items-center justify-center text-text-muted text-xs uppercase tracking-wider">
              {(fileName.split('.').pop() || 'file').slice(0, 4)}
            </div>
            <div className="text-sm text-text-secondary text-center break-all px-4">{fileName}</div>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary cursor-pointer transition-colors"
            >
              Download
            </a>
          </div>
        )}
      </div>

      {fileUrl && kind !== 'other' && (
        <div className="flex justify-between items-center text-xs">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:text-accent-hover transition-colors cursor-pointer"
          >
            Open in new tab ↗
          </a>
          {kind === 'image' && (
            <span className="text-text-muted">Click image to {zoomed ? 'fit' : 'zoom'}</span>
          )}
        </div>
      )}
    </div>
  );
}
