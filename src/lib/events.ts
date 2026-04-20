import { getDb } from '@/db';
import { eventOutbox } from '@/db/schema';

export type FinanceEventType =
  | 'supplier.created'
  | 'supplier.approved'
  | 'supplier.restricted'
  | 'supplier.credit.warning'
  | 'supplier.credit.breached'
  | 'supplier.invoice.approved'
  | 'supplier.invoice.disputed'
  | 'supplier.invoice.resolved'
  | 'client.invoice.issued'
  | 'client.invoice.overdue'
  | 'client.payment.received'
  | 'forecast.rebuilt'
  | 'warning.created';

export interface PublishEventInput {
  eventType: FinanceEventType;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  actorUserId?: string;
}

export async function publishEvent(input: PublishEventInput) {
  const db = getDb();
  const [row] = await db
    .insert(eventOutbox)
    .values({
      eventType: input.eventType,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payload: input.payload,
      createdBy: input.actorUserId,
    })
    .returning();
  return row;
}
