/**
 * Auth Types
 * 
 * Type definitions for authentication-related data structures.
 */

import { User, Session } from '@supabase/supabase-js'

/**
 * User profile data stored in the profiles table.
 */
export interface UserProfile {
    id: string
    email: string
    daily_calories_target: number
    daily_protein_target: number
    daily_carbs_target: number
    daily_fat_target: number
    dietary_preferences: string[]
    allergies: string[]
    onboarding_completed: boolean
    timezone: string
    created_at: string
    updated_at: string
}

/**
 * Auth context state shape.
 */
export interface AuthState {
    user: User | null
    profile: UserProfile | null
    session: Session | null
    isLoading: boolean
    isAuthenticated: boolean
}

/**
 * Auth context actions.
 */
export interface AuthActions {
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

/**
 * Combined auth context type.
 */
export type AuthContextType = AuthState & AuthActions

/**
 * Validates that an email is a valid UNC email address.
 * Only @unc.edu and @ad.unc.edu domains are allowed.
 */
export function isValidUNCEmail(email: string): boolean {
    if (!email) return false
    const normalizedEmail = email.toLowerCase().trim()
    return normalizedEmail.endsWith('@unc.edu') || normalizedEmail.endsWith('@ad.unc.edu')
}

/**
 * UNC email validation error message.
 */
export const UNC_EMAIL_ERROR = 'Please use your UNC email address (@unc.edu or @ad.unc.edu)'
