import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Auth-enabled Supabase client for user sessions
export const supabaseAuth = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'eatunc-auth',
    },
    global: {
        headers: {
            'x-client-info': 'unc-dining-web-auth',
        },
    },
    db: {
        schema: 'public',
    },
})
