import { getDb } from '@/db';
import { documentIngestions } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/chips/StatusChip';
import { formatDate } from '@/lib/utils';
import { UploadForm } from './UploadForm';
import { DocumentThumbnail } from './DocumentThumbnail';

export const dynamic = 'force-dynamic';

async function load() {
  try {
    const db = getDb();
    return await db.select().from(documentIngestions).orderBy(desc(documentIngestions.createdAt)).limit(100);
  } catch {
    return [] as any[];
  }
}

export default async function DocumentsPage() {
  const rows = await load();
  return (
    <div>
      <PageHeader
        title="Document Ingestion"
        subtitle="Upload supplier/client invoices, contracts, credit notes, and receipts. Upload is not creation — confirmation is creation."
      />
      <div className="card mb-4 text-xs text-text-secondary">
        Preview matching surfaces OCR confidence, field confidence, suggested matches, duplicate risk flags, contract
        mismatch warnings, and credit limit warnings. No invoice enters workflow without preview confirmation.
      </div>
      <UploadForm />
      <div className="space-y-2">
        {rows.length === 0 && (
          <div className="card text-center text-text-muted py-10">
            No documents yet. Upload a file above to ingest.
          </div>
        )}
        {rows.map((d) => {
          const fields = (d.extractedFields as Record<string, any>) || {};
          const conf = d.ocrConfidence ? Math.round(Number(d.ocrConfidence) * 100) : null;
          return (
            <Link
              key={d.id}
              href={`/documents/${d.id}`}
              className="card card-hover block cursor-pointer transition-all group"
            >
              <div className="flex items-start gap-4">
                <DocumentThumbnail
                  fileUrl={d.fileUrl}
                  mimeType={d.mimeType}
                  fileName={d.originalFileName}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusChip status={d.status} />
                    <span className="text-xs text-text-muted capitalize">{d.kind.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-sm font-medium mt-1 truncate">{d.originalFileName}</div>
                  {fields.invoiceNumber && (
                    <div className="text-xs text-text-secondary mt-1">
                      Invoice {fields.invoiceNumber} · {fields.grandTotal ? `£${fields.grandTotal}` : ''}
                    </div>
                  )}
                </div>
                <div className="text-xs text-text-muted text-right flex flex-col items-end gap-1">
                  <div>{formatDate(d.createdAt)}</div>
                  {conf != null && <div>OCR {conf}%</div>}
                  <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
