import { getDb } from '@/db';
import { invoiceDisputes, invoiceDisputeEvents, invoiceDisputeResolutions, supplierInvoices, suppliers } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/chips/StatusChip';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function load(id: string) {
  try {
    const db = getDb();
    const [dispute] = await db.select().from(invoiceDisputes).where(eq(invoiceDisputes.id, id));
    if (!dispute) return null;
    const [events, resolutions, invoiceRows] = await Promise.all([
      db.select().from(invoiceDisputeEvents).where(eq(invoiceDisputeEvents.disputeId, id)).orderBy(asc(invoiceDisputeEvents.createdAt)),
      db.select().from(invoiceDisputeResolutions).where(eq(invoiceDisputeResolutions.disputeId, id)),
      dispute.supplierInvoiceId
        ? db
            .select({ i: supplierInvoices, sup: suppliers.legalName })
            .from(supplierInvoices)
            .leftJoin(suppliers, eq(suppliers.id, supplierInvoices.supplierId))
            .where(eq(supplierInvoices.id, dispute.supplierInvoiceId))
        : Promise.resolve([] as any[]),
    ]);
    return { dispute, events, resolutions, invoice: invoiceRows[0]?.i, supplierName: invoiceRows[0]?.sup };
  } catch {
    return null;
  }
}

export default async function DisputeDetail({ params }: { params: { id: string } }) {
  const data = await load(params.id);
  if (!data) notFound();
  const { dispute, events, resolutions, invoice, supplierName } = data;
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dispute — ${invoice?.invoiceNumber ?? 'Unknown invoice'}`}
        subtitle={supplierName ?? undefined}
        actions={<StatusChip status={dispute.status} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="label mb-2">Dispute Summary</div>
          <div className="text-sm">
            <div>
              <span className="text-text-muted">Reason:</span> {dispute.reasonCode}
            </div>
            <div>
              <span className="text-text-muted">Held:</span> {formatCurrency(dispute.heldAmount)}
            </div>
            <div>
              <span className="text-text-muted">Opened:</span> {formatDate(dispute.openedAt)}
            </div>
            {dispute.closedAt && (
              <div>
                <span className="text-text-muted">Closed:</span> {formatDate(dispute.closedAt)}
              </div>
            )}
            {dispute.summary && <p className="mt-2 text-text-secondary">{dispute.summary}</p>}
          </div>
        </div>
        <div className="card">
          <div className="label mb-2">Original Invoice</div>
          {invoice ? (
            <div className="text-sm space-y-1">
              <div>
                <span className="text-text-muted">Number:</span> {invoice.invoiceNumber}
              </div>
              <div>
                <span className="text-text-muted">Issued:</span> {formatDate(invoice.issueDate)}
              </div>
              <div>
                <span className="text-text-muted">Due:</span> {formatDate(invoice.dueDate)}
              </div>
              <div>
                <span className="text-text-muted">Total:</span> {formatCurrency(invoice.grandTotal)}
              </div>
              <div>
                <span className="text-text-muted">Status:</span> <StatusChip status={invoice.status} />
              </div>
            </div>
          ) : (
            <div className="text-text-muted text-sm">No invoice linked</div>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Timeline</h2>
        <div className="space-y-2">
          {events.length === 0 && <div className="text-sm text-text-muted">No events</div>}
          {events.map((e) => (
            <div key={e.id} className="card">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium capitalize">{e.eventType.replace(/_/g, ' ')}</div>
                <div className="text-xs text-text-muted">{formatDate(e.createdAt)}</div>
              </div>
              {e.note && <div className="text-sm text-text-secondary mt-1">{e.note}</div>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Resolutions</h2>
        <div className="space-y-2">
          {resolutions.length === 0 && <div className="text-sm text-text-muted">No resolutions yet</div>}
          {resolutions.map((r) => (
            <div key={r.id} className="card flex items-center justify-between">
              <div>
                <div className="text-sm font-medium capitalize">{r.resolutionType.replace(/_/g, ' ')}</div>
                {r.notes && <div className="text-xs text-text-muted">{r.notes}</div>}
              </div>
              {r.agreedAmount && <div className="text-sm">{formatCurrency(r.agreedAmount)}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
