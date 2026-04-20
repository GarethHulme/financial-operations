import { getDb } from '@/db';
import { allocationRules } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export interface AllocationSplit {
  targetType: 'site' | 'client_contract' | 'route_group' | 'vehicle';
  targetId: string;
  percent: number;
}

export interface AllocationResult {
  applied: boolean;
  splits: AllocationSplit[];
  ruleId?: string;
  reason?: string;
}

export async function resolveAllocation(
  scopeType: 'supplier' | 'client' | 'service' | 'global',
  scopeId: string | null,
): Promise<AllocationResult> {
  const db = getDb();
  const rules = await db
    .select()
    .from(allocationRules)
    .where(and(eq(allocationRules.active, true), eq(allocationRules.scopeType, scopeType)));

  const candidate = scopeId
    ? rules.find((r) => r.scopeId === scopeId) ?? rules.find((r) => !r.scopeId)
    : rules[0];

  if (!candidate) {
    return { applied: false, splits: [], reason: 'no_matching_rule' };
  }

  const splits = (candidate.splits as AllocationSplit[]) || [];
  const totalPct = splits.reduce((sum, s) => sum + Number(s.percent || 0), 0);
  if (Math.abs(totalPct - 100) > 0.01) {
    return { applied: false, splits, ruleId: candidate.id, reason: 'splits_sum_not_100' };
  }

  return { applied: true, splits, ruleId: candidate.id };
}
