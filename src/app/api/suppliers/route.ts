import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { suppliers } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { z } from 'zod';
import { publishEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  legalName: z.string().min(1),
  tradingName: z.string().optional(),
  category: z.string().optional(),
  paymentTermsDays: z.number().int().min(0).default(30),
  creditLimit: z.union([z.string(), z.number()]).default('0'),
  defaultCurrency: z.string().default('GBP'),
  vatNumber: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt)).limit(200);
  return NextResponse.json({ suppliers: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }
  const db = getDb();
  const [row] = await db
    .insert(suppliers)
    .values({
      ...parsed.data,
      creditLimit: String(parsed.data.creditLimit),
      status: 'pending_validation',
    })
    .returning();
  await publishEvent({
    eventType: 'supplier.created',
    aggregateType: 'supplier',
    aggregateId: row.id,
    payload: { legalName: row.legalName },
  });
  return NextResponse.json({ supplier: row }, { status: 201 });
}
