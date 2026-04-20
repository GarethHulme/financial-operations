import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  suppliers,
  supplierContracts,
  supplierRateCards,
  supplierInvoices,
  invoiceDisputes,
  invoiceDisputeEvents,
  supplierPayments,
  supplierPaymentAllocations,
  supplierExposureSnapshots,
  clients,
  clientContracts,
  clientRateCards,
  clientInvoices,
  clientPayments,
  clientPaymentAllocations,
  allocationRules,
  warningEvents,
  cashFlowBuckets,
  forecastSnapshots,
  documentIngestions,
  eventOutbox,
} from './schema';

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function isoWeekKey(d: Date): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set — skipping seed');
    process.exit(0);
  }
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  console.log('Seeding suppliers…');
  const supplierRows = await db
    .insert(suppliers)
    .values([
      {
        legalName: 'North Fleet Logistics Ltd',
        tradingName: 'North Fleet',
        category: 'haulage',
        status: 'active',
        paymentTermsDays: 30,
        creditLimit: '250000',
        defaultCurrency: 'GBP',
        vatNumber: 'GB123456789',
        contactEmail: 'ap@northfleet.example',
        activatedAt: new Date(),
      },
      {
        legalName: 'Orion Fuels plc',
        tradingName: 'Orion',
        category: 'fuel',
        status: 'active',
        paymentTermsDays: 14,
        creditLimit: '500000',
        activatedAt: new Date(),
      },
      {
        legalName: 'Bridgewater Parts Co',
        category: 'parts',
        status: 'active',
        paymentTermsDays: 45,
        creditLimit: '120000',
        activatedAt: new Date(),
      },
      {
        legalName: 'Apex Service Centre',
        category: 'maintenance',
        status: 'pending_validation',
        paymentTermsDays: 30,
        creditLimit: '75000',
      },
      {
        legalName: 'Meridian Haulage',
        category: 'subcontract',
        status: 'restricted',
        paymentTermsDays: 30,
        creditLimit: '60000',
        activatedAt: new Date(),
        restrictionNotes: 'Outstanding dispute > 90 days',
      },
    ])
    .returning();

  console.log('Seeding supplier contracts…');
  const supplierContractRows = await db
    .insert(supplierContracts)
    .values(
      supplierRows.slice(0, 3).map((s, i) => ({
        supplierId: s.id,
        reference: `SC-${1000 + i}`,
        title: `${s.legalName} — Master Services Agreement`,
        validFrom: daysFromNow(-365),
        validTo: daysFromNow(365),
        paymentTermsDays: s.paymentTermsDays,
        currency: 'GBP',
        terms: { indexation: 'RPI', reviewPeriod: 'annual' },
      })),
    )
    .returning();

  console.log('Seeding supplier rates…');
  await db.insert(supplierRateCards).values([
    {
      supplierId: supplierRows[0].id,
      contractId: supplierContractRows[0].id,
      serviceCode: 'TRUNK_MILE',
      description: 'Per mile trunk haulage',
      unitType: 'mile',
      unitRate: '1.8500',
      validFrom: daysFromNow(-180),
    },
    {
      supplierId: supplierRows[1].id,
      contractId: supplierContractRows[1].id,
      serviceCode: 'DIESEL_L',
      description: 'Diesel per litre',
      unitType: 'litre',
      unitRate: '1.3250',
      validFrom: daysFromNow(-90),
    },
    {
      supplierId: supplierRows[2].id,
      contractId: supplierContractRows[2].id,
      serviceCode: 'BRAKE_KIT',
      description: 'HGV brake kit',
      unitType: 'unit',
      unitRate: '425.0000',
      validFrom: daysFromNow(-200),
    },
  ]);

  console.log('Seeding clients…');
  const clientRows = await db
    .insert(clients)
    .values([
      {
        legalName: 'Hemsworth Retail Group',
        tradingName: 'Hemsworth',
        status: 'active',
        paymentTermsDays: 30,
        creditLimit: '600000',
      },
      {
        legalName: 'Crestline Food Distribution',
        status: 'active',
        paymentTermsDays: 45,
        creditLimit: '400000',
      },
      {
        legalName: 'Atlas Industrial Supplies',
        status: 'active',
        paymentTermsDays: 60,
        creditLimit: '250000',
      },
      { legalName: 'Northgate Pharma', status: 'active', paymentTermsDays: 30, creditLimit: '300000' },
    ])
    .returning();

  console.log('Seeding client contracts & rates…');
  const clientContractRows = await db
    .insert(clientContracts)
    .values(
      clientRows.map((c, i) => ({
        clientId: c.id,
        reference: `CC-${2000 + i}`,
        title: `${c.legalName} — Delivery Services Agreement`,
        validFrom: daysFromNow(-365),
        validTo: daysFromNow(365),
        paymentTermsDays: c.paymentTermsDays,
      })),
    )
    .returning();

  await db.insert(clientRateCards).values(
    clientContractRows.map((cc, i) => ({
      clientId: cc.clientId,
      contractId: cc.id,
      serviceCode: 'DELIVERY_DROP',
      description: 'Per drop delivery',
      unitType: 'drop',
      unitRate: (12 + i).toString() + '.5000',
      validFrom: daysFromNow(-180),
    })),
  );

  console.log('Seeding supplier invoices…');
  const supplierInvoiceRows = await db
    .insert(supplierInvoices)
    .values([
      {
        supplierId: supplierRows[0].id,
        contractId: supplierContractRows[0].id,
        invoiceNumber: 'NF-2026-0118',
        status: 'pending_approval',
        issueDate: daysFromNow(-10),
        dueDate: daysFromNow(20),
        subtotal: '8500.00',
        taxTotal: '1700.00',
        grandTotal: '10200.00',
        balanceDue: '10200.00',
      },
      {
        supplierId: supplierRows[0].id,
        contractId: supplierContractRows[0].id,
        invoiceNumber: 'NF-2026-0125',
        status: 'approved',
        issueDate: daysFromNow(-5),
        dueDate: daysFromNow(3),
        subtotal: '4200.00',
        taxTotal: '840.00',
        grandTotal: '5040.00',
        balanceDue: '5040.00',
      },
      {
        supplierId: supplierRows[1].id,
        contractId: supplierContractRows[1].id,
        invoiceNumber: 'OR-45211',
        status: 'scheduled',
        issueDate: daysFromNow(-8),
        dueDate: daysFromNow(6),
        subtotal: '12500.00',
        taxTotal: '2500.00',
        grandTotal: '15000.00',
        balanceDue: '15000.00',
      },
      {
        supplierId: supplierRows[2].id,
        contractId: supplierContractRows[2].id,
        invoiceNumber: 'BW-99812',
        status: 'disputed',
        issueDate: daysFromNow(-30),
        dueDate: daysFromNow(-5),
        subtotal: '2100.00',
        taxTotal: '420.00',
        grandTotal: '2520.00',
        balanceDue: '2520.00',
        rateBreachOutcome: 'soft_breach',
        rateBreachDetail: { invoicedRate: 430, contractRate: 425 },
      },
      {
        supplierId: supplierRows[1].id,
        contractId: supplierContractRows[1].id,
        invoiceNumber: 'OR-45399',
        status: 'pending_validation',
        issueDate: daysFromNow(-2),
        dueDate: daysFromNow(12),
        subtotal: '9800.00',
        taxTotal: '1960.00',
        grandTotal: '11760.00',
        balanceDue: '11760.00',
      },
    ])
    .returning();

  console.log('Seeding disputes…');
  const disputed = supplierInvoiceRows.find((x) => x.status === 'disputed')!;
  const [dispute] = await db
    .insert(invoiceDisputes)
    .values({
      supplierInvoiceId: disputed.id,
      status: 'investigating',
      reasonCode: 'rate_mismatch',
      summary: 'Unit rate invoiced at 430 vs contracted 425',
      heldAmount: disputed.grandTotal,
    })
    .returning();
  await db.insert(invoiceDisputeEvents).values([
    { disputeId: dispute.id, eventType: 'opened', note: 'Rate mismatch identified on line 3' },
    { disputeId: dispute.id, eventType: 'note', note: 'Raised with supplier account manager' },
  ]);

  console.log('Seeding client invoices…');
  const clientInvoiceRows = await db
    .insert(clientInvoices)
    .values([
      {
        clientId: clientRows[0].id,
        contractId: clientContractRows[0].id,
        invoiceNumber: 'INV-2026-0418',
        status: 'issued',
        issueDate: daysFromNow(-5),
        dueDate: daysFromNow(25),
        subtotal: '18500.00',
        taxTotal: '3700.00',
        grandTotal: '22200.00',
        balanceDue: '22200.00',
      },
      {
        clientId: clientRows[1].id,
        contractId: clientContractRows[1].id,
        invoiceNumber: 'INV-2026-0419',
        status: 'overdue',
        issueDate: daysFromNow(-65),
        dueDate: daysFromNow(-20),
        subtotal: '9400.00',
        taxTotal: '1880.00',
        grandTotal: '11280.00',
        balanceDue: '11280.00',
      },
      {
        clientId: clientRows[2].id,
        contractId: clientContractRows[2].id,
        invoiceNumber: 'INV-2026-0420',
        status: 'partially_paid',
        issueDate: daysFromNow(-40),
        dueDate: daysFromNow(-10),
        subtotal: '6200.00',
        taxTotal: '1240.00',
        grandTotal: '7440.00',
        balanceDue: '3200.00',
      },
      {
        clientId: clientRows[3].id,
        contractId: clientContractRows[3].id,
        invoiceNumber: 'INV-2026-0421',
        status: 'paid',
        issueDate: daysFromNow(-50),
        dueDate: daysFromNow(-20),
        subtotal: '4800.00',
        taxTotal: '960.00',
        grandTotal: '5760.00',
        balanceDue: '0',
      },
      {
        clientId: clientRows[0].id,
        contractId: clientContractRows[0].id,
        invoiceNumber: 'INV-2026-0422',
        status: 'due',
        issueDate: daysFromNow(-20),
        dueDate: daysFromNow(2),
        subtotal: '12200.00',
        taxTotal: '2440.00',
        grandTotal: '14640.00',
        balanceDue: '14640.00',
      },
    ])
    .returning();

  console.log('Seeding payments…');
  const [cp1] = await db
    .insert(clientPayments)
    .values({
      clientId: clientRows[2].id,
      receivedDate: daysFromNow(-5),
      amount: '4240.00',
      method: 'bacs',
      reference: 'REF-221144',
      unapplied: '0',
    })
    .returning();
  await db.insert(clientPaymentAllocations).values({
    paymentId: cp1.id,
    invoiceId: clientInvoiceRows[2].id,
    amount: '4240.00',
  });

  const [sp1] = await db
    .insert(supplierPayments)
    .values({
      supplierId: supplierRows[1].id,
      scheduledDate: daysFromNow(6),
      amount: '15000.00',
      method: 'chaps',
      reference: 'PAY-0001',
      status: 'scheduled',
    })
    .returning();
  await db.insert(supplierPaymentAllocations).values({
    paymentId: sp1.id,
    invoiceId: supplierInvoiceRows[2].id,
    amount: '15000.00',
  });

  console.log('Seeding allocation rules…');
  await db.insert(allocationRules).values([
    {
      name: 'Fuel → Route Group split',
      scopeType: 'supplier',
      scopeId: supplierRows[1].id,
      basis: 'route_group',
      splits: [
        { targetType: 'route_group', targetId: '00000000-0000-0000-0000-000000000001', percent: 60 },
        { targetType: 'route_group', targetId: '00000000-0000-0000-0000-000000000002', percent: 40 },
      ],
      validFrom: daysFromNow(-180),
    },
  ]);

  console.log('Seeding exposure snapshots…');
  await db.insert(supplierExposureSnapshots).values(
    supplierRows.slice(0, 3).map((s, i) => ({
      supplierId: s.id,
      creditLimit: s.creditLimit,
      approvedUnpaid: String(50000 + i * 25000),
      pendingInvoice: String(10000 + i * 5000),
      disputed: i === 2 ? '2520' : '0',
      forecastCommitted: '0',
      projectedExposure: String(60000 + i * 30000),
      status: i === 2 ? 'warning' : 'within_limit',
    })),
  );

  console.log('Seeding warnings…');
  await db.insert(warningEvents).values([
    {
      severity: 'critical',
      category: 'overdue_receivable',
      title: 'Invoice INV-2026-0419 > 20 days overdue',
      subjectType: 'client_invoice',
      subjectId: clientInvoiceRows[1].id,
    },
    {
      severity: 'warning',
      category: 'contract_rate_breach',
      title: 'Soft rate breach on BW-99812',
      subjectType: 'supplier_invoice',
      subjectId: disputed.id,
      message: 'Invoiced rate 430 vs contract 425',
    },
    {
      severity: 'advisory',
      category: 'payment_clustering',
      title: 'Cluster of supplier payments due on 2026-04-26',
    },
    {
      severity: 'blocking',
      category: 'credit_risk',
      title: 'Meridian Haulage — supplier restricted',
      subjectType: 'supplier',
      subjectId: supplierRows[4].id,
    },
    {
      severity: 'info',
      category: 'duplicate_invoice',
      title: 'Possible duplicate supplier invoice',
      message: 'Two invoices with same reference in last 7 days',
    },
  ]);

  console.log('Seeding cash flow buckets…');
  const now = new Date();
  const weekRows = [] as any[];
  for (let i = 0; i < 13; i++) {
    const ws = new Date(now);
    ws.setDate(ws.getDate() + i * 7);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    const out = 10000 + ((i * 1300) % 8000);
    const inn = 12000 + ((i * 1700) % 9000);
    weekRows.push({
      weekKey: isoWeekKey(ws),
      weekStart: ws.toISOString().slice(0, 10),
      weekEnd: we.toISOString().slice(0, 10),
      dueOut: String(out),
      dueIn: String(inn),
      disputedHold: i === 0 ? '2520' : '0',
      projectedSupplierSpend: String(out + 2000),
      projectedClientCollections: String(inn + 1500),
      netCash: String(inn - out),
    });
  }
  await db.insert(cashFlowBuckets).values(weekRows);

  console.log('Seeding forecast snapshot…');
  const fStart = new Date();
  const fEnd = new Date();
  fEnd.setDate(fEnd.getDate() + 28);
  await db.insert(forecastSnapshots).values({
    periodKey: isoWeekKey(fStart) + '_4W',
    periodStart: fStart.toISOString().slice(0, 10),
    periodEnd: fEnd.toISOString().slice(0, 10),
    scenario: 'baseline',
    committedCashOut: '44000',
    expectedCashOut: '12000',
    projectedCashOut: '56000',
    committedCashIn: '48000',
    expectedCashIn: '18000',
    projectedCashIn: '66000',
    disputedHold: '2520',
    forecastCost: '56000',
    forecastRevenue: '66000',
    forecastMargin: '10000',
    variance: '-1800',
    rootCause: 'overdue_receivables',
  });

  console.log('Seeding documents…');
  await db.insert(documentIngestions).values([
    {
      kind: 'supplier_invoice',
      status: 'awaiting_confirmation',
      originalFileName: 'NF-2026-0130.pdf',
      ocrConfidence: '0.9420',
      extractedFields: {
        invoiceNumber: 'NF-2026-0130',
        supplier: 'North Fleet Logistics Ltd',
        issueDate: daysFromNow(-1),
        dueDate: daysFromNow(29),
        subtotal: 5600,
        taxTotal: 1120,
        grandTotal: 6720,
      },
      fieldConfidence: { invoiceNumber: 0.99, supplier: 0.95, grandTotal: 0.92 },
      suggestedMatches: [
        { type: 'supplier', label: 'North Fleet Logistics Ltd', score: 0.97 },
        { type: 'contract', label: 'SC-1000', score: 0.93 },
      ],
      duplicateRiskFlags: [],
      contractMismatchFlags: [],
      creditWarningFlags: [],
    },
    {
      kind: 'supplier_invoice',
      status: 'extracted',
      originalFileName: 'OR-45402.pdf',
      ocrConfidence: '0.8810',
      extractedFields: { invoiceNumber: 'OR-45402', supplier: 'Orion', grandTotal: 18200 },
      fieldConfidence: { grandTotal: 0.85 },
      suggestedMatches: [{ type: 'supplier', label: 'Orion Fuels plc', score: 0.88 }],
      duplicateRiskFlags: ['Possible match with OR-45399'],
      contractMismatchFlags: [],
      creditWarningFlags: [],
    },
  ]);

  console.log('Seeding event outbox…');
  await db.insert(eventOutbox).values([
    {
      eventType: 'supplier.invoice.disputed',
      aggregateType: 'supplier_invoice',
      aggregateId: disputed.id,
      payload: { disputeId: dispute.id, reasonCode: 'rate_mismatch' },
    },
    {
      eventType: 'client.invoice.overdue',
      aggregateType: 'client_invoice',
      aggregateId: clientInvoiceRows[1].id,
      payload: { invoiceNumber: clientInvoiceRows[1].invoiceNumber },
    },
    {
      eventType: 'forecast.rebuilt',
      aggregateType: 'forecast',
      aggregateId: disputed.id,
      payload: { periodKey: 'baseline_4W' },
    },
  ]);

  console.log('Seed complete.');
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
