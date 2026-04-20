import { getDb } from '@/db';
import { warningEvents } from '@/db/schema';
import { desc, eq, inArray, and } from 'drizzle-orm';
import { PageHeader } from '@/components/PageHeader';
import { SeverityChip } from '@/components/chips/SeverityChip';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const severityFilters = ['info', 'advisory', 'warning', 'critical', 'blocking'] as const;

async function load(severities: string[]) {
  try {
    const db = getDb();
    const conditions: any[] = [eq(warningEvents.resolved, false)];
    if (severities.length) conditions.push(inArray(warningEvents.severity, severities as any));
    return await db
      .select()
      .from(warningEvents)
      .where(and(...conditions))
      .orderBy(desc(warningEvents.createdAt))
      .limit(300);
  } catch {
    return [] as any[];
  }
}

function hrefForWarning(w: { subjectType?: string | null; subjectId?: string | null }): string | null {
  if (!w.subjectType) return null;
  switch (w.subjectType) {
    case 'supplier':
      return w.subjectId ? `/suppliers/${w.subjectId}` : null;
    case 'client':
      return w.subjectId ? `/clients/${w.subjectId}` : null;
    case 'supplier_invoice':
      return '/invoices?tab=supplier';
    case 'client_invoice':
      return '/invoices?tab=client';
    case 'dispute':
      return w.subjectId ? `/disputes/${w.subjectId}` : '/disputes';
    default:
      return null;
  }
}

export default async function WarningsPage({ searchParams }: { searchParams: { severity?: string | string[] } }) {
  const raw = searchParams.severity;
  const active = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const rows = await load(active);
  return (
    <div>
      <PageHeader title="Warnings & Exceptions" subtitle="Filtered exception view by severity." />
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href="/warnings"
          className={cn('btn-ghost', active.length === 0 && 'bg-bg-raised text-text-primary border-border-strong')}
        >
          All
        </Link>
        {severityFilters.map((s) => (
          <Link
            key={s}
            href={`/warnings?severity=${s}`}
            className={cn(
              'btn-ghost capitalize',
              active.includes(s) && 'bg-bg-raised text-text-primary border-border-strong',
            )}
          >
            {s}
          </Link>
        ))}
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <div className="card text-center text-text-muted">No warnings</div>}
        {rows.map((w) => {
          const href = hrefForWarning(w);
          const body = (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <SeverityChip severity={w.severity} />
                  <span className="text-xs text-text-muted capitalize">{w.category.replace(/_/g, ' ')}</span>
                </div>
                <div className="text-sm font-medium mt-1">{w.title}</div>
                {w.message && <div className="text-xs text-text-secondary mt-0.5">{w.message}</div>}
                {w.subjectType && (
                  <div className="text-xs text-text-muted mt-1">
                    Subject: {w.subjectType} {w.subjectId ? `· ${w.subjectId.slice(0, 8)}` : ''}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                <div className="text-xs text-text-muted">{formatDate(w.createdAt)}</div>
                {href && (
                  <span className="text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                )}
              </div>
            </div>
          );
          return href ? (
            <Link
              key={w.id}
              href={href}
              className="card card-hover group block cursor-pointer transition-all"
            >
              {body}
            </Link>
          ) : (
            <div key={w.id} className="card group">
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
