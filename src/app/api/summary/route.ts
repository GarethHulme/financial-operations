import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import {
  supplierInvoices,
  clientInvoices,
  invoiceDisputes,
  warningEvents,
  forecastSnapshots,
  supplierExposureSnapshots,
} from '@/db/schema';
import { and, eq, gte, lte, inArray, sql } from 'drizzle-orm';
import { startOfWeek } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();

  const weekStart = startOfWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const ws = weekStart.toISOString().slice(0, 10);
  const we = weekEnd.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [pendingApprovals] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(supplierInvoices)
    .where(inArray(supplierInvoices.status, ['pending_approval', 'pending_validation']));

  const [dueOut] = await db
    .select({ v: sql<string>`coalesce(sum(${supplierInvoices.balanceDue}),0)::text` })
    .from(supplierInvoices)
    .where(
      and(
        inArray(supplierInvoices.status, ['approved', 'scheduled']),
        gte(supplierInvoices.dueDate, ws),
        lte(supplierInvoices.dueDate, we),
      ),
    );

  const [dueIn] = await db
    .select({ v: sql<string>`coalesce(sum(${clientInvoices.balanceDue}),0)::text` })
    .from(clientInvoices)
    .where(
      and(
        inArray(clientInvoices.status, ['issued', 'sent', 'due']),
        gte(clientInvoices.dueDate, ws),
        lte(clientInvoices.dueDate, we),
      ),
    );

  const [disputedHeld] = await db
    .select({ v: sql<string>`coalesce(sum(${invoiceDisputes.heldAmount}),0)::text` })
    .from(invoiceDisputes)
    .where(inArray(invoiceDisputes.status, ['open', 'investigating', 'awaiting_supplier', 'proposed_settlement']));

  const [overdueReceivables] = await db
    .select({ v: sql<string>`coalesce(sum(${clientInvoices.balanceDue}),0)::text` })
    .from(clientInvoices)
    .where(and(inArray(clientInvoices.status, ['overdue', 'partially_paid', 'due']), lte(clientInvoices.dueDate, today)));

  const [creditBreaches] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(supplierExposureSnapshots)
    .where(inArray(supplierExposureSnapshots.status, ['breached', 'at_risk', 'restricted']));

  const [criticalWarnings] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(warningEvents)
    .where(and(eq(warningEvents.resolved, false), inArray(warningEvents.severity, ['critical', 'blocking'])));

  const [forecast] = await db
    .select()
    .from(forecastSnapshots)
    .orderBy(sql`${forecastSnapshots.createdAt} desc`)
    .limit(1);

  const projectedNetCash =
    forecast
      ? Number(forecast.projectedCashIn) - Number(forecast.projectedCashOut)
      : Number(dueIn?.v || 0) - Number(dueOut?.v || 0);

  const variance = forecast?.variance ? Number(forecast.variance) : 0;

  return NextResponse.json({
    pendingApprovals: pendingApprovals?.c ?? 0,
    dueOutThisWeek: Number(dueOut?.v || 0),
    dueInThisWeek: Number(dueIn?.v || 0),
    disputedHeldValue: Number(disputedHeld?.v || 0),
    overdueReceivables: Number(overdueReceivables?.v || 0),
    creditBreaches: creditBreaches?.c ?? 0,
    criticalWarnings: criticalWarnings?.c ?? 0,
    forecastVariance: variance,
    projectedNetCash,
    weekRange: { start: ws, end: we },
  });
}
