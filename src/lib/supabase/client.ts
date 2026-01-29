/**
 * Supabase Browser Client
 * 
 * Creates a Supabase client for use in Client Components.
 * Uses cookie-based session management via @supabase/ssr.
 */

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/database.types'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Get or create a Supabase browser client singleton.
 * This client handles authentication and session management in the browser.
 */
export function createClient() {
    if (client) return client

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables')
    }

    client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
    return client
}
