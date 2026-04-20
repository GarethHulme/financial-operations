import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { invoiceDisputes, supplierInvoices, suppliers } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = await db
    .select({
      dispute: invoiceDisputes,
      invoiceNumber: supplierInvoices.invoiceNumber,
      supplierName: suppliers.legalName,
    })
    .from(invoiceDisputes)
    .leftJoin(supplierInvoices, eq(supplierInvoices.id, invoiceDisputes.supplierInvoiceId))
    .leftJoin(suppliers, eq(suppliers.id, supplierInvoices.supplierId))
    .orderBy(desc(invoiceDisputes.openedAt))
    .limit(200);
  return NextResponse.json({
    disputes: rows.map((r) => ({ ...r.dispute, invoiceNumber: r.invoiceNumber, supplierName: r.supplierName })),
  });
}
