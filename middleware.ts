import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3333';

const PROTECTED_PREFIXES = ['/home', '/league', '/pokemon', '/user'];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Skip if public
  if (!isProtected || pathname === '/') {
    return NextResponse.next();
  }

  // Call backend auth/status with forwarded cookies
  try {
    const res = await fetch(`${API_BASE}/api/auth/status`, {
      headers: { cookie: req.headers.get('cookie') || '' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.isAuthenticated) {
        return NextResponse.next();
      }
    }
  } catch (e) {
    // fallthrough to redirect
  }

  const url = req.nextUrl.clone();
  url.pathname = '/';
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)).*)']
};
