import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  date,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------- ENUMS ----------

export const supplierStatusEnum = pgEnum('supplier_status', [
  'draft',
  'pending_validation',
  'active',
  'restricted',
  'suspended',
  'archived',
]);

export const clientStatusEnum = pgEnum('client_status', [
  'draft',
  'active',
  'on_hold',
  'archived',
]);

export const supplierInvoiceStatusEnum = pgEnum('supplier_invoice_status', [
  'draft',
  'parsed',
  'pending_validation',
  'pending_approval',
  'approved',
  'scheduled',
  'paid',
  'disputed',
  'voided',
  'rejected',
]);

export const clientInvoiceStatusEnum = pgEnum('client_invoice_status', [
  'draft',
  'parsed',
  'pending_validation',
  'ready_to_issue',
  'issued',
  'sent',
  'due',
  'overdue',
  'partially_paid',
  'paid',
  'disputed',
  'credited',
  'written_off',
  'voided',
]);

export const disputeStatusEnum = pgEnum('dispute_status', [
  'open',
  'investigating',
  'awaiting_supplier',
  'awaiting_client',
  'proposed_settlement',
  'resolved',
  'rejected',
  'withdrawn',
]);

export const disputeResolutionTypeEnum = pgEnum('dispute_resolution_type', [
  'full_withdrawal',
  'partial_credit',
  'replacement_invoice',
  'original_upheld',
]);

export const warningSeverityEnum = pgEnum('warning_severity', [
  'info',
  'advisory',
  'warning',
  'critical',
  'blocking',
]);

export const warningCategoryEnum = pgEnum('warning_category', [
  'credit_risk',
  'contract_rate_breach',
  'duplicate_invoice',
  'missing_allocation',
  'overdue_approval',
  'disputed_aging',
  'overdue_receivable',
  'payment_clustering',
  'forecast_deterioration',
  'operational_dependency',
]);

export const creditStatusEnum = pgEnum('credit_status', [
  'within_limit',
  'warning',
  'at_risk',
  'breached',
  'restricted',
]);

export const documentKindEnum = pgEnum('document_kind', [
  'supplier_invoice',
  'client_invoice',
  'supplier_contract',
  'client_contract',
  'credit_note',
  'receipt',
  'supporting',
]);

export const ingestionStatusEnum = pgEnum('ingestion_status', [
  'uploaded',
  'extracting',
  'extracted',
  'matched',
  'awaiting_confirmation',
  'confirmed',
  'rejected',
  'failed',
]);

export const approvalDecisionEnum = pgEnum('approval_decision', [
  'pending',
  'approved',
  'rejected',
  'escalated',
  'overridden',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'bacs',
  'chaps',
  'faster_payments',
  'card',
  'cash',
  'cheque',
  'direct_debit',
  'other',
]);

export const rateBreachOutcomeEnum = pgEnum('rate_breach_outcome', [
  'pass',
  'soft_breach',
  'hard_breach',
  'contextual_breach',
]);

// ---------- COMMON AUDIT COLUMNS ----------

const audit = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
};

// ---------- SUPPLIERS ----------

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    legalName: varchar('legal_name', { length: 255 }).notNull(),
    tradingName: varchar('trading_name', { length: 255 }),
    category: varchar('category', { length: 64 }),
    status: supplierStatusEnum('status').notNull().default('draft'),
    registrationNumber: varchar('registration_number', { length: 64 }),
    vatNumber: varchar('vat_number', { length: 64 }),
    paymentTermsDays: integer('payment_terms_days').notNull().default(30),
    creditLimit: numeric('credit_limit', { precision: 14, scale: 2 }).notNull().default('0'),
    restrictionNotes: text('restriction_notes'),
    defaultCurrency: varchar('default_currency', { length: 8 }).notNull().default('GBP'),
    bankDetails: jsonb('bank_details'),
    address: jsonb('address'),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 64 }),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    ...audit,
  },
  (t) => ({
    statusIdx: index('suppliers_status_idx').on(t.status),
    nameIdx: index('suppliers_name_idx').on(t.legalName),
  }),
);

