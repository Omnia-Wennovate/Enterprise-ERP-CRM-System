import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths — always allow
  const isAuthPage = pathname.startsWith('/login')
  const isPublicApi =
    pathname.startsWith('/api/audit/log-event') ||
    pathname.startsWith('/api/social/oauth/callback')

  // Check for Supabase session cookie (no network call needed)
  const hasSession = request.cookies.getAll().some(
    (cookie) =>
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )

  if (!hasSession && !isAuthPage && !isPublicApi) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (hasSession && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
