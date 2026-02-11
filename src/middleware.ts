import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';

  // Skip middleware for internal files, api routes, and static assets
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/gallery') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Example: drakkenheim.hitechsavvy.com -> drakkenheim
  const subdomain = host.split('.')[0];

  // Optional: You can rewrite the path internally if you want 
  // special handling, but since our getCurrentWorld() already 
  // looks at the headers, we just let the request through.
  return NextResponse.next();
}