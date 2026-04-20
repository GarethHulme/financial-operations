import { getDb } from '@/db';
import { supplierInvoices, clientInvoices, suppliers, clients } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { StatusChip } from '@/components/chips/StatusChip';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function loadSupplier() {
  try {
    const db = getDb();
    const rows = await db
      .select({ i: supplierInvoices, name: suppliers.legalName })
      .from(supplierInvoices)
      .leftJoin(suppliers, eq(suppliers.id, supplierInvoices.supplierId))
      .orderBy(desc(supplierInvoices.issueDate))
      .limit(200);
    return rows.map((r) => ({ ...r.i, counterpartyName: r.name }));
  } catch {
    return [] as any[];
  }
}

async function loadClient() {
  try {
    const db = getDb();
    const rows = await db
      .select({ i: clientInvoices, name: clients.legalName })
      .from(clientInvoices)
      .leftJoin(clients, eq(clients.id, clientInvoices.clientId))
      .orderBy(desc(clientInvoices.issueDate))
      .limit(200);
    return rows.map((r) => ({ ...r.i, counterpartyName: r.name }));
  } catch {
    return [] as any[];
  }
}

export default async function InvoicesPage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = searchParams.tab === 'client' ? 'client' : 'supplier';
  const [sup, cli] = await Promise.all([loadSupplier(), loadClient()]);
  const rows = tab === 'client' ? cli : sup;

  const cols: Column<any>[] = [
    { key: 'invoiceNumber', header: 'Invoice #', render: (r) => <span className="font-mono text-xs">{r.invoiceNumber}</span> },
    { key: 'counterpartyName', header: tab === 'client' ? 'Client' : 'Supplier' },
    { key: 'issueDate', header: 'Issued', render: (r) => formatDate(r.issueDate) },
    { key: 'dueDate', header: 'Due', render: (r) => formatDate(r.dueDate) },
    { key: 'grandTotal', header: 'Total', align: 'right', render: (r) => formatCurrency(r.grandTotal) },
    { key: 'balanceDue', header: 'Balance', align: 'right', render: (r) => formatCurrency(r.balanceDue) },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Lifecycle of supplier and client invoices with validation, approval, dispute, and payment."
      />
      <div className="flex gap-2 mb-4">
        <Link
          href="/invoices?tab=supplier"
          className={cn('btn-ghost', tab === 'supplier' && 'bg-bg-raised text-text-primary border-border-strong')}
        >
          Supplier ({sup.length})
        </Link>
        <Link
          href="/invoices?tab=client"
          className={cn('btn-ghost', tab === 'client' && 'bg-bg-raised text-text-primary border-border-strong')}
        >
          Client ({cli.length})
        </Link>
      </div>
      <DataTable columns={cols} rows={rows} emptyLabel="No invoices" />
    </div>
  );
}
