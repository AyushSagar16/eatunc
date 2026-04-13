'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { User, LogIn, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { cn } from '@/lib/utils'

export default function AuthNav() {
    const { user, isLoading } = useAuth()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    const isLanding = pathname === '/'

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Don't show on landing page
    if (isLanding) return null

    if (isLoading) {
        return (
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        )
    }

    if (!user) {
        return (
            <Link
                href="/login"
                className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                    'bg-[#4B9CD3] text-white hover:bg-[#3a8bc2] shadow-sm'
                )}
            >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
            </Link>
        )
    }

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all',
                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
                    'hover:bg-zinc-200 dark:hover:bg-zinc-700',
                    isOpen && 'bg-zinc-200 dark:bg-zinc-700'
                )}
            >
                <div className="w-7 h-7 rounded-full bg-[#4B9CD3] flex items-center justify-center text-white text-xs font-bold">
                    {user.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">{user.displayName}</span>
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50"
                    >
                        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {user.displayName}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                {user.email}
                            </p>
                        </div>

                        <div className="p-1">
                            <DropdownLink
                                href="/dashboard"
                                icon={<LayoutDashboard className="w-4 h-4" />}
                                label="Dashboard"
                                active={pathname === '/dashboard'}
                                onClick={() => setIsOpen(false)}
                            />
                            <DropdownLink
                                href="/dashboard"
                                icon={<User className="w-4 h-4" />}
                                label="Profile & Goals"
                                onClick={() => setIsOpen(false)}
                            />
                        </div>

                        <div className="p-1 border-t border-zinc-100 dark:border-zinc-800">
                            <SignOutButton onSignOut={() => setIsOpen(false)} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function DropdownLink({ href, icon, label, active, onClick }: {
    href: string
    icon: React.ReactNode
    label: string
    active?: boolean
    onClick?: () => void
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                    ? 'bg-[#4B9CD3]/10 text-[#4B9CD3] font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
        >
            {icon}
            {label}
        </Link>
    )
}

function SignOutButton({ onSignOut }: { onSignOut: () => void }) {
    const { signOut } = useAuth()

    return (
        <button
            onClick={() => {
                signOut()
                onSignOut()
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
        >
            <LogOut className="w-4 h-4" />
            Sign Out
        </button>
    )
}
