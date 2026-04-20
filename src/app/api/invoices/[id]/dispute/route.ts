import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { supplierInvoices, invoiceDisputes, invoiceDisputeEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { publishEvent } from '@/lib/events';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const [invoice] = await db.select().from(supplierInvoices).where(eq(supplierInvoices.id, params.id));
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [dispute] = await db
    .insert(invoiceDisputes)
    .values({
      supplierInvoiceId: invoice.id,
      reasonCode: body.reasonCode,
      summary: body.summary ?? null,
      heldAmount: String(body.heldAmount ?? invoice.balanceDue ?? invoice.grandTotal),
      raisedByUserId: body.actorUserId ?? null,
    })
    .returning();

  await db.insert(invoiceDisputeEvents).values({
    disputeId: dispute.id,
    eventType: 'opened',
    actorUserId: body.actorUserId ?? null,
    payload: { reasonCode: body.reasonCode },
    note: body.summary ?? null,
  });

  const [updated] = await db
    .update(supplierInvoices)
    .set({ status: 'disputed', updatedAt: new Date() })
    .where(eq(supplierInvoices.id, invoice.id))
    .returning();

  await publishEvent({
    eventType: 'supplier.invoice.disputed',
    aggregateType: 'supplier_invoice',
    aggregateId: invoice.id,
    payload: { disputeId: dispute.id, reasonCode: body.reasonCode },
  });

  return NextResponse.json({ dispute, invoice: updated }, { status: 201 });
}
