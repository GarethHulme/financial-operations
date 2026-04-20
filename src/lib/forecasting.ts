import { getDb } from '@/db';
import { forecastSnapshots, supplierInvoices, clientInvoices } from '@/db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { publishEvent } from './events';

export interface ForecastPeriod {
  key: string;
  start: Date;
  end: Date;
  scenario: 'baseline' | 'optimistic' | 'pessimistic';
}

export async function rebuildForecast(period: ForecastPeriod, actorUserId?: string) {
  const db = getDb();
  const startStr = period.start.toISOString().slice(0, 10);
  const endStr = period.end.toISOString().slice(0, 10);

  const supplierInvs = await db
    .select()
    .from(supplierInvoices)
    .where(and(gte(supplierInvoices.dueDate, startStr), lte(supplierInvoices.dueDate, endStr)));
  const clientInvs = await db
    .select()
    .from(clientInvoices)
    .where(and(gte(clientInvoices.dueDate, startStr), lte(clientInvoices.dueDate, endStr)));

  let committedOut = 0,
    expectedOut = 0,
    projectedOut = 0,
    disputedHold = 0;
  for (const inv of supplierInvs) {
    const bal = Number(inv.balanceDue || inv.grandTotal);
    if (['approved', 'scheduled'].includes(inv.status)) committedOut += bal;
    else if (['pending_validation', 'pending_approval', 'parsed'].includes(inv.status)) expectedOut += bal;
    else if (inv.status === 'disputed') disputedHold += bal;
    projectedOut += bal;
  }

  let committedIn = 0,
    expectedIn = 0,
    projectedIn = 0;
  for (const inv of clientInvs) {
    const bal = Number(inv.balanceDue || inv.grandTotal);
    if (['issued', 'sent', 'due'].includes(inv.status)) committedIn += bal;
    else if (['draft', 'parsed', 'pending_validation', 'ready_to_issue'].includes(inv.status)) expectedIn += bal;
    projectedIn += bal;
  }

  const [row] = await db
    .insert(forecastSnapshots)
    .values({
      periodKey: period.key,
      periodStart: startStr,
      periodEnd: endStr,
      scenario: period.scenario,
      committedCashOut: String(committedOut),
      expectedCashOut: String(expectedOut),
      projectedCashOut: String(projectedOut),
      committedCashIn: String(committedIn),
      expectedCashIn: String(expectedIn),
      projectedCashIn: String(projectedIn),
      disputedHold: String(disputedHold),
      forecastCost: String(projectedOut),
      forecastRevenue: String(projectedIn),
      forecastMargin: String(projectedIn - projectedOut),
      createdBy: actorUserId,
    })
    .returning();

  await publishEvent({
    eventType: 'forecast.rebuilt',
    aggregateType: 'forecast',
    aggregateId: row.id,
    payload: { periodKey: period.key, scenario: period.scenario },
    actorUserId,
  });

  return row;
}
