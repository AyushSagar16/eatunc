/**
 * Auth Callback Route
 * 
 * Handles the redirect from Supabase magic link authentication.
 * Exchanges the auth code for a session and redirects to the appropriate page.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'
    const origin = requestUrl.origin

    // Handle missing code (invalid or expired link)
    if (!code) {
        const errorUrl = new URL('/auth/login', origin)
        errorUrl.searchParams.set('error', 'invalid_link')
        return NextResponse.redirect(errorUrl)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables')
        return NextResponse.redirect(new URL('/auth/login?error=config', origin))
    }

    // Store cookies to set - we need to apply them to whichever response we return
    const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookies) {
                // Store cookies for later application
                cookies.forEach((cookie) => {
                    cookiesToSet.push(cookie)
                })
            },
        },
    })

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        console.error('Auth callback error:', error)
        const errorUrl = new URL('/auth/login', origin)
        errorUrl.searchParams.set('error', 'auth_failed')
        return NextResponse.redirect(errorUrl)
    }

    // Determine redirect destination
    let redirectTo = next

    // Check if user needs onboarding
    if (data.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', data.user.id)
            .single()

        // Redirect to onboarding if not completed
        if (!profile?.onboarding_completed) {
            redirectTo = '/onboarding'
        }
    }

    // Create the response with the correct redirect URL
    const response = NextResponse.redirect(new URL(redirectTo, origin))

    // Apply all cookies to the response
    cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
    })

    return response
}
