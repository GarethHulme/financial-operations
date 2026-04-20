import { cn } from '@/lib/utils';

function detectKind(mime: string | null | undefined, name: string): 'pdf' | 'image' | 'other' {
  const m = (mime || '').toLowerCase();
  const n = name.toLowerCase();
  if (m.includes('pdf') || n.endsWith('.pdf')) return 'pdf';
  if (m.startsWith('image/') || /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(n)) return 'image';
  return 'other';
}

export function DocumentThumbnail({
  fileUrl,
  mimeType,
  fileName,
  size = 48,
}: {
  fileUrl: string | null;
  mimeType: string | null | undefined;
  fileName: string;
  size?: number;
}) {
  const kind = detectKind(mimeType, fileName);
  const base = 'shrink-0 rounded-md border border-border bg-bg flex items-center justify-center overflow-hidden';
  const style = { width: size, height: size };

  if (kind === 'image' && fileUrl) {
    return (
      <div className={cn(base)} style={style}>
        <img src={fileUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (kind === 'pdf') {
    return (
      <div
        className={cn(base, 'bg-severity-critical/10 border-severity-critical/40 text-severity-critical font-bold text-[10px]')}
        style={style}
      >
        PDF
      </div>
    );
  }

  const ext = (fileName.split('.').pop() || 'FILE').slice(0, 4).toUpperCase();
  return (
    <div
      className={cn(base, 'bg-bg-raised text-text-muted font-mono text-[10px] font-semibold')}
      style={style}
    >
      {ext}
    </div>
  );
}
