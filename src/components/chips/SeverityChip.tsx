import { cn } from '@/lib/utils';
import { severityStyles, type WarningSeverity } from '@/lib/warnings';

const severityDescriptions: Record<WarningSeverity, string> = {
  info: 'Informational — no action required',
  advisory: 'Worth reviewing — no immediate risk',
  warning: 'Action recommended — potential impact',
  critical: 'Immediate attention required — financial risk',
  blocking: 'Blocks workflow — must be resolved before proceeding',
};

export function SeverityChip({ severity, label }: { severity: WarningSeverity; label?: string }) {
  const s = severityStyles[severity];
  const description = severityDescriptions[severity];
  return (
    <span className="relative inline-block group">
      <span className={cn('chip cursor-help', s.bg, s.text, s.border)}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {label ?? severity}
      </span>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity delay-150 whitespace-nowrap">
        <span className="block bg-bg-raised border border-border-strong rounded-md px-2 py-1 text-xs text-text-secondary shadow-lg normal-case">
          {description}
        </span>
      </span>
    </span>
  );
}
