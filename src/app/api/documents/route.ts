import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { documentIngestions } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(documentIngestions).orderBy(desc(documentIngestions.createdAt)).limit(100);
  return NextResponse.json({ ingestions: rows });
}
