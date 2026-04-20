import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { clientRateCards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db.select().from(clientRateCards).where(eq(clientRateCards.clientId, params.id));
  return NextResponse.json({ rates: rows });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const [row] = await db
    .insert(clientRateCards)
    .values({
      clientId: params.id,
      contractId: body.contractId ?? null,
      serviceCode: body.serviceCode,
      description: body.description ?? null,
      unitType: body.unitType ?? 'unit',
      unitRate: String(body.unitRate),
      currency: body.currency ?? 'GBP',
      validFrom: body.validFrom,
      validTo: body.validTo ?? null,
    })
    .returning();
  return NextResponse.json({ rate: row }, { status: 201 });
}
