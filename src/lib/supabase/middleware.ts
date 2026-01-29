/**
 * Supabase Middleware Client
 * 
 * Creates a Supabase client for use in Next.js middleware.
 * Handles session refresh and cookie management for each request.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type User, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Result type for updateSession function.
 */
export interface UpdateSessionResult {
    supabaseResponse: NextResponse
    user: User | null
    supabase: SupabaseClient
}

/**
 * Update the Supabase auth session in middleware.
 * This refreshes the session if needed and sets cookies on the response.
 */
export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables in middleware')
        // Create a minimal client for the return type
        const minimalClient = createServerClient(
            'https://placeholder.supabase.co',
            'placeholder-anon-key',
            {
                cookies: {
                    getAll() { return [] },
                    setAll() { /* no-op */ },
                },
            }
        )
        return { supabaseResponse, user: null, supabase: minimalClient }
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                )
                supabaseResponse = NextResponse.next({
                    request,
                })
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                )
            },
        },
    })

    // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
    // A simple mistake could lead to security issues if session is not properly refreshed
    const {
        data: { user },
    } = await supabase.auth.getUser()

    return { supabaseResponse, user, supabase }
}
