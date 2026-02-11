import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

// This MUST be named "middleware" or be the "default" export
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';

  // Skip middleware for images, static files, and API routes
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/gallery') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Your multi-world logic stays here if needed later
  return NextResponse.next();
}

// Optional: Limit where the middleware runs to avoid overhead
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};