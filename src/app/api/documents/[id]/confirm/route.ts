import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { documentIngestions, supplierInvoices, clientInvoices } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const [ing] = await db.select().from(documentIngestions).where(eq(documentIngestions.id, params.id));
  if (!ing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const fields = (ing.extractedFields as Record<string, any>) || {};

  let createdEntityType: string | null = null;
  let createdEntityId: string | null = null;

  if (ing.kind === 'supplier_invoice' && body.supplierId) {
    const [inv] = await db
      .insert(supplierInvoices)
      .values({
        supplierId: body.supplierId,
        contractId: body.contractId ?? null,
        invoiceNumber: fields.invoiceNumber ?? body.invoiceNumber ?? 'UNKNOWN',
        status: 'pending_validation',
        issueDate: fields.issueDate ?? body.issueDate,
        dueDate: fields.dueDate ?? body.dueDate,
        subtotal: String(fields.subtotal ?? body.subtotal ?? 0),
        taxTotal: String(fields.taxTotal ?? body.taxTotal ?? 0),
        grandTotal: String(fields.grandTotal ?? body.grandTotal ?? 0),
        balanceDue: String(fields.grandTotal ?? body.grandTotal ?? 0),
        ingestionId: ing.id,
        siteId: body.siteId ?? null,
        routeId: body.routeId ?? null,
        routeGroupId: body.routeGroupId ?? null,
        vehicleId: body.vehicleId ?? null,
      })
      .returning();
    createdEntityType = 'supplier_invoice';
    createdEntityId = inv.id;
  } else if (ing.kind === 'client_invoice' && body.clientId) {
    const [inv] = await db
      .insert(clientInvoices)
      .values({
        clientId: body.clientId,
        contractId: body.contractId ?? null,
        invoiceNumber: fields.invoiceNumber ?? body.invoiceNumber ?? 'UNKNOWN',
        status: 'pending_validation',
        issueDate: fields.issueDate ?? body.issueDate,
        dueDate: fields.dueDate ?? body.dueDate,
        subtotal: String(fields.subtotal ?? body.subtotal ?? 0),
        taxTotal: String(fields.taxTotal ?? body.taxTotal ?? 0),
        grandTotal: String(fields.grandTotal ?? body.grandTotal ?? 0),
        balanceDue: String(fields.grandTotal ?? body.grandTotal ?? 0),
        ingestionId: ing.id,
      })
      .returning();
    createdEntityType = 'client_invoice';
    createdEntityId = inv.id;
  }

  const [updated] = await db
    .update(documentIngestions)
    .set({
      status: 'confirmed',
      confirmedByUserId: body.actorUserId ?? null,
      confirmedAt: new Date(),
      createdEntityType,
      createdEntityId,
      updatedAt: new Date(),
    })
    .where(eq(documentIngestions.id, params.id))
    .returning();

  return NextResponse.json({ ingestion: updated, createdEntityType, createdEntityId });
}
