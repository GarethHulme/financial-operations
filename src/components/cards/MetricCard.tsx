import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  href?: string;
  tone?: 'default' | 'positive' | 'negative' | 'warning' | 'critical' | 'blocking';
  icon?: ReactNode;
  breakdown?: string;
}

const toneStyles: Record<NonNullable<MetricCardProps['tone']>, string> = {
  default: 'border-border',
  positive: 'border-status-ok/40',
  negative: 'border-severity-critical/40',
  warning: 'border-severity-warning/40',
  critical: 'border-severity-critical/40',
  blocking: 'border-severity-blocking/40',
};

const toneAccent: Record<NonNullable<MetricCardProps['tone']>, string> = {
  default: 'text-text-primary',
  positive: 'text-status-ok',
  negative: 'text-severity-critical',
  warning: 'text-severity-warning',
  critical: 'text-severity-critical',
  blocking: 'text-severity-blocking',
};

export function MetricCard({ label, value, delta, hint, href, tone = 'default', icon, breakdown }: MetricCardProps) {
  const tooltip = [hint, breakdown].filter(Boolean).join(' — ');
  const inner = (
    <div
      className={cn(
        'card card-hover cursor-pointer relative group h-full transition-all',
        toneStyles[tone],
      )}
    >
      <div className="flex items-start justify-between">
        <div className="label">{label}</div>
        <div className="flex items-center gap-1.5 text-text-muted">
          {icon && <span className="group-hover:text-text-primary transition-colors">{icon}</span>}
          {href && (
            <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity text-sm">
              →
            </span>
          )}
        </div>
      </div>
      <div className={cn('text-2xl font-semibold mt-2', toneAccent[tone])}>{value}</div>
      {delta && <div className="text-xs text-text-muted mt-1">{delta}</div>}
      {tooltip && (
        <div className="absolute inset-x-0 -bottom-2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity delay-150 z-10 pointer-events-none">
          <div className="mx-2 mt-1 bg-bg-raised border border-border-strong rounded-md p-2 text-xs text-text-secondary shadow-lg">
            {hint && <div>{hint}</div>}
            {breakdown && (
              <div className={cn('text-text-muted', hint && 'mt-1 pt-1 border-t border-border')}>
                {breakdown}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}
