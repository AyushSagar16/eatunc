/**
 * Next.js Middleware
 * 
 * Handles authentication and route protection.
 * - Refreshes Supabase auth session on every request
 * - Protects dashboard and onboarding routes
 * - Redirects unauthenticated users to login
 * - Redirects users needing onboarding to onboarding page
 */

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/onboarding']

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/auth/login']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Update session (refresh tokens if needed)
    const { supabaseResponse, user, supabase } = await updateSession(request)

    // Check if this is a protected route
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

    // Handle auth routes (login page)
    if (isAuthRoute && user) {
        // Logged in user trying to access login, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Handle protected routes
    if (isProtectedRoute && !user) {
        // Not logged in, redirect to login
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Handle onboarding flow for authenticated users
    if (user && pathname.startsWith('/dashboard')) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

        // Redirect to onboarding if not completed
        if (!profile?.onboarding_completed) {
            return NextResponse.redirect(new URL('/onboarding', request.url))
        }
    }

    // Prevent completed users from accessing onboarding
    if (user && pathname.startsWith('/onboarding')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()

        // If onboarding is complete, redirect to dashboard
        if (profile?.onboarding_completed) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         * - api routes that don't need auth
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}