export const supplierContracts = pgTable(
  'supplier_contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
    reference: varchar('reference', { length: 128 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    validFrom: date('valid_from').notNull(),
    validTo: date('valid_to'),
    terms: jsonb('terms'),
    paymentTermsDays: integer('payment_terms_days'),
    currency: varchar('currency', { length: 8 }).notNull().default('GBP'),
    active: boolean('active').notNull().default(true),
    documentId: uuid('document_id'),
    ...audit,
  },
  (t) => ({
    supplierIdx: index('supplier_contracts_supplier_idx').on(t.supplierId),
    validIdx: index('supplier_contracts_valid_idx').on(t.validFrom, t.validTo),
  }),
);

export const supplierRateCards = pgTable(
  'supplier_rate_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
    contractId: uuid('contract_id').references(() => supplierContracts.id),
    serviceCode: varchar('service_code', { length: 64 }).notNull(),
    description: text('description'),
    unitType: varchar('unit_type', { length: 32 }).notNull().default('unit'),
    unitRate: numeric('unit_rate', { precision: 14, scale: 4 }).notNull(),
    currency: varchar('currency', { length: 8 }).notNull().default('GBP'),
    validFrom: date('valid_from').notNull(),
    validTo: date('valid_to'),
    active: boolean('active').notNull().default(true),
    ...audit,
  },
  (t) => ({
    supplierIdx: index('supplier_rates_supplier_idx').on(t.supplierId),
    serviceIdx: index('supplier_rates_service_idx').on(t.serviceCode),
  }),
);

export const supplierDocuments = pgTable(
  'supplier_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
    kind: documentKindEnum('kind').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    fileName: varchar('file_name', { length: 255 }),
    fileUrl: text('file_url'),
    mimeType: varchar('mime_type', { length: 128 }),
    sizeBytes: integer('size_bytes'),
    ingestionId: uuid('ingestion_id'),
    ...audit,
  },
  (t) => ({
    supplierIdx: index('supplier_documents_supplier_idx').on(t.supplierId),
  }),
);

export const supplierValidationTasks = pgTable(
  'supplier_validation_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
    stage: varchar('stage', { length: 64 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    assigneeRoleId: uuid('assignee_role_id'),
    assigneeUserId: uuid('assignee_user_id'),
    notes: text('notes'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ...audit,
  },
  (t) => ({
    supplierIdx: index('supplier_validation_supplier_idx').on(t.supplierId),
  }),
);

export const supplierExposureSnapshots = pgTable(
  'supplier_exposure_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
    snapshotAt: timestamp('snapshot_at', { withTimezone: true }).notNull().defaultNow(),
    creditLimit: numeric('credit_limit', { precision: 14, scale: 2 }).notNull(),
    approvedUnpaid: numeric('approved_unpaid', { precision: 14, scale: 2 }).notNull(),
    pendingInvoice: numeric('pending_invoice', { precision: 14, scale: 2 }).notNull(),
    disputed: numeric('disputed', { precision: 14, scale: 2 }).notNull(),
    forecastCommitted: numeric('forecast_committed', { precision: 14, scale: 2 }).notNull(),
    projectedExposure: numeric('projected_exposure', { precision: 14, scale: 2 }).notNull(),
    status: creditStatusEnum('status').notNull().default('within_limit'),
    ...audit,
  },
  (t) => ({
    supplierIdx: index('supplier_exposure_supplier_idx').on(t.supplierId),
    snapshotIdx: index('supplier_exposure_snapshot_idx').on(t.snapshotAt),
  }),
);

// ---------- SUPPLIER INVOICES ----------

export const supplierInvoices = pgTable(
  'supplier_invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierId: uuid('supplier_id').notNull().references(() => suppliers.id),
    contractId: uuid('contract_id').references(() => supplierContracts.id),
    invoiceNumber: varchar('invoice_number', { length: 128 }).notNull(),
    status: supplierInvoiceStatusEnum('status').notNull().default('draft'),
    issueDate: date('issue_date').notNull(),
    dueDate: date('due_date').notNull(),
    currency: varchar('currency', { length: 8 }).notNull().default('GBP'),
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull().default('0'),
    taxTotal: numeric('tax_total', { precision: 14, scale: 2 }).notNull().default('0'),
    grandTotal: numeric('grand_total', { precision: 14, scale: 2 }).notNull().default('0'),
    balanceDue: numeric('balance_due', { precision: 14, scale: 2 }).notNull().default('0'),
    documentId: uuid('document_id'),
    ingestionId: uuid('ingestion_id'),
    supersededByInvoiceId: uuid('superseded_by_invoice_id'),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    rateBreachOutcome: rateBreachOutcomeEnum('rate_breach_outcome'),
    rateBreachDetail: jsonb('rate_breach_detail'),
    siteId: uuid('site_id'),
    routeId: uuid('route_id'),
    routeGroupId: uuid('route_group_id'),
    vehicleId: uuid('vehicle_id'),
    ...audit,
  },
  (t) => ({
    supplierIdx: index('supplier_invoices_supplier_idx').on(t.supplierId),
    statusIdx: index('supplier_invoices_status_idx').on(t.status),
    dueIdx: index('supplier_invoices_due_idx').on(t.dueDate),
  }),
);

