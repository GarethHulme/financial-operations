import { getDb } from '@/db';
import { cashFlowBuckets, supplierInvoices, clientInvoices, invoiceDisputes } from '@/db/schema';
import { asc, sql, inArray, and, gte, lte } from 'drizzle-orm';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, startOfWeek, weekKey } from '@/lib/utils';
import { WeekTable } from './WeekTable';

export const dynamic = 'force-dynamic';

async function loadStored() {
  try {
    const db = getDb();
    return await db.select().from(cashFlowBuckets).orderBy(asc(cashFlowBuckets.weekStart));
  } catch {
    return [] as any[];
  }
}

async function computeLive(): Promise<any[]> {
  try {
    const db = getDb();
    const out: any[] = [];
    const start = startOfWeek();
    for (let i = 0; i < 13; i++) {
      const ws = new Date(start);
      ws.setDate(ws.getDate() + i * 7);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const wsStr = ws.toISOString().slice(0, 10);
      const weStr = we.toISOString().slice(0, 10);
      const [dueOut] = await db
        .select({ v: sql<string>`coalesce(sum(${supplierInvoices.balanceDue}),0)::text` })
        .from(supplierInvoices)
        .where(
          and(
            inArray(supplierInvoices.status, ['approved', 'scheduled']),
            gte(supplierInvoices.dueDate, wsStr),
            lte(supplierInvoices.dueDate, weStr),
          ),
        );
      const [dueIn] = await db
        .select({ v: sql<string>`coalesce(sum(${clientInvoices.balanceDue}),0)::text` })
        .from(clientInvoices)
        .where(
          and(
            inArray(clientInvoices.status, ['issued', 'sent', 'due', 'partially_paid']),
            gte(clientInvoices.dueDate, wsStr),
            lte(clientInvoices.dueDate, weStr),
          ),
        );
      const [disp] = await db
        .select({ v: sql<string>`coalesce(sum(${invoiceDisputes.heldAmount}),0)::text` })
        .from(invoiceDisputes)
        .where(inArray(invoiceDisputes.status, ['open', 'investigating', 'awaiting_supplier', 'proposed_settlement']));
      const d = Number(dueIn?.v || 0) - Number(dueOut?.v || 0);
      out.push({
        weekKey: weekKey(ws),
        weekStart: wsStr,
        weekEnd: weStr,
        dueOut: Number(dueOut?.v || 0),
        dueIn: Number(dueIn?.v || 0),
        disputedHold: i === 0 ? Number(disp?.v || 0) : 0,
        netCash: d,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export default async function CashFlowPage() {
  const stored = await loadStored();
  const live = stored.length === 0 ? await computeLive() : stored;

  const totalOut = live.reduce((s, r) => s + Number(r.dueOut), 0);
  const totalIn = live.reduce((s, r) => s + Number(r.dueIn), 0);
  const totalDisp = live.reduce((s, r) => s + Number(r.disputedHold), 0);
  const totalNet = totalIn - totalOut;

  return (
    <div>
      <PageHeader title="Cash Flow" subtitle="Rolling 13-week cash flow with due out, due in, disputed hold, and net. Click a week to expand." />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="label">13-Week Due Out</div>
          <div className="text-xl font-semibold mt-1">{formatCurrency(totalOut)}</div>
        </div>
        <div className="card">
          <div className="label">13-Week Due In</div>
          <div className="text-xl font-semibold mt-1 text-status-ok">{formatCurrency(totalIn)}</div>
        </div>
        <div className="card">
          <div className="label">Disputed Hold</div>
          <div className="text-xl font-semibold mt-1 text-severity-blocking">{formatCurrency(totalDisp)}</div>
        </div>
        <div className="card">
          <div className="label">Net</div>
          <div className={`text-xl font-semibold mt-1 ${totalNet >= 0 ? 'text-status-ok' : 'text-severity-critical'}`}>
            {formatCurrency(totalNet)}
          </div>
        </div>
      </div>
      <WeekTable rows={live as any} />
    </div>
  );
}
