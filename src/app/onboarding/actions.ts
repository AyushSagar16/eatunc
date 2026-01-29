'use server'

/**
 * Onboarding Actions
 * 
 * Server actions for completing user onboarding.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface OnboardingData {
    userId: string
    calories: number
    protein: number
    carbs: number
    fat: number
    dietaryPreferences: string[]
    allergies: string[]
}

interface OnboardingResult {
    success: boolean
    error?: string
}

/**
 * Complete the onboarding process for a user.
 * Updates their profile with macro targets and preferences.
 */
export async function completeOnboarding(data: OnboardingData): Promise<OnboardingResult> {
    try {
        const supabase = await createClient()

        // Verify the user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Not authenticated' }
        }

        // Ensure user can only update their own profile
        if (user.id !== data.userId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Validate inputs
        if (data.calories < 500 || data.calories > 10000) {
            return { success: false, error: 'Calories must be between 500 and 10,000' }
        }
        if (data.protein < 0 || data.protein > 500) {
            return { success: false, error: 'Protein must be between 0 and 500g' }
        }
        if (data.carbs < 0 || data.carbs > 1000) {
            return { success: false, error: 'Carbs must be between 0 and 1,000g' }
        }
        if (data.fat < 0 || data.fat > 500) {
            return { success: false, error: 'Fat must be between 0 and 500g' }
        }

        // Update profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                daily_calories_target: Math.round(data.calories),
                daily_protein_target: Math.round(data.protein),
                daily_carbs_target: Math.round(data.carbs),
                daily_fat_target: Math.round(data.fat),
                dietary_preferences: data.dietaryPreferences,
                allergies: data.allergies,
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('Error updating profile:', updateError)
            return { success: false, error: 'Failed to save preferences' }
        }

        // Revalidate dashboard page
        revalidatePath('/dashboard')

        return { success: true }
    } catch (error) {
        console.error('Onboarding error:', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}