export const supplierInvoiceLineItems = pgTable(
  'supplier_invoice_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id').notNull().references(() => supplierInvoices.id, { onDelete: 'cascade' }),
    rateCardId: uuid('rate_card_id').references(() => supplierRateCards.id),
    serviceCode: varchar('service_code', { length: 64 }),
    description: text('description'),
    quantity: numeric('quantity', { precision: 14, scale: 4 }).notNull().default('1'),
    unitRate: numeric('unit_rate', { precision: 14, scale: 4 }).notNull().default('0'),
    lineTotal: numeric('line_total', { precision: 14, scale: 2 }).notNull().default('0'),
    taxRate: numeric('tax_rate', { precision: 6, scale: 4 }).notNull().default('0'),
    siteId: uuid('site_id'),
    routeId: uuid('route_id'),
    routeGroupId: uuid('route_group_id'),
    vehicleId: uuid('vehicle_id'),
    ...audit,
  },
  (t) => ({
    invoiceIdx: index('supplier_invoice_lines_invoice_idx').on(t.invoiceId),
  }),
);

export const invoiceApprovals = pgTable(
  'invoice_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id').notNull().references(() => supplierInvoices.id, { onDelete: 'cascade' }),
    stepNumber: integer('step_number').notNull().default(1),
    requiredRoleId: uuid('required_role_id'),
    decidedByUserId: uuid('decided_by_user_id'),
    decision: approvalDecisionEnum('decision').notNull().default('pending'),
    notes: text('notes'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    triggerReason: varchar('trigger_reason', { length: 128 }),
    ...audit,
  },
  (t) => ({
    invoiceIdx: index('invoice_approvals_invoice_idx').on(t.invoiceId),
  }),
);

// ---------- DISPUTES (supplier + client) ----------

export const invoiceDisputes = pgTable(
  'invoice_disputes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierInvoiceId: uuid('supplier_invoice_id').references(() => supplierInvoices.id),
    status: disputeStatusEnum('status').notNull().default('open'),
    reasonCode: varchar('reason_code', { length: 64 }).notNull(),
    summary: text('summary'),
    heldAmount: numeric('held_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    raisedByUserId: uuid('raised_by_user_id'),
    ...audit,
  },
  (t) => ({
    invoiceIdx: index('invoice_disputes_invoice_idx').on(t.supplierInvoiceId),
    statusIdx: index('invoice_disputes_status_idx').on(t.status),
  }),
);

