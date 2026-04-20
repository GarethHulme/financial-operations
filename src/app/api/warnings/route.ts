import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { warningEvents } from '@/db/schema';
import { desc, eq, inArray, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDb();
  const severities = req.nextUrl.searchParams.getAll('severity');
  const resolvedParam = req.nextUrl.searchParams.get('resolved');
  const conditions = [] as any[];
  if (severities.length) conditions.push(inArray(warningEvents.severity, severities as any));
  if (resolvedParam === 'false') conditions.push(eq(warningEvents.resolved, false));
  else if (resolvedParam === 'true') conditions.push(eq(warningEvents.resolved, true));
  const rows = await db
    .select()
    .from(warningEvents)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(warningEvents.createdAt))
    .limit(300);
  return NextResponse.json({ warnings: rows });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const [row] = await db
    .insert(warningEvents)
    .values({
      severity: body.severity,
      category: body.category,
      title: body.title,
      message: body.message ?? null,
      subjectType: body.subjectType ?? null,
      subjectId: body.subjectId ?? null,
      payload: body.payload ?? null,
    })
    .returning();
  return NextResponse.json({ warning: row }, { status: 201 });
}
