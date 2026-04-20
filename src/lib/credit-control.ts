import { getDb } from '@/db';
import { suppliers, supplierInvoices, supplierExposureSnapshots } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { raiseWarning } from './warnings';

type CreditStatus = 'within_limit' | 'warning' | 'at_risk' | 'breached' | 'restricted';

export interface ExposureCalc {
  creditLimit: number;
  approvedUnpaid: number;
  pendingInvoice: number;
  disputed: number;
  forecastCommitted: number;
  projectedExposure: number;
  status: CreditStatus;
  utilisation: number;
}

export async function calculateExposure(supplierId: string): Promise<ExposureCalc> {
  const db = getDb();
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId));
  if (!supplier) throw new Error('Supplier not found');

  const invoices = await db
    .select()
    .from(supplierInvoices)
    .where(eq(supplierInvoices.supplierId, supplierId));

  let approvedUnpaid = 0;
  let pendingInvoice = 0;
  let disputed = 0;
  for (const inv of invoices) {
    const bal = Number(inv.balanceDue || inv.grandTotal);
    if (inv.status === 'approved' || inv.status === 'scheduled') approvedUnpaid += bal;
    else if (['parsed', 'pending_validation', 'pending_approval'].includes(inv.status)) pendingInvoice += bal;
    else if (inv.status === 'disputed') disputed += bal;
  }

  const forecastCommitted = 0; // hook for forecast module
  const creditLimit = Number(supplier.creditLimit);
  const projectedExposure = approvedUnpaid + pendingInvoice + forecastCommitted;
  const utilisation = creditLimit > 0 ? projectedExposure / creditLimit : 0;

  let status: CreditStatus = 'within_limit';
  if (supplier.status === 'restricted') status = 'restricted';
  else if (utilisation > 1) status = 'breached';
  else if (utilisation > 0.9) status = 'at_risk';
  else if (utilisation > 0.75) status = 'warning';

  return {
    creditLimit,
    approvedUnpaid,
    pendingInvoice,
    disputed,
    forecastCommitted,
    projectedExposure,
    status,
    utilisation,
  };
}

export async function snapshotExposure(supplierId: string, actorUserId?: string) {
  const db = getDb();
  const calc = await calculateExposure(supplierId);
  const [row] = await db
    .insert(supplierExposureSnapshots)
    .values({
      supplierId,
      creditLimit: String(calc.creditLimit),
      approvedUnpaid: String(calc.approvedUnpaid),
      pendingInvoice: String(calc.pendingInvoice),
      disputed: String(calc.disputed),
      forecastCommitted: String(calc.forecastCommitted),
      projectedExposure: String(calc.projectedExposure),
      status: calc.status,
      createdBy: actorUserId,
    })
    .returning();

  if (calc.status === 'warning' || calc.status === 'at_risk') {
    await raiseWarning({
      severity: calc.status === 'at_risk' ? 'critical' : 'warning',
      category: 'credit_risk',
      title: `Supplier credit ${calc.status.replace('_', ' ')}`,
      message: `Utilisation ${(calc.utilisation * 100).toFixed(1)}%`,
      subjectType: 'supplier',
      subjectId: supplierId,
      payload: { ...calc },
    });
  } else if (calc.status === 'breached') {
    await raiseWarning({
      severity: 'blocking',
      category: 'credit_risk',
      title: 'Supplier credit limit breached',
      message: `Projected exposure ${calc.projectedExposure} exceeds limit ${calc.creditLimit}`,
      subjectType: 'supplier',
      subjectId: supplierId,
      payload: { ...calc },
    });
  }
  return row;
}
