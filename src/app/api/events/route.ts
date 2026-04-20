import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { eventOutbox } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(eventOutbox).orderBy(desc(eventOutbox.occurredAt)).limit(200);
  return NextResponse.json({ events: rows });
}
