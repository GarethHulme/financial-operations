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
        {rows.map((w) => (
          <div key={w.id} className="card flex items-start justify-between gap-4">
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
            <div className="text-xs text-text-muted whitespace-nowrap">{formatDate(w.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
