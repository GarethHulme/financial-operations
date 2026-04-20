'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const KINDS = [
  { value: 'supplier_invoice', label: 'Supplier invoice' },
  { value: 'client_invoice', label: 'Client invoice' },
  { value: 'supplier_contract', label: 'Supplier contract' },
  { value: 'credit_note', label: 'Credit note' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'supporting', label: 'Supporting document' },
];

const ACCEPT =
  'application/pdf,image/png,image/jpeg,image/jpg,image/webp,.pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<string>('supplier_invoice');
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const upload = async () => {
    if (!file) {
      setError('Select a file first');
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', kind);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/documents/upload');
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(fd);
      });

      setProgress(100);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(null), 800);
    }
  };

  return (
    <div className="card mb-4">
      <div className="label mb-3">Upload document</div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? 'border-accent bg-bg-raised' : 'border-border hover:border-border-strong'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="text-sm">
              <div className="font-medium">{file.name}</div>
              <div className="text-xs text-text-muted mt-1">
                {(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown'}
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-secondary">
              <div>Drag & drop a file here, or click to browse</div>
              <div className="text-xs text-text-muted mt-1">PDF, images, XLSX, CSV</div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 md:w-56">
          <label className="label">Document type</label>
          <select
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            disabled={uploading}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <button
            onClick={upload}
            disabled={!file || uploading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed justify-center"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {progress != null && (
        <div className="mt-3">
          <div className="h-1.5 bg-bg-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-text-muted mt-1">{progress}%</div>
        </div>
      )}

      {error && <div className="mt-3 text-xs text-severity-critical">{error}</div>}
    </div>
  );
}
