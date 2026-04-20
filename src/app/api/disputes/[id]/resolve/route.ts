import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { invoiceDisputes, invoiceDisputeResolutions, invoiceDisputeEvents, supplierInvoices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { publishEvent } from '@/lib/events';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const { resolutionType, agreedAmount, replacementInvoiceId, notes, actorUserId } = body;

  const [dispute] = await db.select().from(invoiceDisputes).where(eq(invoiceDisputes.id, params.id));
  if (!dispute) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [resolution] = await db
    .insert(invoiceDisputeResolutions)
    .values({
      disputeId: params.id,
      resolutionType,
      agreedAmount: agreedAmount != null ? String(agreedAmount) : null,
      replacementInvoiceId: replacementInvoiceId ?? null,
      notes: notes ?? null,
      resolvedByUserId: actorUserId ?? null,
    })
    .returning();

  await db
    .update(invoiceDisputes)
    .set({ status: 'resolved', closedAt: new Date(), updatedAt: new Date() })
    .where(eq(invoiceDisputes.id, params.id));

  await db.insert(invoiceDisputeEvents).values({
    disputeId: params.id,
    eventType: 'resolved',
    actorUserId: actorUserId ?? null,
    payload: { resolutionType, agreedAmount },
    note: notes ?? null,
  });

  if (dispute.supplierInvoiceId) {
    const newStatus =
      resolutionType === 'full_withdrawal'
        ? 'voided'
        : resolutionType === 'replacement_invoice'
          ? 'voided'
          : 'approved';
    await db
      .update(supplierInvoices)
      .set({
        status: newStatus,
        voidedAt: newStatus === 'voided' ? new Date() : null,
        supersededByInvoiceId: replacementInvoiceId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(supplierInvoices.id, dispute.supplierInvoiceId));
  }

  await publishEvent({
    eventType: 'supplier.invoice.resolved',
    aggregateType: 'dispute',
    aggregateId: params.id,
    payload: { resolutionType },
    actorUserId,
  });

  return NextResponse.json({ resolution });
}
