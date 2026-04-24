'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Reset failed');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a1a14' }}>
      <div
        className="w-full max-w-md rounded-lg p-8"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
      >
        <h1 className="text-lg font-semibold text-white mb-2">Reset your password</h1>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Enter a new password for your account.
        </p>
        {!token ? (
          <div className="text-sm px-3 py-2 rounded-md" style={{ background: 'rgba(220,81,81,0.1)', border: '1px solid rgba(220,81,81,0.3)', color: '#dc5151' }}>
            Missing reset token. Please use the link from your email.
          </div>
        ) : done ? (
          <div>
            <div className="text-sm px-3 py-2 rounded-md mb-4" style={{ background: 'rgba(34,160,117,0.1)', border: '1px solid rgba(34,160,117,0.3)', color: '#fff' }}>
              Password reset successfully. You can now sign in.
            </div>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full py-2 rounded-md text-sm font-medium text-white"
              style={{ background: '#1a7a5e' }}
            >
              Go to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>New password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full px-3 py-2 rounded-md text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Confirm password</label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full px-3 py-2 rounded-md text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
              />
            </div>
            {error && (
              <div className="text-sm px-3 py-2 rounded-md" style={{ background: 'rgba(220,81,81,0.1)', border: '1px solid rgba(220,81,81,0.3)', color: '#dc5151' }}>{error}</div>
            )}
            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full py-2 rounded-md text-sm font-medium text-white disabled:opacity-60"
              style={{ background: '#1a7a5e' }}
            >
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0a1a14', minHeight: '100vh' }} />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
