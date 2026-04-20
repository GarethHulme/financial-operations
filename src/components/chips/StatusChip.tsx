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
};

export function StatusChip({ status }: { status: string }) {
  const cls = map[status] ?? 'bg-status-neutral/15 text-text-secondary border-border';
  const label = status.replace(/_/g, ' ');
  return <span className={cn('chip capitalize', cls)}>{label}</span>;
}
