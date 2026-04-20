import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { clientInvoices, clients } from '@/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDb();
  const status = req.nextUrl.searchParams.getAll('status');
  const rows = await db
    .select({ invoice: clientInvoices, clientName: clients.legalName })
    .from(clientInvoices)
    .leftJoin(clients, eq(clients.id, clientInvoices.clientId))
    .where(status.length ? inArray(clientInvoices.status, status as any) : undefined)
    .orderBy(desc(clientInvoices.issueDate))
    .limit(300);
  return NextResponse.json({
    invoices: rows.map((r) => ({ ...r.invoice, clientName: r.clientName })),
  });
}
