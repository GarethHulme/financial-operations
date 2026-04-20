import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { suppliers, supplierContracts, supplierRateCards, supplierInvoices, supplierExposureSnapshots } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, params.id));
  if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [contracts, rates, invoices, exposure] = await Promise.all([
    db.select().from(supplierContracts).where(eq(supplierContracts.supplierId, params.id)),
    db.select().from(supplierRateCards).where(eq(supplierRateCards.supplierId, params.id)),
    db.select().from(supplierInvoices).where(eq(supplierInvoices.supplierId, params.id)).orderBy(desc(supplierInvoices.issueDate)),
    db
      .select()
      .from(supplierExposureSnapshots)
      .where(eq(supplierExposureSnapshots.supplierId, params.id))
      .orderBy(desc(supplierExposureSnapshots.snapshotAt))
      .limit(1),
  ]);

  return NextResponse.json({
    supplier,
    contracts,
    rates,
    invoices,
    exposure: exposure[0] ?? null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const [row] = await db.update(suppliers).set({ ...body, updatedAt: new Date() }).where(eq(suppliers.id, params.id)).returning();
  return NextResponse.json({ supplier: row });
}
