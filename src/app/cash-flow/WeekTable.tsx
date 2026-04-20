'use client';

import { Fragment, useState } from 'react';
import { cn, formatCurrency } from '@/lib/utils';

interface WeekRow {
  weekKey: string;
  weekStart: string;
  weekEnd: string;
  dueOut: number | string;
  dueIn: number | string;
  disputedHold: number | string;
  netCash: number | string;
}

export function WeekTable({ rows }: { rows: WeekRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-8 text-center text-text-muted text-sm">No cash flow data</div>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-bg-raised/70">
            <tr>
              <th className="px-4 py-2.5 font-medium text-text-secondary text-left w-8"></th>
              <th className="px-4 py-2.5 font-medium text-text-secondary text-left">Week</th>
              <th className="px-4 py-2.5 font-medium text-text-secondary text-left">Start</th>
              <th className="px-4 py-2.5 font-medium text-text-secondary text-left">End</th>
              <th className="px-4 py-2.5 font-medium text-text-secondary text-right">Due Out</th>
              <th className="px-4 py-2.5 font-medium text-text-secondary text-right">Due In</th>
              <th className="px-4 py-2.5 font-medium text-text-secondary text-right">Disputed Hold</th>
              <th className="px-4 py-2.5 font-medium text-text-secondary text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isOpen = expanded === r.weekKey;
              const net = Number(r.netCash);
              return (
                <Fragment key={r.weekKey}>
                  <tr
                    className="border-b border-border hover:bg-bg-raised/70 transition-colors cursor-pointer group"
                    onClick={() => setExpanded(isOpen ? null : r.weekKey)}
                  >
                    <td className="px-4 py-2.5 text-text-muted">
                      <span
                        className={cn(
                          'inline-block transition-transform group-hover:text-accent',
                          isOpen && 'rotate-90',
                        )}
                      >
                        ▸
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-text-primary font-medium">{r.weekKey}</td>
                    <td className="px-4 py-2.5 text-text-primary">{r.weekStart}</td>
                    <td className="px-4 py-2.5 text-text-primary">{r.weekEnd}</td>
                    <td className="px-4 py-2.5 text-text-primary text-right">{formatCurrency(r.dueOut)}</td>
                    <td className="px-4 py-2.5 text-text-primary text-right">{formatCurrency(r.dueIn)}</td>
                    <td className="px-4 py-2.5 text-text-primary text-right">{formatCurrency(r.disputedHold)}</td>
                    <td
                      className={cn(
                        'px-4 py-2.5 text-right',
                        net >= 0 ? 'text-status-ok' : 'text-severity-critical',
                      )}
                    >
                      {formatCurrency(r.netCash)}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-bg-raised/40 border-b border-border">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                          <a
                            href={`/invoices?tab=supplier`}
                            className="card card-hover cursor-pointer transition-all"
                          >
                            <div className="label">Outflow (supplier invoices)</div>
                            <div className="text-base font-semibold mt-1 text-severity-critical">
                              {formatCurrency(r.dueOut)}
                            </div>
                            <div className="text-text-muted mt-1">View invoices →</div>
                          </a>
                          <a
                            href={`/invoices?tab=client`}
                            className="card card-hover cursor-pointer transition-all"
                          >
                            <div className="label">Inflow (client invoices)</div>
                            <div className="text-base font-semibold mt-1 text-status-ok">
                              {formatCurrency(r.dueIn)}
                            </div>
                            <div className="text-text-muted mt-1">View invoices →</div>
                          </a>
                          <a href="/disputes" className="card card-hover cursor-pointer transition-all">
                            <div className="label">Disputed Hold</div>
                            <div className="text-base font-semibold mt-1 text-severity-blocking">
                              {formatCurrency(r.disputedHold)}
                            </div>
                            <div className="text-text-muted mt-1">View disputes →</div>
                          </a>
                          <div className="card">
                            <div className="label">Net for week</div>
                            <div
                              className={cn(
                                'text-base font-semibold mt-1',
                                net >= 0 ? 'text-status-ok' : 'text-severity-critical',
                              )}
                            >
                              {formatCurrency(r.netCash)}
                            </div>
                            <div className="text-text-muted mt-1">
                              {r.weekStart} – {r.weekEnd}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
