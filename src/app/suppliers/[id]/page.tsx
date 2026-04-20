import { getDb } from '@/db';
import {
  suppliers,
  supplierContracts,
  supplierRateCards,
  supplierInvoices,
  supplierExposureSnapshots,
  invoiceDisputes,
  warningEvents,
} from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/chips/StatusChip';
import { SeverityChip } from '@/components/chips/SeverityChip';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function load(id: string) {
  try {
    const db = getDb();
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    if (!supplier) return null;
    const [contracts, rates, invoices, exposure, disputes, warns] = await Promise.all([
      db.select().from(supplierContracts).where(eq(supplierContracts.supplierId, id)),
      db.select().from(supplierRateCards).where(eq(supplierRateCards.supplierId, id)),
      db.select().from(supplierInvoices).where(eq(supplierInvoices.supplierId, id)).orderBy(desc(supplierInvoices.issueDate)),
      db
        .select()
        .from(supplierExposureSnapshots)
        .where(eq(supplierExposureSnapshots.supplierId, id))
        .orderBy(desc(supplierExposureSnapshots.snapshotAt))
        .limit(1),
      db
        .select({ d: invoiceDisputes })
        .from(invoiceDisputes)
        .innerJoin(supplierInvoices, eq(supplierInvoices.id, invoiceDisputes.supplierInvoiceId))
        .where(eq(supplierInvoices.supplierId, id)),
      db
        .select()
        .from(warningEvents)
        .where(and(eq(warningEvents.subjectType, 'supplier'), eq(warningEvents.subjectId, id))),
    ]);
    return {
      supplier,
      contracts,
      rates,
      invoices,
      exposure: exposure[0] ?? null,
      disputes: disputes.map((x) => x.d),
      warnings: warns,
    };
  } catch {
    return null;
  }
}

export default async function SupplierDetail({ params }: { params: { id: string } }) {
  const data = await load(params.id);
  if (!data) notFound();
  const { supplier, contracts, rates, invoices, exposure, disputes, warnings } = data;

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
    { key: 'currency', header: 'Ccy' },
  ];

  const rateCols: Column<any>[] = [
    { key: 'serviceCode', header: 'Service' },
    { key: 'unitType', header: 'Unit' },
    { key: 'unitRate', header: 'Rate', align: 'right', render: (r) => formatCurrency(r.unitRate, r.currency) },
    { key: 'validFrom', header: 'From', render: (r) => formatDate(r.validFrom) },
    { key: 'validTo', header: 'To', render: (r) => formatDate(r.validTo) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={supplier.legalName}
        subtitle={supplier.tradingName ?? supplier.category ?? undefined}
        actions={<StatusChip status={supplier.status} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="label">Credit Limit</div>
          <div className="text-xl font-semibold mt-1">{formatCurrency(supplier.creditLimit)}</div>
        </div>
        <div className="card">
          <div className="label">Approved Unpaid</div>
          <div className="text-xl font-semibold mt-1">{formatCurrency(exposure?.approvedUnpaid ?? 0)}</div>
        </div>
        <div className="card">
          <div className="label">Pending Invoice</div>
          <div className="text-xl font-semibold mt-1">{formatCurrency(exposure?.pendingInvoice ?? 0)}</div>
        </div>
        <div className="card">
          <div className="label">Exposure Status</div>
          <div className="mt-2">
            <StatusChip status={exposure?.status ?? 'within_limit'} />
          </div>
        </div>
      </div>

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
        <h2 className="text-lg font-semibold mb-3">Open Disputes</h2>
        <div className="space-y-2">
          {disputes.length === 0 && <div className="text-sm text-text-muted">No disputes</div>}
          {disputes.map((d) => (
            <div key={d.id} className="card flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{d.reasonCode}</div>
                <div className="text-xs text-text-muted">{d.summary ?? '—'}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-text-secondary">{formatCurrency(d.heldAmount)}</div>
                <StatusChip status={d.status} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Warnings</h2>
        <div className="space-y-2">
          {warnings.length === 0 && <div className="text-sm text-text-muted">No warnings</div>}
          {warnings.map((w) => (
            <div key={w.id} className="card flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{w.title}</div>
                <div className="text-xs text-text-muted">{w.message ?? '—'}</div>
              </div>
              <SeverityChip severity={w.severity} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
