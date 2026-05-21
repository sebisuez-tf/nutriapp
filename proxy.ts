import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]

const ROLE_DASHBOARDS: Record<string, string> = {
  super_admin: '/admin/dashboard',
  nutritionist: '/nutritionist/dashboard',
  patient: '/patient/dashboard',
  coordinator: '/nutritionist/dashboard',
  support: '/admin/dashboard',
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Allow public routes without session
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  if (!user) {
    if (isPublicRoute) {
      return supabaseResponse
    }
    // Redirect to login
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // User is authenticated
  const role = (user.user_metadata?.role as string) ?? 'nutritionist'

  // If authenticated user hits login, redirect to their dashboard
  if (pathname === '/login' || pathname === '/register') {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = ROLE_DASHBOARDS[role] ?? '/nutritionist/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // Route guards
  if (pathname.startsWith('/admin')) {
    if (role !== 'super_admin' && role !== 'support') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = ROLE_DASHBOARDS[role] ?? '/nutritionist/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (pathname.startsWith('/nutritionist')) {
    if (role !== 'nutritionist' && role !== 'super_admin' && role !== 'coordinator') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = ROLE_DASHBOARDS[role] ?? '/login'
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (pathname.startsWith('/patient')) {
    if (role !== 'patient') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = ROLE_DASHBOARDS[role] ?? '/login'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
