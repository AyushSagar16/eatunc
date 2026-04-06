'use client'

import { LayoutGrid, List } from 'lucide-react'
import { motion } from 'motion/react'

import { cn } from '@/lib/utils'
import type { MenuViewMode } from '@/lib/types'

interface MenuViewToggleProps {
    viewMode: MenuViewMode
    onViewModeChange: (mode: MenuViewMode) => void
}

const VIEW_OPTIONS = [
    {
        value: 'compact' as const,
        label: 'Compact',
        icon: List,
    },
    {
        value: 'regular' as const,
        label: 'Cards',
        icon: LayoutGrid,
    },
]

export default function MenuViewToggle({ viewMode, onViewModeChange }: MenuViewToggleProps) {
    return (
        <div
            className="inline-grid h-14 grid-cols-2 rounded-2xl border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-200/20 sm:h-auto sm:rounded-xl sm:shadow-none dark:border-zinc-800 dark:bg-zinc-900"
            role="group"
            aria-label="Menu view mode"
        >
            {VIEW_OPTIONS.map(({ value, label, icon: Icon }) => {
                const isActive = viewMode === value

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onViewModeChange(value)}
                        aria-pressed={isActive}
                        aria-label={`Switch to ${label.toLowerCase()} view`}
                        className={cn(
                            'relative flex min-w-[3rem] items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition-colors sm:min-w-[6.75rem] sm:justify-start sm:gap-2 sm:px-3.5 sm:py-1.5',
                            isActive
                                ? 'text-zinc-900 dark:text-zinc-50'
                                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                        )}
                    >
                        {isActive && (
                            <motion.span
                                layoutId="menu-view-mode-indicator"
                                className="absolute inset-0 rounded-xl bg-zinc-100 shadow-sm dark:bg-zinc-800"
                                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{label}</span>
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
