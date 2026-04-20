'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SummaryDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: ReactNode;
  widthClass?: string;
}

export function SummaryDrawer({
  open,
  title,
  onClose,
  viewAllHref,
  viewAllLabel = 'View All',
  children,
  widthClass = 'w-full sm:w-[28rem]',
}: SummaryDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition-all',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'absolute right-0 top-0 h-full bg-bg-elevated border-l border-border-strong shadow-2xl',
          'flex flex-col transition-transform duration-200 ease-out',
          widthClass,
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text-primary cursor-pointer transition-colors w-8 h-8 rounded-md flex items-center justify-center hover:bg-bg-raised"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-text-secondary">{children}</div>
        {viewAllHref && (
          <footer className="px-5 py-3 border-t border-border bg-bg-raised/30">
            <Link
              href={viewAllHref}
              className="text-accent hover:text-accent-hover cursor-pointer transition-colors text-sm font-medium inline-flex items-center gap-1"
              onClick={onClose}
            >
              {viewAllLabel} →
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}
