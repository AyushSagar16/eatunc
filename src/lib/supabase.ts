
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

// Optimized Supabase client configuration for performance
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, // No auth needed for public menu data
        autoRefreshToken: false,
        detectSessionInUrl: false
    },
    global: {
        headers: {
            'x-client-info': 'unc-dining-web',
        },
    },
    db: {
        schema: 'public',
    },
    // Connection pooling and timeout configuration
    realtime: {
        params: {
            eventsPerSecond: 2 // Limit realtime events if enabled
        }
    }
})
