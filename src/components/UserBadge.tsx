'use client';

import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';

type User = {
  name?: string;
  email?: string;
};

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.substring(name.length + 1)) : null;
}

export default function UserBadge() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = readCookie('dcs_auth');
    if (!raw) return;
    try {
      const parsed = JSON.parse(atob(raw));
      setUser(parsed);
    } catch {
      setUser(null);
    }
  }, []);

  function logout() {
    document.cookie = 'dcs_auth=; path=/; max-age=0';
    window.location.href = '/login';
  }

  if (!user) return null;

  const label = user.name || user.email || 'User';

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          color: '#ffffff',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: '#22a075' }}
        />
        <span>{label}</span>
      </div>
      <button
        onClick={logout}
        title="Sign out"
        className="p-1.5 rounded-md transition-colors"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
