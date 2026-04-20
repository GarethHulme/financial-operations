import { getDb } from '@/db';
import { supplierPayments, clientPayments, suppliers, clients } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { StatusChip } from '@/components/chips/StatusChip';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function loadSupplierPayments() {
  try {
    const db = getDb();
    const rows = await db
      .select({ p: supplierPayments, name: suppliers.legalName })
      .from(supplierPayments)
      .leftJoin(suppliers, eq(suppliers.id, supplierPayments.supplierId))
      .orderBy(desc(supplierPayments.scheduledDate))
      .limit(200);
    return rows.map((r) => ({ ...r.p, counterpartyName: r.name }));
  } catch {
    return [] as any[];
  }
}

async function loadClientPayments() {
  try {
    const db = getDb();
    const rows = await db
      .select({ p: clientPayments, name: clients.legalName })
      .from(clientPayments)
      .leftJoin(clients, eq(clients.id, clientPayments.clientId))
      .orderBy(desc(clientPayments.receivedDate))
      .limit(200);
    return rows.map((r) => ({ ...r.p, counterpartyName: r.name }));
  } catch {
    return [] as any[];
  }
}

export default async function PaymentsPage() {
  const [out, inn] = await Promise.all([loadSupplierPayments(), loadClientPayments()]);
  const outCols: Column<any>[] = [
    { key: 'counterpartyName', header: 'Supplier' },
    { key: 'scheduledDate', header: 'Scheduled', render: (r) => formatDate(r.scheduledDate) },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
    { key: 'method', header: 'Method' },
    { key: 'reference', header: 'Reference' },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
  ];
  const inCols: Column<any>[] = [
    { key: 'counterpartyName', header: 'Client' },
    { key: 'receivedDate', header: 'Received', render: (r) => formatDate(r.receivedDate) },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
    { key: 'method', header: 'Method' },
    { key: 'reference', header: 'Reference' },
    { key: 'unapplied', header: 'Unapplied', align: 'right', render: (r) => formatCurrency(r.unapplied) },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Payments out to suppliers and payments in from clients." />
      <section>
        <h2 className="text-lg font-semibold mb-3">Supplier Payment Runs (Due Out)</h2>
        <DataTable columns={outCols} rows={out} emptyLabel="No scheduled payments" />
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Client Payments Received (Cash In)</h2>
        <DataTable columns={inCols} rows={inn} emptyLabel="No payments received" />
      </section>
    </div>
  );
}
