import { getDb } from '@/db';
import { forecastSnapshots } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function load() {
  try {
    const db = getDb();
    return await db.select().from(forecastSnapshots).orderBy(desc(forecastSnapshots.createdAt)).limit(50);
  } catch {
    return [] as any[];
  }
}

export default async function ForecastingPage() {
  const rows = await load();
  const cols: Column<any>[] = [
    { key: 'periodKey', header: 'Period' },
    { key: 'scenario', header: 'Scenario' },
    { key: 'committedCashOut', header: 'Committed Out', align: 'right', render: (r) => formatCurrency(r.committedCashOut) },
    { key: 'expectedCashOut', header: 'Expected Out', align: 'right', render: (r) => formatCurrency(r.expectedCashOut) },
    { key: 'committedCashIn', header: 'Committed In', align: 'right', render: (r) => formatCurrency(r.committedCashIn) },
    { key: 'expectedCashIn', header: 'Expected In', align: 'right', render: (r) => formatCurrency(r.expectedCashIn) },
    {
      key: 'forecastMargin',
      header: 'Margin',
      align: 'right',
      render: (r) => (
        <span className={Number(r.forecastMargin) >= 0 ? 'text-status-ok' : 'text-severity-critical'}>
          {formatCurrency(r.forecastMargin)}
        </span>
      ),
    },
    {
      key: 'variance',
      header: 'Variance',
      align: 'right',
      render: (r) => (r.variance ? formatCurrency(r.variance) : '—'),
    },
    { key: 'rootCause', header: 'Root cause', render: (r) => r.rootCause ?? '—' },
    { key: 'createdAt', header: 'Snapshot', render: (r) => formatDate(r.createdAt) },
  ];
  return (
    <div>
      <PageHeader
        title="Forecasting"
        subtitle="Forecast snapshots — committed, expected, projected, disputed hold; variance + root cause."
      />
      <div className="card mb-4 text-xs text-text-secondary">
        Forecast periods: next week, next 4 weeks, next month, current quarter, next quarter, rolling 13 weeks.
      </div>
      <DataTable columns={cols} rows={rows} emptyLabel="No snapshots yet — POST /api/forecasting to rebuild." />
    </div>
  );
}
