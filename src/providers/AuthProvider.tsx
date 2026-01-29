'use client'

/**
 * Auth Provider
 * 
 * Provides authentication state and actions to the application.
 * Handles session management, auth state changes, and profile fetching.
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { AuthContextType, UserProfile } from '@/lib/auth/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
    initialSession?: Session | null
}

export function AuthProvider({ children, initialSession = null }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
    const [session, setSession] = useState<Session | null>(initialSession)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(!initialSession)

    const supabase = useMemo(() => createClient(), [])

    /**
     * Fetch user profile from the profiles table.
     */
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                // Profile may not exist yet for new users
                if (error.code === 'PGRST116') {
                    console.log('Profile not found for user, may need onboarding')
                    return null
                }
                console.error('Error fetching profile:', error)
                return null
            }

            return data as UserProfile
        } catch (err) {
            console.error('Error fetching profile:', err)
            return null
        }
    }, [supabase])

    /**
     * Refresh the user profile from the database.
     */
    const refreshProfile = useCallback(async () => {
        if (!user) return
        const profileData = await fetchProfile(user.id)
        setProfile(profileData)
    }, [user, fetchProfile])

    /**
     * Sign out the current user.
     */
    const signOut = useCallback(async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('Error signing out:', error)
                throw error
            }
            setUser(null)
            setSession(null)
            setProfile(null)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    /**
     * Initialize auth state and set up auth state change listener.
     */
    useEffect(() => {
        // Get initial session if not provided
        const initializeAuth = async () => {
            if (initialSession) {
                // Already have initial session from server
                if (initialSession.user) {
                    const profileData = await fetchProfile(initialSession.user.id)
                    setProfile(profileData)
                }
                setIsLoading(false)
                return
            }

            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession()

                if (currentSession?.user) {
                    setUser(currentSession.user)
                    setSession(currentSession)
                    const profileData = await fetchProfile(currentSession.user.id)
                    setProfile(profileData)
                }
            } catch (err) {
                console.error('Error initializing auth:', err)
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, currentSession: Session | null) => {
                setSession(currentSession)
                setUser(currentSession?.user ?? null)

                if (event === 'SIGNED_IN' && currentSession?.user) {
                    const profileData = await fetchProfile(currentSession.user.id)
                    setProfile(profileData)
                } else if (event === 'SIGNED_OUT') {
                    setProfile(null)
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, fetchProfile, initialSession])

    const value: AuthContextType = useMemo(() => ({
        user,
        profile,
        session,
        isLoading,
        isAuthenticated: !!user,
        signOut,
        refreshProfile,
    }), [user, profile, session, isLoading, signOut, refreshProfile])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

/**
 * Hook to access auth context.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
