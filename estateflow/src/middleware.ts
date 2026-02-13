import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define protected route prefixes
const protectedRoutes = ['/admin', '/tenant', '/guard', '/superadmin']
const publicRoutes = ['/login', '/auth', '/invite', '/api', '/offline', '/_next', '/favicon.ico']

// Role → which route prefixes they're allowed to access
const roleRouteMap: Record<string, string[]> = {
    superadmin: ['/superadmin', '/admin'],  // superadmin can also inspect admin panel
    landlord: ['/admin'],
    tenant: ['/tenant'],
    guard: ['/guard'],
}

// Role → default dashboard
const dashboardMap: Record<string, string> = {
    superadmin: '/superadmin/dashboard',
    landlord: '/admin/dashboard',
    tenant: '/tenant',
    guard: '/guard',
}

export async function middleware(request: NextRequest) {
    // Skip if Supabase env vars are missing
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return NextResponse.next()
    }

    const { pathname } = request.nextUrl

    // Skip public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next()
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, ...options }) => {
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    // --- Authentication: must be logged in for protected routes ---
    if (isProtectedRoute && !user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // --- Authorization: role must match the route section ---
    if (isProtectedRoute && user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role || 'landlord'
        const allowedPrefixes = roleRouteMap[role] || []
        const hasAccess = allowedPrefixes.some(prefix => pathname.startsWith(prefix))

        if (!hasAccess) {
            // Redirect to their own dashboard instead of showing forbidden
            return NextResponse.redirect(
                new URL(dashboardMap[role] || '/login', request.url)
            )
        }
    }

    // --- Login page redirect: send logged-in users to their dashboard ---
    if (user && pathname === '/login') {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role || 'landlord'
        return NextResponse.redirect(new URL(dashboardMap[role] || '/admin/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|sw.js).*)',
    ],
}
