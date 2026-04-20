import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { supplierPayments, supplierPaymentAllocations, suppliers } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = await db
    .select({ payment: supplierPayments, supplierName: suppliers.legalName })
    .from(supplierPayments)
    .leftJoin(suppliers, eq(suppliers.id, supplierPayments.supplierId))
    .orderBy(desc(supplierPayments.scheduledDate))
    .limit(200);
  return NextResponse.json({ payments: rows.map((r) => ({ ...r.payment, supplierName: r.supplierName })) });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const [payment] = await db
    .insert(supplierPayments)
    .values({
      supplierId: body.supplierId,
      scheduledDate: body.scheduledDate,
      amount: String(body.amount),
      currency: body.currency ?? 'GBP',
      method: body.method ?? 'bacs',
      reference: body.reference ?? null,
      status: body.status ?? 'scheduled',
    })
    .returning();

  if (Array.isArray(body.allocations)) {
    for (const a of body.allocations) {
      await db.insert(supplierPaymentAllocations).values({
        paymentId: payment.id,
        invoiceId: a.invoiceId,
        amount: String(a.amount),
      });
    }
  }

  return NextResponse.json({ payment }, { status: 201 });
}
