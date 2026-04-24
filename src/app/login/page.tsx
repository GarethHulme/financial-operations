'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/sso-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Invalid credentials');
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0a1a14' }}
    >
      <div
        className="w-full max-w-md rounded-lg p-8"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
        }}
      >
        <div className="mb-6">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-white">DCS</span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#22a075' }}
            />
          </div>
          <div className="text-sm font-semibold text-white mt-1">Financial Operations</div>
          <div
            className="text-[10px] uppercase tracking-wider mt-1"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            DCS Command Suite
          </div>
        </div>

        <h1 className="text-lg font-semibold text-white mb-4">Sign in</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wider mb-1"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 rounded-md text-sm text-white outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wider mb-1"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 rounded-md text-sm text-white outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ width: 14, height: 14, accentColor: '#22a075', cursor: 'pointer' }}
            />
            <label
              htmlFor="remember"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', userSelect: 'none' }}
            >
              Remember me
            </label>
          </div>

          {error && (
            <div
              className="text-sm px-3 py-2 rounded-md"
              style={{
                background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.3)',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md text-sm font-medium text-white transition-opacity disabled:opacity-60"
            style={{ background: '#1a7a5e' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-xs"
              style={{ color: '#22a075' }}
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
