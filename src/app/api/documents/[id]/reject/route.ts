import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { documentIngestions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json().catch(() => ({}));
  const [updated] = await db
    .update(documentIngestions)
    .set({
      status: 'rejected',
      confirmedByUserId: body.actorUserId ?? null,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(documentIngestions.id, params.id))
    .returning();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ingestion: updated });
}
