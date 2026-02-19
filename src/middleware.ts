import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/home', '/league', '/user', '/pokemon'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    try {
      // Check authentication by calling the auth status endpoint
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/auth/status`, {
        credentials: 'include',
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        // Not authenticated, redirect to login with the original destination
        const url = new URL('/', request.url);
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
      }

      const data = await response.json();

      if (!data.isAuthenticated) {
        // Not authenticated, redirect to login with the original destination
        const url = new URL('/', request.url);
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
      }

      // Authenticated, allow the request to proceed
      return NextResponse.next();
    } catch (error) {
      // Backend unreachable — fail closed (redirect to login)
      console.error('Middleware auth check failed:', error);
      const url = new URL('/', request.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