export const invoiceDisputeEvents = pgTable(
  'invoice_dispute_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    disputeId: uuid('dispute_id').notNull().references(() => invoiceDisputes.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    actorUserId: uuid('actor_user_id'),
    payload: jsonb('payload'),
    note: text('note'),
    ...audit,
  },
  (t) => ({
    disputeIdx: index('invoice_dispute_events_dispute_idx').on(t.disputeId),
  }),
);

export const invoiceDisputeResolutions = pgTable(
  'invoice_dispute_resolutions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    disputeId: uuid('dispute_id').notNull().references(() => invoiceDisputes.id, { onDelete: 'cascade' }),
    resolutionType: disputeResolutionTypeEnum('resolution_type').notNull(),
    agreedAmount: numeric('agreed_amount', { precision: 14, scale: 2 }),
    replacementInvoiceId: uuid('replacement_invoice_id'),
    notes: text('notes'),
    resolvedByUserId: uuid('resolved_by_user_id'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }).notNull().defaultNow(),
    ...audit,
  },
  (t) => ({
    disputeIdx: index('invoice_dispute_resolutions_dispute_idx').on(t.disputeId),
  }),
);

// ---------- SUPPLIER PAYMENTS ----------

export const supplierPayments = pgTable(
  'supplier_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierId: uuid('supplier_id').notNull().references(() => suppliers.id),
    scheduledDate: date('scheduled_date').notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 8 }).notNull().default('GBP'),
    method: paymentMethodEnum('method').notNull().default('bacs'),
    reference: varchar('reference', { length: 128 }),
    status: varchar('status', { length: 32 }).notNull().default('scheduled'),
    ...audit,
  },
  (t) => ({
    supplierIdx: index('supplier_payments_supplier_idx').on(t.supplierId),
    scheduledIdx: index('supplier_payments_scheduled_idx').on(t.scheduledDate),
  }),
);

export const supplierPaymentAllocations = pgTable(
  'supplier_payment_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id').notNull().references(() => supplierPayments.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').notNull().references(() => supplierInvoices.id),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    ...audit,
  },
  (t) => ({
    paymentIdx: index('supplier_pay_alloc_payment_idx').on(t.paymentId),
    invoiceIdx: index('supplier_pay_alloc_invoice_idx').on(t.invoiceId),
  }),
);

// ---------- CLIENTS ----------

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    legalName: varchar('legal_name', { length: 255 }).notNull(),
    tradingName: varchar('trading_name', { length: 255 }),
    status: clientStatusEnum('status').notNull().default('draft'),
    paymentTermsDays: integer('payment_terms_days').notNull().default(30),
    creditLimit: numeric('credit_limit', { precision: 14, scale: 2 }).notNull().default('0'),
    defaultCurrency: varchar('default_currency', { length: 8 }).notNull().default('GBP'),
    vatNumber: varchar('vat_number', { length: 64 }),
    address: jsonb('address'),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 64 }),
    ...audit,
  },
  (t) => ({
    statusIdx: index('clients_status_idx').on(t.status),
    nameIdx: index('clients_name_idx').on(t.legalName),
  }),
);

export const clientContracts = pgTable(
  'client_contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    reference: varchar('reference', { length: 128 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    validFrom: date('valid_from').notNull(),
    validTo: date('valid_to'),
    terms: jsonb('terms'),
    paymentTermsDays: integer('payment_terms_days'),
    currency: varchar('currency', { length: 8 }).notNull().default('GBP'),
    active: boolean('active').notNull().default(true),
    ...audit,
  },
  (t) => ({
    clientIdx: index('client_contracts_client_idx').on(t.clientId),
  }),
);

export const clientRateCards = pgTable(
  'client_rate_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    contractId: uuid('contract_id').references(() => clientContracts.id),
    serviceCode: varchar('service_code', { length: 64 }).notNull(),
    description: text('description'),
    unitType: varchar('unit_type', { length: 32 }).notNull().default('unit'),
    unitRate: numeric('unit_rate', { precision: 14, scale: 4 }).notNull(),
    currency: varchar('currency', { length: 8 }).notNull().default('GBP'),
    validFrom: date('valid_from').notNull(),
    validTo: date('valid_to'),
    active: boolean('active').notNull().default(true),
    ...audit,
  },
  (t) => ({
    clientIdx: index('client_rates_client_idx').on(t.clientId),
  }),
);

