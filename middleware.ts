import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // TODO: Add Supabase auth check here once auth is configured
  // For now, allow all access for testing
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/bookings/:path*', '/crm/:path*', '/tasks/:path*', '/dashboard/:path*'],
}
