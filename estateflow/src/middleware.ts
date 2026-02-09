import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define protected route prefixes
const protectedRoutes = ['/admin', '/tenant', '/guard']
const publicRoutes = ['/login', '/auth', '/invite', '/api', '/offline', '/_next', '/favicon.ico']

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

    // Check if accessing protected route without auth
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    if (isProtectedRoute && !user) {
        // Redirect to login with return URL
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // If logged in and on login page, redirect to appropriate dashboard
    if (user && pathname === '/login') {
        // Get user's role from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role || 'landlord'
        const dashboardMap: Record<string, string> = {
            landlord: '/admin/dashboard',
            tenant: '/tenant',
            guard: '/guard'
        }

        return NextResponse.redirect(new URL(dashboardMap[role] || '/admin/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|sw.js).*)',
    ],
}

