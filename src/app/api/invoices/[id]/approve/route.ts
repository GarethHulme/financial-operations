import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { supplierInvoices, supplierContracts, invoiceApprovals } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateExposure } from '@/lib/credit-control';
import { publishEvent } from '@/lib/events';
import { raiseWarning } from '@/lib/warnings';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json().catch(() => ({}));
  const { override = false, actorUserId, notes } = body as { override?: boolean; actorUserId?: string; notes?: string };

  const [invoice] = await db.select().from(supplierInvoices).where(eq(supplierInvoices.id, params.id));
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (invoice.status === 'disputed')
    return NextResponse.json({ error: 'Cannot approve disputed invoice' }, { status: 409 });

  if (!invoice.contractId) {
    return NextResponse.json({ error: 'Invoice not linked to contract' }, { status: 422 });
  }
  const [contract] = await db.select().from(supplierContracts).where(eq(supplierContracts.id, invoice.contractId));
  if (!contract || !contract.active) {
    return NextResponse.json({ error: 'Contract inactive or missing' }, { status: 422 });
  }

  if (invoice.rateBreachOutcome === 'hard_breach' && !override) {
    return NextResponse.json({ error: 'Hard rate breach — override required' }, { status: 409 });
  }

  const exposure = await calculateExposure(invoice.supplierId);
  if (exposure.status === 'breached' && !override) {
    await raiseWarning({
      severity: 'blocking',
      category: 'credit_risk',
      title: 'Approval blocked — credit breach',
      subjectType: 'supplier_invoice',
      subjectId: invoice.id,
    });
    return NextResponse.json({ error: 'Credit limit breached — override required' }, { status: 409 });
  }

  const [row] = await db
    .update(supplierInvoices)
    .set({ status: 'approved', updatedAt: new Date(), updatedBy: actorUserId ?? null })
    .where(eq(supplierInvoices.id, params.id))
    .returning();

  await db.insert(invoiceApprovals).values({
    invoiceId: params.id,
    decision: override ? 'overridden' : 'approved',
    decidedByUserId: actorUserId ?? null,
    decidedAt: new Date(),
    notes: notes ?? null,
    triggerReason: override ? 'override' : 'standard',
  });

  await publishEvent({
    eventType: 'supplier.invoice.approved',
    aggregateType: 'supplier_invoice',
    aggregateId: row.id,
    payload: { supplierId: row.supplierId, amount: row.grandTotal },
    actorUserId,
  });

  return NextResponse.json({ invoice: row });
}
