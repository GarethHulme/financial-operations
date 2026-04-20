import { cn } from '@/lib/utils';
import { severityStyles, type WarningSeverity } from '@/lib/warnings';

export function SeverityChip({ severity, label }: { severity: WarningSeverity; label?: string }) {
  const s = severityStyles[severity];
  return (
    <span className={cn('chip', s.bg, s.text, s.border)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label ?? severity}
    </span>
  );
}
