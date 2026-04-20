import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { clients, clientContracts, clientRateCards, clientInvoices, clientPayments } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, params.id));
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [contracts, rates, invoices, payments] = await Promise.all([
    db.select().from(clientContracts).where(eq(clientContracts.clientId, params.id)),
    db.select().from(clientRateCards).where(eq(clientRateCards.clientId, params.id)),
    db.select().from(clientInvoices).where(eq(clientInvoices.clientId, params.id)).orderBy(desc(clientInvoices.issueDate)),
    db.select().from(clientPayments).where(eq(clientPayments.clientId, params.id)).orderBy(desc(clientPayments.receivedDate)),
  ]);

  return NextResponse.json({ client, contracts, rates, invoices, payments });
}
