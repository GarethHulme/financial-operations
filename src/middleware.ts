import { NextRequest, NextResponse } from 'next/server';

const AUTH_URL = 'https://dcs-command-suite-auth-production.up.railway.app';
const COOKIE = 'dcs_auth';

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const ssoToken = searchParams.get('sso');

  if (ssoToken) {
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: ssoToken }),
      });
      if (!res.ok) throw new Error('invalid');
      const payload = await res.json();
      if (!payload?.valid || !payload?.user) throw new Error('invalid');

      const clean = req.nextUrl.clone();
      clean.searchParams.delete('sso');
      const response = NextResponse.redirect(clean);
      response.cookies.set(
        COOKIE,
        Buffer.from(JSON.stringify(payload.user)).toString('base64'),
        {
          httpOnly: false,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60,
          path: '/',
        }
      );
      return response;
    } catch {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(COOKIE);
      return res;
    }
  }

  const cookie = req.cookies.get(COOKIE)?.value;
  if (!cookie) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  try {
    JSON.parse(Buffer.from(cookie, 'base64').toString());
    return NextResponse.next();
  } catch {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(COOKIE);
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
