'use server'

/**
 * Auth Actions
 * 
 * Server actions for authentication operations.
 * All auth actions validate UNC email domain server-side for security.
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isValidUNCEmail, UNC_EMAIL_ERROR } from '@/lib/auth/types'

/**
 * Result type for auth actions.
 */
export interface AuthActionResult {
    success: boolean
    error?: string
}

/**
 * Send a magic link to the user's email address.
 * Only accepts @unc.edu and @ad.unc.edu email addresses.
 */
export async function sendMagicLink(formData: FormData): Promise<AuthActionResult> {
    const email = formData.get('email')?.toString().toLowerCase().trim()

    // Server-side email validation (security layer)
    if (!email) {
        return { success: false, error: 'Email is required' }
    }

    if (!isValidUNCEmail(email)) {
        return { success: false, error: UNC_EMAIL_ERROR }
    }

    const supabase = await createClient()

    // Get the callback URL based on environment
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectTo = `${siteUrl}/auth/callback`

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: redirectTo,
        },
    })

    if (error) {
        console.error('Magic link error:', error)

        // Handle specific error cases
        if (error.message.includes('rate limit')) {
            return { success: false, error: 'Too many attempts. Please wait a few minutes and try again.' }
        }

        if (error.message.includes('invalid')) {
            return { success: false, error: 'Invalid email address. Please check and try again.' }
        }

        return { success: false, error: 'Failed to send magic link. Please try again.' }
    }

    return { success: true }
}

/**
 * Sign out the current user (server action).
 */
export async function signOutAction(): Promise<void> {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}
