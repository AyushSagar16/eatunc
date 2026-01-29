'use client'

/**
 * useAuth Hook
 * 
 * Re-exports the useAuth hook from AuthProvider for convenience.
 * Also provides additional auth-related utility hooks.
 */

export { useAuth } from '@/providers/AuthProvider'

import { useMemo } from 'react'
import { useAuth } from '@/providers/AuthProvider'

/**
 * Hook to check if the user needs to complete onboarding.
 */
export function useNeedsOnboarding(): boolean {
    const { isAuthenticated, profile, isLoading } = useAuth()

    return useMemo(() => {
        if (isLoading) return false
        if (!isAuthenticated) return false
        return !profile?.onboarding_completed
    }, [isAuthenticated, profile, isLoading])
}

/**
 * Hook to get the current user's macro targets.
 */
export function useMacroTargets() {
    const { profile } = useAuth()

    return useMemo(() => {
        if (!profile) {
            return {
                calories: 2000,
                protein: 50,
                carbs: 250,
                fat: 65,
            }
        }

        return {
            calories: profile.daily_calories_target,
            protein: profile.daily_protein_target,
            carbs: profile.daily_carbs_target,
            fat: profile.daily_fat_target,
        }
    }, [profile])
}

/**
 * Hook to get the current user's dietary preferences and allergies.
 */
export function useDietaryFilters() {
    const { profile } = useAuth()

    return useMemo(() => ({
        preferences: profile?.dietary_preferences ?? [],
        allergies: profile?.allergies ?? [],
    }), [profile])
}
