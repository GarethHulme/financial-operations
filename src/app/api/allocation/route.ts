import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { allocationRules } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(allocationRules).orderBy(desc(allocationRules.createdAt));
  return NextResponse.json({ rules: rows });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const [row] = await db
    .insert(allocationRules)
    .values({
      name: body.name,
      description: body.description ?? null,
      scopeType: body.scopeType,
      scopeId: body.scopeId ?? null,
      basis: body.basis,
      splits: body.splits,
      validFrom: body.validFrom,
      validTo: body.validTo ?? null,
    })
    .returning();
  return NextResponse.json({ rule: row }, { status: 201 });
}
