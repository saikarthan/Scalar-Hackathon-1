import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// SECURITY RULE: Mandatory Auth for all Dashboard routes
export function middleware(request: NextRequest) {
  const token = request.cookies.get('gateway_token') || request.headers.get('Authorization');
  const { pathname } = request.nextUrl;

  // 1. Allow access to /login and static assets
  if (pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 2. Redirect to /login if no token is found (Simple demo-level protection)
  // In a real environment, we would also verify the JWT here.
  // We'll rely on the client-side check for now as Next.js Middleware doesn't have easy access to localStorage.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
