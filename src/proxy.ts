import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Renamed from 'middleware' to 'proxy'
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';

  // Your existing exclusion logic
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/gallery') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Keep the config export as is
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};