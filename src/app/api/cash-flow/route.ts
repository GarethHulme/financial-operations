import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { cashFlowBuckets } from '@/db/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(cashFlowBuckets).orderBy(asc(cashFlowBuckets.weekStart));
  return NextResponse.json({ buckets: rows });
}
