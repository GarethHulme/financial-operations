import { getDb } from '@/db';
import {
  supplierInvoices,
  clientInvoices,
  invoiceDisputes,
  warningEvents,
  forecastSnapshots,
  supplierExposureSnapshots,
} from '@/db/schema';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { MetricCard } from '@/components/cards/MetricCard';
import { PageHeader } from '@/components/PageHeader';
import { formatCurrency, startOfWeek } from '@/lib/utils';
import {
  AlertTriangle,
  Banknote,
  Clock,
  FileCheck2,
  FileWarning,
  Gauge,
  PiggyBank,
  ShieldAlert,
  TrendingDown,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function loadSummary() {
  try {
    const db = getDb();
    const weekStart = startOfWeek();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const ws = weekStart.toISOString().slice(0, 10);
    const we = weekEnd.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    const [pa] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(supplierInvoices)
      .where(inArray(supplierInvoices.status, ['pending_approval', 'pending_validation']));

    const [dOut] = await db
      .select({ v: sql<string>`coalesce(sum(${supplierInvoices.balanceDue}),0)::text` })
      .from(supplierInvoices)
      .where(
        and(
          inArray(supplierInvoices.status, ['approved', 'scheduled']),
          gte(supplierInvoices.dueDate, ws),
          lte(supplierInvoices.dueDate, we),
        ),
      );

    const [dIn] = await db
      .select({ v: sql<string>`coalesce(sum(${clientInvoices.balanceDue}),0)::text` })
      .from(clientInvoices)
      .where(
        and(
          inArray(clientInvoices.status, ['issued', 'sent', 'due']),
          gte(clientInvoices.dueDate, ws),
          lte(clientInvoices.dueDate, we),
        ),
      );

    const [dh] = await db
      .select({ v: sql<string>`coalesce(sum(${invoiceDisputes.heldAmount}),0)::text` })
      .from(invoiceDisputes)
      .where(inArray(invoiceDisputes.status, ['open', 'investigating', 'awaiting_supplier', 'proposed_settlement']));

    const [or] = await db
      .select({ v: sql<string>`coalesce(sum(${clientInvoices.balanceDue}),0)::text` })
      .from(clientInvoices)
      .where(and(inArray(clientInvoices.status, ['overdue', 'partially_paid', 'due']), lte(clientInvoices.dueDate, today)));

    const [cb] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(supplierExposureSnapshots)
      .where(inArray(supplierExposureSnapshots.status, ['breached', 'at_risk', 'restricted']));

    const [cw] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(warningEvents)
      .where(and(eq(warningEvents.resolved, false), inArray(warningEvents.severity, ['critical', 'blocking'])));

    const [fc] = await db.select().from(forecastSnapshots).orderBy(desc(forecastSnapshots.createdAt)).limit(1);

    const projectedNetCash = fc
      ? Number(fc.projectedCashIn) - Number(fc.projectedCashOut)
      : Number(dIn?.v || 0) - Number(dOut?.v || 0);

    return {
      pendingApprovals: pa?.c ?? 0,
      dueOutThisWeek: Number(dOut?.v || 0),
      dueInThisWeek: Number(dIn?.v || 0),
      disputedHeldValue: Number(dh?.v || 0),
      overdueReceivables: Number(or?.v || 0),
      creditBreaches: cb?.c ?? 0,
      criticalWarnings: cw?.c ?? 0,
      forecastVariance: fc?.variance ? Number(fc.variance) : 0,
      projectedNetCash,
      weekRange: { start: ws, end: we },
    };
  } catch (err) {
    console.error('summary load failed', err);
    return {
      pendingApprovals: 0,
      dueOutThisWeek: 0,
      dueInThisWeek: 0,
      disputedHeldValue: 0,
      overdueReceivables: 0,
      creditBreaches: 0,
      criticalWarnings: 0,
      forecastVariance: 0,
      projectedNetCash: 0,
      weekRange: null,
      error: true,
    };
  }
}

export default async function LandingPage() {
  const s = await loadSummary();

  return (
    <div>
      <PageHeader
        title="Financial Operations"
        subtitle="Control supplier finance, client billing, invoice approvals, disputes, forecasting, and weekly cash flow."
      />

      {'error' in s && s.error && (
        <div className="card mb-4 border-severity-advisory/40 bg-severity-advisory/10 text-severity-advisory text-sm">
          Database not connected — set DATABASE_URL and run migrations. Metrics show zero values.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <MetricCard
          label="Pending Approvals"
          value={String(s.pendingApprovals)}
          hint="Supplier invoices awaiting validation or approval"
          href="/invoices?tab=supplier&status=pending_approval"
          tone={s.pendingApprovals > 10 ? 'warning' : 'default'}
          icon={<FileCheck2 className="w-4 h-4" />}
        />
        <MetricCard
          label="Due Out This Week"
          value={formatCurrency(s.dueOutThisWeek)}
          hint={s.weekRange ? `${s.weekRange.start} → ${s.weekRange.end}` : undefined}
          href="/cash-flow"
          icon={<Banknote className="w-4 h-4" />}
        />
        <MetricCard
          label="Due In This Week"
          value={formatCurrency(s.dueInThisWeek)}
          hint={s.weekRange ? `${s.weekRange.start} → ${s.weekRange.end}` : undefined}
          href="/cash-flow"
          tone="positive"
          icon={<PiggyBank className="w-4 h-4" />}
        />
        <MetricCard
          label="Disputed Held Value"
          value={formatCurrency(s.disputedHeldValue)}
          hint="Total value of open supplier disputes — excluded from payment runs"
          href="/disputes"
          tone={s.disputedHeldValue > 0 ? 'blocking' : 'default'}
          icon={<FileWarning className="w-4 h-4" />}
        />
        <MetricCard
          label="Overdue Receivables"
          value={formatCurrency(s.overdueReceivables)}
          hint="Client invoices past due date"
          href="/invoices?tab=client&status=overdue"
          tone={s.overdueReceivables > 0 ? 'critical' : 'default'}
          icon={<Clock className="w-4 h-4" />}
        />
        <MetricCard
          label="Credit Breaches"
          value={String(s.creditBreaches)}
          hint="Suppliers at risk, breached, or restricted"
          href="/suppliers?filter=credit_breach"
          tone={s.creditBreaches > 0 ? 'critical' : 'default'}
          icon={<ShieldAlert className="w-4 h-4" />}
        />
        <MetricCard
          label="Critical Warnings"
          value={String(s.criticalWarnings)}
          hint="Unresolved critical + blocking warnings"
          href="/warnings?severity=critical&severity=blocking"
          tone={s.criticalWarnings > 0 ? 'blocking' : 'default'}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <MetricCard
          label="Forecast Variance"
          value={formatCurrency(s.forecastVariance)}
          hint="Latest forecast vs actual delta"
          href="/forecasting"
          tone={s.forecastVariance < 0 ? 'warning' : 'default'}
          icon={<TrendingDown className="w-4 h-4" />}
        />
        <MetricCard
          label="Projected Net Cash"
          value={formatCurrency(s.projectedNetCash)}
          hint="Projected cash in minus projected cash out"
          href="/forecasting"
          tone={s.projectedNetCash >= 0 ? 'positive' : 'negative'}
          icon={<Gauge className="w-4 h-4" />}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="label mb-3">Control Rules</div>
          <ul className="text-sm text-text-secondary space-y-1.5">
            <li>• No supplier activation without validation</li>
            <li>• No invoice creation without preview confirmation</li>
            <li>• No supplier invoice approval without contract + credit checks</li>
            <li>• No disputed invoice in payments due out</li>
            <li>• No supplier cost into P&L without allocation</li>
            <li>• No client payment counted without allocation</li>
            <li>• No material change without impact confirmation</li>
            <li>• No silent overwrite of original invoice or dispute history</li>
          </ul>
        </div>
        <div className="card">
          <div className="label mb-3">Quick Links</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <a href="/documents" className="btn-ghost justify-center">Upload Document</a>
            <a href="/invoices?tab=supplier" className="btn-ghost justify-center">Supplier Invoices</a>
            <a href="/invoices?tab=client" className="btn-ghost justify-center">Client Invoices</a>
            <a href="/payments" className="btn-ghost justify-center">Payment Runs</a>
            <a href="/cash-flow" className="btn-ghost justify-center">Cash Flow</a>
            <a href="/forecasting" className="btn-ghost justify-center">Forecast</a>
          </div>
        </div>
      </div>
    </div>
  );
}
