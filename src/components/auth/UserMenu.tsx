'use client'

/**
 * UserMenu Component
 * 
 * Dropdown menu for authenticated users showing profile info and actions.
 */

import { useState, useRef, useEffect } from 'react'
import { IconUser, IconSettings, IconLogout, IconChevronDown, IconLayoutDashboard } from '@tabler/icons-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
    const { user, signOut, isLoading } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close menu on escape key
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [])

    if (isLoading || !user) {
        return null
    }

    // Get display email (truncate if too long)
    const email = user.email || ''
    const displayEmail = email.length > 24 ? email.slice(0, 21) + '...' : email

    const handleSignOut = async () => {
        setIsOpen(false)
        await signOut()
    }

    return (
        <div ref={menuRef} className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 px-3 py-2 rounded-xl
          bg-white/5 hover:bg-white/10 border border-white/10
          transition-all duration-200
          ${isOpen ? 'bg-white/10' : ''}
        `}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <div className="w-8 h-8 bg-blue-600/30 rounded-full flex items-center justify-center">
                    <IconUser className="w-4 h-4 text-blue-400" />
                </div>
                <span className="hidden sm:block text-sm text-gray-300 max-w-[150px] truncate">
                    {displayEmail}
                </span>
                <IconChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-56 py-2 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50"
                    role="menu"
                    aria-orientation="vertical"
                >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm text-white font-medium truncate">{email}</p>
                        <p className="text-xs text-gray-500 mt-0.5">UNC Student</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        <Link
                            href="/dashboard"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                            role="menuitem"
                        >
                            <IconLayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                        <Link
                            href="/dashboard/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                            role="menuitem"
                        >
                            <IconSettings className="w-4 h-4" />
                            Settings
                        </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="pt-1 border-t border-white/10">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            role="menuitem"
                        >
                            <IconLogout className="w-4 h-4" />
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
