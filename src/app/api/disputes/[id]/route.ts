import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { invoiceDisputes, invoiceDisputeEvents, invoiceDisputeResolutions } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const [dispute] = await db.select().from(invoiceDisputes).where(eq(invoiceDisputes.id, params.id));
  if (!dispute) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const [events, resolutions] = await Promise.all([
    db.select().from(invoiceDisputeEvents).where(eq(invoiceDisputeEvents.disputeId, params.id)).orderBy(asc(invoiceDisputeEvents.createdAt)),
    db.select().from(invoiceDisputeResolutions).where(eq(invoiceDisputeResolutions.disputeId, params.id)),
  ]);
  return NextResponse.json({ dispute, events, resolutions });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Append an event/note to the dispute.
  const db = getDb();
  const body = await req.json();
  const [row] = await db
    .insert(invoiceDisputeEvents)
    .values({
      disputeId: params.id,
      eventType: body.eventType ?? 'note',
      actorUserId: body.actorUserId ?? null,
      payload: body.payload ?? null,
      note: body.note ?? null,
    })
    .returning();
  return NextResponse.json({ event: row }, { status: 201 });
}
