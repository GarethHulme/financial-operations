import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { suppliers, supplierContracts, supplierValidationTasks } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { publishEvent } from '@/lib/events';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, params.id));
  if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const contracts = await db.select().from(supplierContracts).where(eq(supplierContracts.supplierId, params.id));
  const openTasks = await db
    .select()
    .from(supplierValidationTasks)
    .where(and(eq(supplierValidationTasks.supplierId, params.id), eq(supplierValidationTasks.status, 'pending')));

  const missing: string[] = [];
  if (!supplier.legalName) missing.push('legalName');
  if (!supplier.paymentTermsDays) missing.push('paymentTermsDays');
  if (Number(supplier.creditLimit) <= 0) missing.push('creditLimit');
  if (contracts.length === 0) missing.push('at_least_one_contract');
  if (openTasks.length > 0) missing.push('open_validation_tasks');

  if (missing.length > 0) {
    return NextResponse.json({ error: 'Validation failed', missing }, { status: 422 });
  }

  const [row] = await db
    .update(suppliers)
    .set({ status: 'active', activatedAt: new Date(), updatedAt: new Date() })
    .where(eq(suppliers.id, params.id))
    .returning();

  await publishEvent({
    eventType: 'supplier.approved',
    aggregateType: 'supplier',
    aggregateId: row.id,
    payload: { legalName: row.legalName },
  });

  return NextResponse.json({ supplier: row });
}