export const clientInvoices = pgTable(
  'client_invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull().references(() => clients.id),
    contractId: uuid('contract_id').references(() => clientContracts.id),
    invoiceNumber: varchar('invoice_number', { length: 128 }).notNull(),
    status: clientInvoiceStatusEnum('status').notNull().default('draft'),
    issueDate: date('issue_date').notNull(),
    dueDate: date('due_date').notNull(),
    currency: varchar('currency', { length: 8 }).notNull().default('GBP'),
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull().default('0'),
    taxTotal: numeric('tax_total', { precision: 14, scale: 2 }).notNull().default('0'),
    grandTotal: numeric('grand_total', { precision: 14, scale: 2 }).notNull().default('0'),
    balanceDue: numeric('balance_due', { precision: 14, scale: 2 }).notNull().default('0'),
    documentId: uuid('document_id'),
    ingestionId: uuid('ingestion_id'),
    supersededByInvoiceId: uuid('superseded_by_invoice_id'),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    siteId: uuid('site_id'),
    routeId: uuid('route_id'),
    routeGroupId: uuid('route_group_id'),
    vehicleId: uuid('vehicle_id'),
    ...audit,
  },
  (t) => ({
    clientIdx: index('client_invoices_client_idx').on(t.clientId),
    statusIdx: index('client_invoices_status_idx').on(t.status),
    dueIdx: index('client_invoices_due_idx').on(t.dueDate),
  }),
);

export const clientInvoiceLineItems = pgTable(
  'client_invoice_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id').notNull().references(() => clientInvoices.id, { onDelete: 'cascade' }),
    rateCardId: uuid('rate_card_id').references(() => clientRateCards.id),
    serviceCode: varchar('service_code', { length: 64 }),
    description: text('description'),
    quantity: numeric('quantity', { precision: 14, scale: 4 }).notNull().default('1'),
    unitRate: numeric('unit_rate', { precision: 14, scale: 4 }).notNull().default('0'),
    lineTotal: numeric('line_total', { precision: 14, scale: 2 }).notNull().default('0'),
    taxRate: numeric('tax_rate', { precision: 6, scale: 4 }).notNull().default('0'),
    siteId: uuid('site_id'),
    routeId: uuid('route_id'),
    routeGroupId: uuid('route_group_id'),
    vehicleId: uuid('vehicle_id'),
    ...audit,
  },
  (t) => ({
    invoiceIdx: index('client_invoice_lines_invoice_idx').on(t.invoiceId),
  }),
);

export const clientInvoiceDisputes = pgTable(
  'client_invoice_disputes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientInvoiceId: uuid('client_invoice_id').notNull().references(() => clientInvoices.id),
    status: disputeStatusEnum('status').notNull().default('open'),
    reasonCode: varchar('reason_code', { length: 64 }).notNull(),
    summary: text('summary'),
    heldAmount: numeric('held_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    resolutionType: disputeResolutionTypeEnum('resolution_type'),
    ...audit,
  },
  (t) => ({
    invoiceIdx: index('client_invoice_disputes_invoice_idx').on(t.clientInvoiceId),
  }),
);

export const clientPayments = pgTable(
  'client_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull().references(() => clients.id),
    receivedDate: date('received_date').notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 8 }).notNull().default('GBP'),
    method: paymentMethodEnum('method').notNull().default('bacs'),
    reference: varchar('reference', { length: 128 }),
    unapplied: numeric('unapplied', { precision: 14, scale: 2 }).notNull().default('0'),
    ...audit,
  },
  (t) => ({
    clientIdx: index('client_payments_client_idx').on(t.clientId),
    receivedIdx: index('client_payments_received_idx').on(t.receivedDate),
  }),
);

