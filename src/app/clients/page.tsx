import { getDb } from '@/db';
import { clients } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { StatusChip } from '@/components/chips/StatusChip';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function load() {
  try {
    const db = getDb();
    return await db.select().from(clients).orderBy(desc(clients.createdAt)).limit(200);
  } catch {
    return [] as any[];
  }
}

export default async function ClientsPage() {
  const rows = await load();
  const cols: Column<any>[] = [
    {
      key: 'legalName',
      header: 'Client',
      render: (r) => (
        <Link href={`/clients/${r.id}`} className="text-text-primary hover:text-accent">
          <div className="font-medium">{r.legalName}</div>
          <div className="text-xs text-text-muted">{r.tradingName ?? '—'}</div>
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
  ];
  return (
    <div>
      <PageHeader title="Clients" subtitle="Client profiles, contracts, rate cards, invoices, payments." />
      <DataTable columns={cols} rows={rows} emptyLabel="No clients yet" />
    </div>
  );
}
