import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { supplierInvoices } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db
    .select()
    .from(supplierInvoices)
    .where(eq(supplierInvoices.supplierId, params.id))
    .orderBy(desc(supplierInvoices.issueDate));
  return NextResponse.json({ invoices: rows });
}
