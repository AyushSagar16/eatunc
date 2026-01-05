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
        id: 'carbs',
        label: 'Low Carbohydrate',
        description: 'Under 15g carbs',
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
    const [isModalOpen, setIsModalOpen] = useState(false)
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

            {/* Floating Filter Button - Visible on all screen sizes */}
            <motion.button
                data-tutorial-target="filter-button"
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Open filters"
                className="fixed bottom-6 right-6 z-50 w-14 h-14 min-w-[56px] min-h-[56px] bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-all touch-manipulation"
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

            {/* Right-Side Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        />

                        {/* Right-Side Modal Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-96 sm:max-w-md bg-white dark:bg-zinc-900 z-[101] overflow-auto shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                        <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-xl text-zinc-900 dark:text-zinc-100">
                                            Filters
                                        </h2>
                                        {activeCount > 0 && (
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {activeCount} active filter{activeCount !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="min-h-[44px] min-w-[44px] p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 rounded-xl transition-colors touch-manipulation"
                                    aria-label="Close filters"
                                >
                                    <X className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                                </button>
                            </div>

                            {/* Filter List */}
                            <div className="p-6 flex flex-col gap-3">
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
                                                'flex items-center gap-4 p-4 rounded-2xl transition-all min-h-[72px]',
                                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                                                isActive
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500 dark:border-blue-600'
                                                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
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
                                            <div className="flex flex-col items-start text-left flex-1">
                                                <span className="text-base font-bold">{filter.label}</span>
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    {filter.description}
                                                </span>
                                            </div>
                                        </motion.button>
                                    )
                                })}
                            </div>


                            {/* Footer Actions */}
                            <div className="p-6 pt-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col gap-3 sticky bottom-0 bg-gradient-to-t from-white dark:from-zinc-900 via-white dark:via-zinc-900 to-transparent pt-4">
                                {activeCount > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        className="w-full py-3 min-h-[52px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-base rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 dark:active:bg-zinc-600 transition-colors touch-manipulation flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Clear All Filters
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full py-4 min-h-[52px] bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation shadow-lg"
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
