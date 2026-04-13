'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export interface UserProfile {
    id: string
    email: string
    displayName: string
    calorieGoal: number
    proteinGoal: number
    carbsGoal: number
    fatGoal: number
    createdAt: string
}

interface AuthContextType {
    user: UserProfile | null
    isLoading: boolean
    signIn: (email: string, password: string) => Promise<{ error?: string }>
    signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>
    signOut: () => void
    updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'calorieGoal' | 'proteinGoal' | 'carbsGoal' | 'fatGoal'>>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USERS_KEY = 'eatunc-users'
const SESSION_KEY = 'eatunc-session'

interface StoredUser {
    id: string
    email: string
    passwordHash: string
    displayName: string
    calorieGoal: number
    proteinGoal: number
    carbsGoal: number
    fatGoal: number
    createdAt: string
}

function getStoredUsers(): StoredUser[] {
    if (typeof window === 'undefined') return []
    try {
        const data = localStorage.getItem(USERS_KEY)
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

function setStoredUsers(users: StoredUser[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Simple hash for demo purposes (not cryptographically secure)
async function simpleHash(str: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function toUserProfile(stored: StoredUser): UserProfile {
    return {
        id: stored.id,
        email: stored.email,
        displayName: stored.displayName,
        calorieGoal: stored.calorieGoal,
        proteinGoal: stored.proteinGoal,
        carbsGoal: stored.carbsGoal,
        fatGoal: stored.fatGoal,
        createdAt: stored.createdAt,
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(() => {
        if (typeof window === 'undefined') return null
        try {
            const sessionId = localStorage.getItem(SESSION_KEY)
            if (sessionId) {
                const users = getStoredUsers()
                const found = users.find(u => u.id === sessionId)
                if (found) return toUserProfile(found)
            }
        } catch {
            // ignore
        }
        return null
    })
    const isLoading = false

    const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
        const users = getStoredUsers()
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase())
        if (!found) {
            return { error: 'No account found with that email. Please sign up first.' }
        }
        const hash = await simpleHash(password)
        if (found.passwordHash !== hash) {
            return { error: 'Incorrect password. Please try again.' }
        }
        const profile = toUserProfile(found)
        setUser(profile)
        localStorage.setItem(SESSION_KEY, found.id)
        return {}
    }, [])

    const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<{ error?: string }> => {
        const users = getStoredUsers()
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { error: 'An account with that email already exists.' }
        }
        if (password.length < 6) {
            return { error: 'Password must be at least 6 characters.' }
        }
        const hash = await simpleHash(password)
        const newUser: StoredUser = {
            id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            email: email.toLowerCase(),
            passwordHash: hash,
            displayName,
            calorieGoal: 2000,
            proteinGoal: 150,
            carbsGoal: 250,
            fatGoal: 65,
            createdAt: new Date().toISOString(),
        }
        users.push(newUser)
        setStoredUsers(users)
        const profile = toUserProfile(newUser)
        setUser(profile)
        localStorage.setItem(SESSION_KEY, newUser.id)
        return {}
    }, [])

    const signOut = useCallback(() => {
        setUser(null)
        localStorage.removeItem(SESSION_KEY)
    }, [])

    const updateProfile = useCallback((updates: Partial<Pick<UserProfile, 'displayName' | 'calorieGoal' | 'proteinGoal' | 'carbsGoal' | 'fatGoal'>>) => {
        setUser(prev => {
            if (!prev) return prev
            const updated = { ...prev, ...updates }
            // Also update in stored users
            const users = getStoredUsers()
            const idx = users.findIndex(u => u.id === prev.id)
            if (idx >= 0) {
                users[idx] = { ...users[idx], ...updates }
                setStoredUsers(users)
            }
            return updated
        })
    }, [])

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
