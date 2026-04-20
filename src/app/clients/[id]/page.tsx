import { getDb } from '@/db';
import { clients, clientContracts, clientRateCards, clientInvoices, clientPayments } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/chips/StatusChip';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function load(id: string) {
  try {
    const db = getDb();
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    if (!client) return null;
    const [contracts, rates, invoices, payments] = await Promise.all([
      db.select().from(clientContracts).where(eq(clientContracts.clientId, id)),
      db.select().from(clientRateCards).where(eq(clientRateCards.clientId, id)),
      db.select().from(clientInvoices).where(eq(clientInvoices.clientId, id)).orderBy(desc(clientInvoices.issueDate)),
      db.select().from(clientPayments).where(eq(clientPayments.clientId, id)).orderBy(desc(clientPayments.receivedDate)),
    ]);
    return { client, contracts, rates, invoices, payments };
  } catch {
    return null;
  }
}

export default async function ClientDetail({ params }: { params: { id: string } }) {
  const data = await load(params.id);
  if (!data) notFound();
  const { client, contracts, rates, invoices, payments } = data;

  const invCols: Column<any>[] = [
    { key: 'invoiceNumber', header: 'Invoice #' },
    { key: 'issueDate', header: 'Issued', render: (r) => formatDate(r.issueDate) },
    { key: 'dueDate', header: 'Due', render: (r) => formatDate(r.dueDate) },
    { key: 'grandTotal', header: 'Total', align: 'right', render: (r) => formatCurrency(r.grandTotal) },
    { key: 'balanceDue', header: 'Balance', align: 'right', render: (r) => formatCurrency(r.balanceDue) },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
  ];
  const contractCols: Column<any>[] = [
    { key: 'reference', header: 'Ref' },
    { key: 'title', header: 'Title' },
    { key: 'validFrom', header: 'From', render: (r) => formatDate(r.validFrom) },
    { key: 'validTo', header: 'To', render: (r) => formatDate(r.validTo) },
  ];
  const rateCols: Column<any>[] = [
    { key: 'serviceCode', header: 'Service' },
    { key: 'unitType', header: 'Unit' },
    { key: 'unitRate', header: 'Rate', align: 'right', render: (r) => formatCurrency(r.unitRate, r.currency) },
    { key: 'validFrom', header: 'From', render: (r) => formatDate(r.validFrom) },
  ];
  const payCols: Column<any>[] = [
    { key: 'receivedDate', header: 'Received', render: (r) => formatDate(r.receivedDate) },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
    { key: 'method', header: 'Method' },
    { key: 'reference', header: 'Reference' },
    { key: 'unapplied', header: 'Unapplied', align: 'right', render: (r) => formatCurrency(r.unapplied) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={client.legalName} subtitle={client.tradingName ?? undefined} actions={<StatusChip status={client.status} />} />

      <section>
        <h2 className="text-lg font-semibold mb-3">Contracts</h2>
        <DataTable columns={contractCols} rows={contracts} emptyLabel="No contracts" />
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Rate Cards</h2>
        <DataTable columns={rateCols} rows={rates} emptyLabel="No rate cards" />
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Invoices</h2>
        <DataTable columns={invCols} rows={invoices} emptyLabel="No invoices" />
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Payments Received</h2>
        <DataTable columns={payCols} rows={payments} emptyLabel="No payments" />
      </section>
    </div>
  );
}
