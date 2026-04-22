import { NextRequest, NextResponse } from 'next/server';

const AUTH_URL = 'https://dcs-command-suite-auth-production.up.railway.app';
const COOKIE = 'dcs_auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const authRes = await fetch(`${AUTH_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!authRes.ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const data = await authRes.json();
    const user = data?.user;

    if (!user) {
      return NextResponse.json({ error: 'Invalid response from auth server' }, { status: 401 });
    }

    const response = NextResponse.json({ user });
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60;
    response.cookies.set(
      COOKIE,
      Buffer.from(JSON.stringify(user)).toString('base64'),
      {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge,
        path: '/',
      }
    );
    return response;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
