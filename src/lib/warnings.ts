import { getDb } from '@/db';
import { warningEvents } from '@/db/schema';

export type WarningSeverity = 'info' | 'advisory' | 'warning' | 'critical' | 'blocking';
export type WarningCategory =
  | 'credit_risk'
  | 'contract_rate_breach'
  | 'duplicate_invoice'
  | 'missing_allocation'
  | 'overdue_approval'
  | 'disputed_aging'
  | 'overdue_receivable'
  | 'payment_clustering'
  | 'forecast_deterioration'
  | 'operational_dependency';

export interface RaiseWarningInput {
  severity: WarningSeverity;
  category: WarningCategory;
  title: string;
  message?: string;
  subjectType?: string;
  subjectId?: string;
  payload?: Record<string, unknown>;
  actorUserId?: string;
}

export async function raiseWarning(input: RaiseWarningInput) {
  const db = getDb();
  const [row] = await db
    .insert(warningEvents)
    .values({
      severity: input.severity,
      category: input.category,
      title: input.title,
      message: input.message,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      payload: input.payload,
      createdBy: input.actorUserId,
    })
    .returning();
  return row;
}

export const severityRank: Record<WarningSeverity, number> = {
  info: 1,
  advisory: 2,
  warning: 3,
  critical: 4,
  blocking: 5,
};

export const severityStyles: Record<WarningSeverity, { bg: string; text: string; border: string }> = {
  info: { bg: 'bg-severity-info/15', text: 'text-severity-info', border: 'border-severity-info/40' },
  advisory: { bg: 'bg-severity-advisory/15', text: 'text-severity-advisory', border: 'border-severity-advisory/40' },
  warning: { bg: 'bg-severity-warning/15', text: 'text-severity-warning', border: 'border-severity-warning/40' },
  critical: { bg: 'bg-severity-critical/15', text: 'text-severity-critical', border: 'border-severity-critical/40' },
  blocking: { bg: 'bg-severity-blocking/15', text: 'text-severity-blocking', border: 'border-severity-blocking/40' },
};
