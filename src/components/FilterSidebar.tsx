'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Filter, X, Check, Trash2 } from 'lucide-react'
import type { FilterOption } from '@/lib/types'

interface FilterSidebarProps {
    activeFilters: FilterOption[]
    onToggleFilter: (filter: FilterOption) => void
    onClearAll: () => void
    className?: string
}

interface FilterItem {
    id: FilterOption
    label: string
    description: string
    icon: React.ReactNode
}

const filters: FilterItem[] = [
    {
        id: 'protein',
        label: 'High Protein',
        description: '20g+ protein per serving',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
            </svg>
        ),
    },
    {
        id: 'calories',
        label: 'Low Calorie',
        description: 'Under 350 kcal',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
    },
    {
        id: 'fat',
        label: 'Low Fat',
        description: 'Under 8g fat',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
            </svg>
        ),
    },
    {
        id: 'balanced',
        label: 'Balanced',
        description: 'Optimal macro ratios',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v18M3 12h18" />
                <circle cx="12" cy="12" r="9" />
            </svg>
        ),
    },
]

/**
 * FilterSidebar - Collapsible filter panel with Aceternity-style animations
 * - Desktop: Collapsible sidebar on hover
 * - Mobile: Bottom drawer overlay
 * - Multi-select toggle filters
 * - Active filter count badge
 * - Clear All button
 */
export default function FilterSidebar({
    activeFilters,
    onToggleFilter,
    onClearAll,
    className,
}: FilterSidebarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [announcement, setAnnouncement] = useState('')

    const activeCount = activeFilters.length

    // Announce filter changes to screen readers
    const announceFilterChange = (filterLabel: string, isActive: boolean) => {
        setAnnouncement(`${filterLabel} filter ${isActive ? 'removed' : 'applied'}`)
        // Clear after announcement
        setTimeout(() => setAnnouncement(''), 1000)
    }

    const handleToggleFilter = (filter: FilterItem) => {
        const isActive = activeFilters.includes(filter.id)
        announceFilterChange(filter.label, isActive)
        onToggleFilter(filter.id)
    }

    const handleClearAll = () => {
        setAnnouncement('All filters cleared')
        setTimeout(() => setAnnouncement(''), 1000)
        onClearAll()
    }
    return (
        <>
            {/* Screen reader announcements */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {announcement}
            </div>

            {/* Desktop Sidebar */}
            <motion.aside
                role="region"
                aria-label="Nutrition filters"
                className={cn(
                    'hidden md:flex flex-col h-fit sticky top-24 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg overflow-hidden',
                    className
                )}
                animate={{
                    width: isOpen ? 280 : 60,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="relative flex-shrink-0">
                        <Filter className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        {activeCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                            >
                                {activeCount}
                            </motion.div>
                        )}
                    </div>
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center justify-between flex-1"
                            >
                                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                    Filters
                                </span>
                                {activeCount > 0 && (
                                    <button
                                        onClick={onClearAll}
                                        className="text-xs text-zinc-500 hover:text-red-500 transition-colors flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Clear
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Filter List */}
                <div className="p-2 flex flex-col gap-1">
                    {filters.map((filter) => {
                        const isActive = activeFilters.includes(filter.id)
                        return (
                            <motion.button
                                key={filter.id}
                                onClick={() => handleToggleFilter(filter)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        handleToggleFilter(filter)
                                    }
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                role="checkbox"
                                aria-checked={isActive}
                                aria-label={`${filter.label}: ${filter.description}${isActive ? ', currently selected' : ''}`}
                                tabIndex={0}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-xl transition-all',
                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                                    isActive
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-transparent'
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                                        isActive
                                            ? 'bg-blue-100 dark:bg-blue-800'
                                            : 'bg-zinc-100 dark:bg-zinc-800'
                                    )}
                                >
                                    {isActive ? (
                                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                    ) : (
                                        <span className="text-zinc-500 dark:text-zinc-400">
                                            {filter.icon}
                                        </span>
                                    )}
                                </div>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="flex flex-col items-start text-left"
                                        >
                                            <span className="text-sm font-semibold">{filter.label}</span>
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                                {filter.description}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        )
                    })}
                </div>
            </motion.aside>

            {/* Mobile Floating Button */}
            <motion.button
                onClick={() => setIsMobileOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 min-w-[56px] min-h-[56px] bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 touch-manipulation"
            >
                <Filter className="w-6 h-6" />
                {activeCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-white text-blue-600 text-xs font-bold rounded-full flex items-center justify-center border-2 border-blue-600"
                    >
                        {activeCount}
                    </motion.div>
                )}
            </motion.button>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-3xl z-[101] max-h-[80vh] overflow-auto"
                        >
                            {/* Drawer Handle */}
                            <div className="flex justify-center pt-3">
                                <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <Filter className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                    <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                                        Filters
                                    </span>
                                    {activeCount > 0 && (
                                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                                            {activeCount} active
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {activeCount > 0 && (
                                        <button
                                            onClick={onClearAll}
                                            className="min-h-[44px] min-w-[44px] px-3 text-sm text-red-500 font-medium flex items-center gap-1 rounded-lg active:bg-red-50 dark:active:bg-red-900/20 touch-manipulation"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Clear All
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsMobileOpen(false)}
                                        className="min-h-[44px] min-w-[44px] p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 rounded-lg transition-colors touch-manipulation"
                                    >
                                        <X className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Filter Grid */}
                            <div className="p-4 grid grid-cols-2 gap-3">
                                {filters.map((filter) => {
                                    const isActive = activeFilters.includes(filter.id)
                                    return (
                                        <motion.button
                                            key={filter.id}
                                            onClick={() => onToggleFilter(filter.id)}
                                            whileTap={{ scale: 0.95 }}
                                            className={cn(
                                                'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all',
                                                isActive
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                                                    : 'bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'w-12 h-12 rounded-xl flex items-center justify-center',
                                                    isActive
                                                        ? 'bg-blue-100 dark:bg-blue-800'
                                                        : 'bg-zinc-100 dark:bg-zinc-700'
                                                )}
                                            >
                                                {isActive ? (
                                                    <Check className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                                                ) : (
                                                    <span className="text-zinc-500 dark:text-zinc-400">
                                                        {filter.icon}
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className={cn(
                                                    'text-sm font-bold',
                                                    isActive
                                                        ? 'text-blue-700 dark:text-blue-300'
                                                        : 'text-zinc-700 dark:text-zinc-300'
                                                )}
                                            >
                                                {filter.label}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                                {filter.description}
                                            </span>
                                        </motion.button>
                                    )
                                })}
                            </div>

                            {/* Apply Button (For UX - filters apply immediately but this closes drawer) */}
                            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-zinc-200 dark:border-zinc-800">
                                <button
                                    onClick={() => setIsMobileOpen(false)}
                                    className="w-full py-4 min-h-[52px] bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
