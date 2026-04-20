import { cn } from '@/lib/utils';

const map: Record<string, string> = {
  draft: 'bg-status-neutral/15 text-text-muted border-border',
  active: 'bg-status-ok/15 text-status-ok border-status-ok/40',
  approved: 'bg-status-ok/15 text-status-ok border-status-ok/40',
  paid: 'bg-status-ok/15 text-status-ok border-status-ok/40',
  pending_validation: 'bg-severity-advisory/15 text-severity-advisory border-severity-advisory/40',
  pending_approval: 'bg-severity-advisory/15 text-severity-advisory border-severity-advisory/40',
  parsed: 'bg-severity-info/15 text-severity-info border-severity-info/40',
  scheduled: 'bg-severity-info/15 text-severity-info border-severity-info/40',
  disputed: 'bg-severity-blocking/15 text-severity-blocking border-severity-blocking/40',
  voided: 'bg-status-neutral/10 text-text-muted border-border line-through',
  rejected: 'bg-severity-critical/15 text-severity-critical border-severity-critical/40',
  overdue: 'bg-severity-critical/15 text-severity-critical border-severity-critical/40',
  restricted: 'bg-severity-critical/15 text-severity-critical border-severity-critical/40',
  within_limit: 'bg-status-ok/15 text-status-ok border-status-ok/40',
  warning: 'bg-severity-warning/15 text-severity-warning border-severity-warning/40',
  at_risk: 'bg-severity-critical/15 text-severity-critical border-severity-critical/40',
  breached: 'bg-severity-blocking/15 text-severity-blocking border-severity-blocking/40',
  ready_to_issue: 'bg-severity-info/15 text-severity-info border-severity-info/40',
  issued: 'bg-severity-info/15 text-severity-info border-severity-info/40',
  sent: 'bg-severity-info/15 text-severity-info border-severity-info/40',
  due: 'bg-severity-advisory/15 text-severity-advisory border-severity-advisory/40',
  partially_paid: 'bg-severity-advisory/15 text-severity-advisory border-severity-advisory/40',
  credited: 'bg-status-neutral/15 text-text-muted border-border',
  written_off: 'bg-status-neutral/15 text-text-muted border-border line-through',
  uploaded: 'bg-severity-info/15 text-severity-info border-severity-info/40',
  extracting: 'bg-severity-advisory/15 text-severity-advisory border-severity-advisory/40',
  extracted: 'bg-severity-info/15 text-severity-info border-severity-info/40',
  matched: 'bg-severity-info/15 text-severity-info border-severity-info/40',
  awaiting_confirmation: 'bg-severity-advisory/15 text-severity-advisory border-severity-advisory/40',
  confirmed: 'bg-status-ok/15 text-status-ok border-status-ok/40',
  investigating: 'bg-severity-advisory/15 text-severity-advisory border-severity-advisory/40',
  awaiting_supplier: 'bg-severity-advisory/15 text-severity-advisory border-severity-advisory/40',
  awaiting_client: 'bg-severity-advisory/15 text-severity-advisory border-severity-advisory/40',
  proposed_settlement: 'bg-severity-info/15 text-severity-info border-severity-info/40',
  resolved: 'bg-status-ok/15 text-status-ok border-status-ok/40',
  withdrawn: 'bg-status-neutral/15 text-text-muted border-border',
  open: 'bg-severity-blocking/15 text-severity-blocking border-severity-blocking/40',
};

const descriptions: Record<string, string> = {
  draft: 'Record created, not yet submitted',
  active: 'Fully validated and operational',
  approved: 'Passed approval workflow',
  paid: 'Payment completed',
  pending_validation: 'Awaiting data validation checks',
  pending_approval: 'Validated, awaiting role-based approval',
  parsed: 'Document parsed, awaiting validation',
  scheduled: 'Approved and scheduled for payment',
  disputed: 'Under dispute — excluded from payment runs',
  voided: 'Cancelled — superseded or withdrawn',
  rejected: 'Failed validation or approval',
  overdue: 'Past due date, payment not received',
  restricted: 'Supplier operations restricted',
  within_limit: 'Credit exposure within approved limit',
  warning: 'Credit exposure approaching limit',
  at_risk: 'Credit exposure near breach threshold',
  breached: 'Credit limit exceeded',
  ready_to_issue: 'Invoice ready to be sent to client',
  issued: 'Invoice sent to client',
  sent: 'Invoice delivered',
  due: 'Payment due within terms',
  partially_paid: 'Partial payment received',
  credited: 'Credit note applied',
  written_off: 'Debt written off',
  uploaded: 'Document uploaded, awaiting extraction',
  extracting: 'OCR/extraction in progress',
  extracted: 'Fields extracted, awaiting confirmation',
  matched: 'Matched to supplier/client',
  awaiting_confirmation: 'Ready for user confirmation',
  confirmed: 'Confirmed and record created',
  investigating: 'Dispute under investigation',
  awaiting_supplier: 'Waiting for supplier response',
  awaiting_client: 'Waiting for client response',
  proposed_settlement: 'Settlement proposed, awaiting acceptance',
  resolved: 'Dispute resolved',
  withdrawn: 'Dispute withdrawn',
  open: 'Dispute opened',
};

export function StatusChip({ status }: { status: string }) {
  const cls = map[status] ?? 'bg-status-neutral/15 text-text-secondary border-border';
  const label = status.replace(/_/g, ' ');
  const description = descriptions[status];
  return (
    <span className="relative inline-block group">
      <span className={cn('chip capitalize', cls, description && 'cursor-help')}>{label}</span>
      {description && (
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity delay-150 whitespace-nowrap">
          <span className="block bg-bg-raised border border-border-strong rounded-md px-2 py-1 text-xs text-text-secondary shadow-lg normal-case">
            {description}
          </span>
        </span>
      )}
    </span>
  );
}
