import { getDb } from '@/db';
import { invoiceDisputes, supplierInvoices, suppliers } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { StatusChip } from '@/components/chips/StatusChip';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function load() {
  try {
    const db = getDb();
    const rows = await db
      .select({ d: invoiceDisputes, inv: supplierInvoices.invoiceNumber, sup: suppliers.legalName })
      .from(invoiceDisputes)
      .leftJoin(supplierInvoices, eq(supplierInvoices.id, invoiceDisputes.supplierInvoiceId))
      .leftJoin(suppliers, eq(suppliers.id, supplierInvoices.supplierId))
      .orderBy(desc(invoiceDisputes.openedAt))
      .limit(200);
    return rows.map((r) => ({ ...r.d, invoiceNumber: r.inv, supplierName: r.sup }));
  } catch {
    return [] as any[];
  }
}

export default async function DisputesPage() {
  const rows = await load();
  const cols: Column<any>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      render: (r) => (
        <Link href={`/disputes/${r.id}`} className="font-mono text-xs hover:text-accent">
          {r.invoiceNumber ?? '—'}
        </Link>
      ),
    },
    { key: 'supplierName', header: 'Supplier' },
    { key: 'reasonCode', header: 'Reason' },
    { key: 'heldAmount', header: 'Held', align: 'right', render: (r) => formatCurrency(r.heldAmount) },
    { key: 'openedAt', header: 'Opened', render: (r) => formatDate(r.openedAt) },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
  ];
  return (
    <div>
      <PageHeader
        title="Disputes"
        subtitle="Supplier invoice disputes — excluded from payment runs until resolved."
      />
      <div className="card mb-4 border-severity-blocking/40 bg-severity-blocking/5 text-xs text-text-secondary">
        Disputed invoices are automatically removed from payments due out, scheduled payment runs, and committed cash out.
      </div>
      <DataTable columns={cols} rows={rows} emptyLabel="No disputes" />
    </div>
  );
}
