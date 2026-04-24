'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Request failed');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
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
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-xs mb-5"
          style={{ background: 'none', border: 'none', color: '#22a075', cursor: 'pointer', padding: 0 }}
        >
          ← Back to sign in
        </button>
        <h1 className="text-lg font-semibold text-white mb-2">Forgot your password?</h1>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Enter your email and we'll send you a reset link.
        </p>
        {done ? (
          <div className="text-sm px-3 py-2 rounded-md" style={{ background: 'rgba(34,160,117,0.1)', border: '1px solid rgba(34,160,117,0.3)', color: '#fff' }}>
            If an account exists for that email, a reset link has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
              disabled={loading || !email.trim()}
              className="w-full py-2 rounded-md text-sm font-medium text-white disabled:opacity-60"
              style={{ background: '#1a7a5e' }}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
