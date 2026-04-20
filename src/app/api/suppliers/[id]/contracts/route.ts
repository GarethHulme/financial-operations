import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { supplierContracts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db.select().from(supplierContracts).where(eq(supplierContracts.supplierId, params.id));
  return NextResponse.json({ contracts: rows });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const [row] = await db
    .insert(supplierContracts)
    .values({
      supplierId: params.id,
      reference: body.reference,
      title: body.title,
      validFrom: body.validFrom,
      validTo: body.validTo ?? null,
      paymentTermsDays: body.paymentTermsDays ?? null,
      currency: body.currency ?? 'GBP',
      terms: body.terms ?? {},
    })
    .returning();
  return NextResponse.json({ contract: row }, { status: 201 });
}