export const clientPaymentAllocations = pgTable(
  'client_payment_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id').notNull().references(() => clientPayments.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').notNull().references(() => clientInvoices.id),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    ...audit,
  },
  (t) => ({
    paymentIdx: index('client_pay_alloc_payment_idx').on(t.paymentId),
    invoiceIdx: index('client_pay_alloc_invoice_idx').on(t.invoiceId),
  }),
);

// ---------- ALLOCATION / FORECAST / CASH FLOW ----------

export const allocationRules = pgTable(
  'allocation_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    scopeType: varchar('scope_type', { length: 32 }).notNull(), // supplier | client | service | global
    scopeId: uuid('scope_id'),
    basis: varchar('basis', { length: 32 }).notNull(), // site | client_contract | route_group | vehicle | usage | percentage
    splits: jsonb('splits').notNull(), // array of { targetType, targetId, percent }
    validFrom: date('valid_from').notNull(),
    validTo: date('valid_to'),
    active: boolean('active').notNull().default(true),
    ...audit,
  },
  (t) => ({
    scopeIdx: index('allocation_rules_scope_idx').on(t.scopeType, t.scopeId),
  }),
);

export const forecastSnapshots = pgTable(
  'forecast_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    periodKey: varchar('period_key', { length: 32 }).notNull(), // e.g. 2026-W16, 2026-Q2
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    scenario: varchar('scenario', { length: 32 }).notNull().default('baseline'),
    committedCashOut: numeric('committed_cash_out', { precision: 14, scale: 2 }).notNull().default('0'),
    expectedCashOut: numeric('expected_cash_out', { precision: 14, scale: 2 }).notNull().default('0'),
    projectedCashOut: numeric('projected_cash_out', { precision: 14, scale: 2 }).notNull().default('0'),
    committedCashIn: numeric('committed_cash_in', { precision: 14, scale: 2 }).notNull().default('0'),
    expectedCashIn: numeric('expected_cash_in', { precision: 14, scale: 2 }).notNull().default('0'),
    projectedCashIn: numeric('projected_cash_in', { precision: 14, scale: 2 }).notNull().default('0'),
    disputedHold: numeric('disputed_hold', { precision: 14, scale: 2 }).notNull().default('0'),
    forecastCost: numeric('forecast_cost', { precision: 14, scale: 2 }).notNull().default('0'),
    forecastRevenue: numeric('forecast_revenue', { precision: 14, scale: 2 }).notNull().default('0'),
    forecastMargin: numeric('forecast_margin', { precision: 14, scale: 2 }).notNull().default('0'),
    actualCashOut: numeric('actual_cash_out', { precision: 14, scale: 2 }),
    actualCashIn: numeric('actual_cash_in', { precision: 14, scale: 2 }),
    variance: numeric('variance', { precision: 14, scale: 2 }),
    rootCause: varchar('root_cause', { length: 128 }),
    ...audit,
  },
  (t) => ({
    periodIdx: index('forecast_snapshots_period_idx').on(t.periodKey),
  }),
);

export const cashFlowBuckets = pgTable(
  'cash_flow_buckets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    weekKey: varchar('week_key', { length: 16 }).notNull(), // e.g. 2026-W16
    weekStart: date('week_start').notNull(),
    weekEnd: date('week_end').notNull(),
    dueOut: numeric('due_out', { precision: 14, scale: 2 }).notNull().default('0'),
    dueIn: numeric('due_in', { precision: 14, scale: 2 }).notNull().default('0'),
    disputedHold: numeric('disputed_hold', { precision: 14, scale: 2 }).notNull().default('0'),
    projectedSupplierSpend: numeric('projected_supplier_spend', { precision: 14, scale: 2 }).notNull().default('0'),
    projectedClientCollections: numeric('projected_client_collections', { precision: 14, scale: 2 }).notNull().default('0'),
    netCash: numeric('net_cash', { precision: 14, scale: 2 }).notNull().default('0'),
    ...audit,
  },
  (t) => ({
    weekIdx: index('cash_flow_week_idx').on(t.weekKey),
  }),
);

