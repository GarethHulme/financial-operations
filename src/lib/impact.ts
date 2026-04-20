import { getDb } from '@/db';
import { impactConfirmationLogs } from '@/db/schema';

export interface ImpactConfirmationInput {
  changeType:
    | 'contract_rate_change'
    | 'payment_terms_change'
    | 'credit_limit_change'
    | 'allocation_change'
    | 'override_approval'
    | 'dispute_resolution'
    | 'supplier_restriction_change';
  subjectType: string;
  subjectId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  cashFlowEffect?: number;
  forecastEffect?: number;
  profitabilityEffect?: number;
  affectedInvoiceIds?: string[];
  affectedModules?: string[];
  requiredApprovals?: string[];
  actorUserId?: string;
}

export async function recordImpact(input: ImpactConfirmationInput) {
  const db = getDb();
  const [row] = await db
    .insert(impactConfirmationLogs)
    .values({
      changeType: input.changeType,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      before: input.before,
      after: input.after,
      cashFlowEffect: input.cashFlowEffect != null ? String(input.cashFlowEffect) : null,
      forecastEffect: input.forecastEffect != null ? String(input.forecastEffect) : null,
      profitabilityEffect: input.profitabilityEffect != null ? String(input.profitabilityEffect) : null,
      affectedInvoiceIds: input.affectedInvoiceIds,
      affectedModules: input.affectedModules,
      requiredApprovals: input.requiredApprovals,
      createdBy: input.actorUserId,
    })
    .returning();
  return row;
}

export async function acknowledgeImpact(id: string, userId: string) {
  const db = getDb();
  const { eq } = await import('drizzle-orm');
  const [row] = await db
    .update(impactConfirmationLogs)
    .set({
      acknowledgedByUserId: userId,
      acknowledgedAt: new Date(),
      applied: true,
      appliedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(impactConfirmationLogs.id, id))
    .returning();
  return row;
}
