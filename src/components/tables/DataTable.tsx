import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  emptyLabel = 'No records',
  onRowClick,
  rowHref,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyLabel?: string;
  onRowClick?: (row: T) => void;
  rowHref?: (row: T) => string | null | undefined;
}) {
  const interactive = Boolean(onRowClick || rowHref);
  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-bg-raised/70">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    'px-4 py-2.5 font-medium text-text-secondary text-left',
                    c.align === 'right' && 'text-right',
                    c.align === 'center' && 'text-center',
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const href = rowHref ? rowHref(row) : null;
                const cells = columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-4 py-2.5 text-text-primary',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                    )}
                  >
                    {href ? (
                      <Link
                        href={href}
                        className={cn(
                          'block -mx-4 -my-2.5 px-4 py-2.5',
                          c.align === 'right' && 'text-right',
                          c.align === 'center' && 'text-center',
                        )}
                      >
                        {c.render ? c.render(row) : row[c.key]}
                      </Link>
                    ) : c.render ? (
                      c.render(row)
                    ) : (
                      row[c.key]
                    )}
                  </td>
                ));
                return (
                  <tr
                    key={row.id ?? i}
                    className={cn(
                      'table-row',
                      interactive && 'cursor-pointer hover:bg-bg-raised/70 transition-colors',
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {cells}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
