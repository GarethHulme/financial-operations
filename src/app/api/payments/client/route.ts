import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { clientPayments, clientPaymentAllocations, clientInvoices, clients } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { publishEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = await db
    .select({ payment: clientPayments, clientName: clients.legalName })
    .from(clientPayments)
    .leftJoin(clients, eq(clients.id, clientPayments.clientId))
    .orderBy(desc(clientPayments.receivedDate))
    .limit(200);
  return NextResponse.json({ payments: rows.map((r) => ({ ...r.payment, clientName: r.clientName })) });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const allocations: Array<{ invoiceId: string; amount: number }> = body.allocations ?? [];
  const allocTotal = allocations.reduce((s, a) => s + Number(a.amount), 0);
  if (Math.abs(allocTotal - Number(body.amount)) > 0.01 && allocations.length > 0) {
    return NextResponse.json({ error: 'Allocation total must equal payment amount' }, { status: 422 });
  }

  const [payment] = await db
    .insert(clientPayments)
    .values({
      clientId: body.clientId,
      receivedDate: body.receivedDate,
      amount: String(body.amount),
      currency: body.currency ?? 'GBP',
      method: body.method ?? 'bacs',
      reference: body.reference ?? null,
      unapplied: String(Number(body.amount) - allocTotal),
    })
    .returning();

  for (const a of allocations) {
    await db.insert(clientPaymentAllocations).values({
      paymentId: payment.id,
      invoiceId: a.invoiceId,
      amount: String(a.amount),
    });
    const [inv] = await db.select().from(clientInvoices).where(eq(clientInvoices.id, a.invoiceId));
    if (inv) {
      const newBal = Math.max(0, Number(inv.balanceDue) - Number(a.amount));
      const newStatus = newBal === 0 ? 'paid' : 'partially_paid';
      await db
        .update(clientInvoices)
        .set({ balanceDue: String(newBal), status: newStatus, updatedAt: new Date() })
        .where(eq(clientInvoices.id, a.invoiceId));
    }
  }

  await publishEvent({
    eventType: 'client.payment.received',
    aggregateType: 'client_payment',
    aggregateId: payment.id,
    payload: { amount: payment.amount, clientId: payment.clientId },
  });

  return NextResponse.json({ payment }, { status: 201 });
}