// ---------- WARNINGS / IMPACT / DOCS ----------

export const warningEvents = pgTable(
  'warning_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    severity: warningSeverityEnum('severity').notNull(),
    category: warningCategoryEnum('category').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message'),
    subjectType: varchar('subject_type', { length: 32 }), // supplier, client, invoice, dispute, contract...
    subjectId: uuid('subject_id'),
    resolved: boolean('resolved').notNull().default(false),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedByUserId: uuid('resolved_by_user_id'),
    payload: jsonb('payload'),
    ...audit,
  },
  (t) => ({
    severityIdx: index('warning_events_severity_idx').on(t.severity),
    categoryIdx: index('warning_events_category_idx').on(t.category),
    subjectIdx: index('warning_events_subject_idx').on(t.subjectType, t.subjectId),
  }),
);

export const impactConfirmationLogs = pgTable(
  'impact_confirmation_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    changeType: varchar('change_type', { length: 64 }).notNull(),
    subjectType: varchar('subject_type', { length: 32 }).notNull(),
    subjectId: uuid('subject_id').notNull(),
    before: jsonb('before'),
    after: jsonb('after'),
    cashFlowEffect: numeric('cash_flow_effect', { precision: 14, scale: 2 }),
    forecastEffect: numeric('forecast_effect', { precision: 14, scale: 2 }),
    profitabilityEffect: numeric('profitability_effect', { precision: 14, scale: 2 }),
    affectedInvoiceIds: jsonb('affected_invoice_ids'),
    affectedModules: jsonb('affected_modules'),
    requiredApprovals: jsonb('required_approvals'),
    acknowledgedByUserId: uuid('acknowledged_by_user_id'),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    applied: boolean('applied').notNull().default(false),
    appliedAt: timestamp('applied_at', { withTimezone: true }),
    ...audit,
  },
  (t) => ({
    subjectIdx: index('impact_confirmation_subject_idx').on(t.subjectType, t.subjectId),
  }),
);

export const documentIngestions = pgTable(
  'document_ingestions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: documentKindEnum('kind').notNull(),
    status: ingestionStatusEnum('status').notNull().default('uploaded'),
    originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
    fileUrl: text('file_url'),
    mimeType: varchar('mime_type', { length: 128 }),
    sizeBytes: integer('size_bytes'),
    ocrConfidence: numeric('ocr_confidence', { precision: 5, scale: 4 }),
    extractedFields: jsonb('extracted_fields'),
    fieldConfidence: jsonb('field_confidence'),
    suggestedMatches: jsonb('suggested_matches'),
    duplicateRiskFlags: jsonb('duplicate_risk_flags'),
    contractMismatchFlags: jsonb('contract_mismatch_flags'),
    creditWarningFlags: jsonb('credit_warning_flags'),
    confirmedByUserId: uuid('confirmed_by_user_id'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdEntityType: varchar('created_entity_type', { length: 32 }),
    createdEntityId: uuid('created_entity_id'),
    ...audit,
  },
  (t) => ({
    statusIdx: index('document_ingestions_status_idx').on(t.status),
    kindIdx: index('document_ingestions_kind_idx').on(t.kind),
  }),
);

export const eventOutbox = pgTable(
  'event_outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: varchar('event_type', { length: 128 }).notNull(),
    aggregateType: varchar('aggregate_type', { length: 64 }).notNull(),
    aggregateId: uuid('aggregate_id').notNull(),
    payload: jsonb('payload').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    attempt: integer('attempt').notNull().default(0),
    lastError: text('last_error'),
    ...audit,
  },
  (t) => ({
    publishedIdx: index('event_outbox_published_idx').on(t.publishedAt),
    typeIdx: index('event_outbox_type_idx').on(t.eventType),
  }),
);

// re-export sql for convenience in migrations
export { sql };
