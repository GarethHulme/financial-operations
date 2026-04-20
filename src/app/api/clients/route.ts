import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { clients } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(clients).orderBy(desc(clients.createdAt)).limit(200);
  return NextResponse.json({ clients: rows });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const [row] = await db
    .insert(clients)
    .values({
      legalName: body.legalName,
      tradingName: body.tradingName ?? null,
      paymentTermsDays: body.paymentTermsDays ?? 30,
      creditLimit: String(body.creditLimit ?? 0),
      defaultCurrency: body.defaultCurrency ?? 'GBP',
      vatNumber: body.vatNumber ?? null,
      contactEmail: body.contactEmail ?? null,
      contactPhone: body.contactPhone ?? null,
      status: 'active',
    })
    .returning();
  return NextResponse.json({ client: row }, { status: 201 });
}
