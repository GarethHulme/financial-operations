import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { clientInvoices } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db
    .select()
    .from(clientInvoices)
    .where(eq(clientInvoices.clientId, params.id))
    .orderBy(desc(clientInvoices.issueDate));
  return NextResponse.json({ invoices: rows });
}
