import { getDb } from '@/db';
import { suppliers } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { StatusChip } from '@/components/chips/StatusChip';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function load() {
  try {
    const db = getDb();
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt)).limit(200);
  } catch {
    return [] as any[];
  }
}

export default async function SuppliersPage() {
  const rows = await load();
  const cols: Column<any>[] = [
    {
      key: 'legalName',
      header: 'Supplier',
      render: (r) => (
        <Link href={`/suppliers/${r.id}`} className="text-text-primary hover:text-accent">
          <div className="font-medium">{r.legalName}</div>
          <div className="text-xs text-text-muted">{r.tradingName ?? r.category ?? '—'}</div>
        </Link>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
    { key: 'paymentTermsDays', header: 'Terms', render: (r) => `${r.paymentTermsDays} days` },
    {
      key: 'creditLimit',
      header: 'Credit Limit',
      align: 'right',
      render: (r) => formatCurrency(r.creditLimit, r.defaultCurrency),
    },
    { key: 'activatedAt', header: 'Activated', render: (r) => formatDate(r.activatedAt) },
  ];
  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Supplier profiles, contracts, rate cards, exposure, invoices."
        actions={
          <Link href="/documents" className="btn-primary">
            Upload Invoice
          </Link>
        }
      />
      <DataTable columns={cols} rows={rows} emptyLabel="No suppliers yet" />
    </div>
  );
}
