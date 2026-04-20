'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ActionButtons({ id, currentStatus }: { id: string; currentStatus: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'confirm' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const terminal = currentStatus === 'confirmed' || currentStatus === 'rejected';

  const call = async (action: 'confirm' | 'reject') => {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`${action} failed: ${res.status}`);
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={() => call('confirm')}
          disabled={terminal || busy !== null}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === 'confirm' ? 'Confirming…' : 'Confirm & Create'}
        </button>
        <button
          onClick={() => call('reject')}
          disabled={terminal || busy !== null}
          className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-severity-critical">{error}</div>}
      {terminal && (
        <div className="mt-2 text-xs text-text-muted">
          This document has been {currentStatus}.
        </div>
      )}
    </div>
  );
}
