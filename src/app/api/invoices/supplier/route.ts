import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { supplierInvoices, suppliers } from '@/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDb();
  const status = req.nextUrl.searchParams.getAll('status');
  const rows = await db
    .select({
      invoice: supplierInvoices,
      supplierName: suppliers.legalName,
    })
    .from(supplierInvoices)
    .leftJoin(suppliers, eq(suppliers.id, supplierInvoices.supplierId))
    .where(status.length ? inArray(supplierInvoices.status, status as any) : undefined)
    .orderBy(desc(supplierInvoices.issueDate))
    .limit(300);
  return NextResponse.json({
    invoices: rows.map((r) => ({ ...r.invoice, supplierName: r.supplierName })),
  });
}
