'use client'

/**
 * AuthButton Component
 * 
 * Sign-in CTA button for unauthenticated users.
 * Shows UserMenu for authenticated users.
 */

import Link from 'next/link'
import { IconLogin } from '@tabler/icons-react'
import { useAuth } from '@/hooks/useAuth'
import { UserMenu } from './UserMenu'

interface AuthButtonProps {
    /** Variant style */
    variant?: 'default' | 'outline' | 'ghost'
    /** Show text label on mobile */
    showTextOnMobile?: boolean
    /** Additional class names */
    className?: string
}

export function AuthButton({
    variant = 'default',
    showTextOnMobile = false,
    className = ''
}: AuthButtonProps) {
    const { isAuthenticated, isLoading } = useAuth()

    // Loading state
    if (isLoading) {
        return (
            <div className={`animate-pulse bg-white/10 rounded-xl h-10 w-24 ${className}`} />
        )
    }

    // Authenticated: show UserMenu
    if (isAuthenticated) {
        return <UserMenu />
    }

    // Unauthenticated: show sign in button
    const baseStyles = 'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200'

    const variantStyles = {
        default: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25',
        outline: 'bg-transparent border border-white/20 hover:bg-white/5 text-white',
        ghost: 'bg-white/5 hover:bg-white/10 text-white',
    }

    return (
        <Link
            href="/auth/login"
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        >
            <IconLogin className="w-4 h-4" />
            <span className={showTextOnMobile ? '' : 'hidden sm:inline'}>
                Sign In
            </span>
        </Link>
    )
}
