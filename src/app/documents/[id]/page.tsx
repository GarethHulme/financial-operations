import { getDb } from '@/db';
import { documentIngestions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/chips/StatusChip';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ActionButtons } from './ActionButtons';

export const dynamic = 'force-dynamic';

async function load(id: string) {
  try {
    const db = getDb();
    const [row] = await db.select().from(documentIngestions).where(eq(documentIngestions.id, id));
    return row ?? null;
  } catch {
    return null;
  }
}

export default async function DocumentDetail({ params }: { params: { id: string } }) {
  const doc = await load(params.id);
  if (!doc) notFound();
  const fields = (doc.extractedFields as Record<string, any>) || {};
  const confidence = (doc.fieldConfidence as Record<string, number>) || {};
  const matches = (doc.suggestedMatches as any[]) || [];
  const duplicates = (doc.duplicateRiskFlags as any[]) || [];
  const mismatches = (doc.contractMismatchFlags as any[]) || [];
  const credit = (doc.creditWarningFlags as any[]) || [];

  return (
    <div>
      <PageHeader
        title={doc.originalFileName}
        subtitle={`${doc.kind.replace(/_/g, ' ')} · uploaded ${formatDate(doc.createdAt)}`}
        actions={<StatusChip status={doc.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="label mb-3">Original Document</div>
          <div className="aspect-[3/4] bg-bg rounded-md border border-border flex items-center justify-center text-text-muted text-sm">
            {doc.fileUrl ? (
              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                Open file
              </a>
            ) : (
              'Document preview placeholder'
            )}
          </div>
          {doc.ocrConfidence != null && (
            <div className="mt-3 text-xs text-text-secondary">
              OCR confidence: {(Number(doc.ocrConfidence) * 100).toFixed(1)}%
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="label mb-3">Extracted Fields</div>
            <div className="space-y-1.5 text-sm">
              {Object.keys(fields).length === 0 && <div className="text-text-muted">No fields extracted</div>}
              {Object.entries(fields).map(([k, v]) => {
                const c = confidence[k];
                return (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <span className="text-text-muted capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs">
                        {typeof v === 'number' && k.toLowerCase().includes('total') ? formatCurrency(v) : String(v)}
                      </span>
                      {c != null && (
                        <span className="text-[10px] text-text-muted">{(c * 100).toFixed(0)}%</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="label mb-3">Suggested Matches</div>
            <div className="space-y-2 text-sm">
              {matches.length === 0 && <div className="text-text-muted">No matches suggested</div>}
              {matches.map((m, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border pb-1 last:border-0">
                  <div>
                    <span className="text-text-secondary capitalize">{m.type}</span>:{' '}
                    <span className="text-text-primary">{m.label}</span>
                  </div>
                  <span className="text-[10px] text-text-muted">{m.score ? `${Math.round(m.score * 100)}%` : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {(duplicates.length > 0 || mismatches.length > 0 || credit.length > 0) && (
            <div className="card border-severity-warning/40">
              <div className="label mb-2 text-severity-warning">Flags</div>
              <ul className="text-xs space-y-1">
                {duplicates.map((d, i) => (
                  <li key={`d${i}`}>⚠ Duplicate risk: {typeof d === 'string' ? d : JSON.stringify(d)}</li>
                ))}
                {mismatches.map((d, i) => (
                  <li key={`m${i}`}>⚠ Contract mismatch: {typeof d === 'string' ? d : JSON.stringify(d)}</li>
                ))}
                {credit.map((d, i) => (
                  <li key={`c${i}`}>⚠ Credit warning: {typeof d === 'string' ? d : JSON.stringify(d)}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <div className="label mb-2">Action</div>
            <p className="text-sm text-text-secondary mb-3">
              Confirm to create the finance record. Upload is never silent — nothing enters workflow without explicit
              confirmation.
            </p>
            <ActionButtons id={doc.id} currentStatus={doc.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
