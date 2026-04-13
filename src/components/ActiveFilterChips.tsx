'use client'

import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import type { FilterOption } from '@/lib/types'

interface ActiveFilterChipsProps {
    activeFilters: FilterOption[]
    onRemoveFilter: (filter: FilterOption) => void
    onClearAll: () => void
    itemCount?: number
}

const FILTER_INFO: Record<FilterOption, { label: string; shortLabel: string; color: string }> = {
    protein: { label: 'High Protein', shortLabel: 'High Protein', color: 'bg-emerald-500' },
    calories: { label: 'Low Calorie', shortLabel: 'Low Cal', color: 'bg-sky-500' },
    fat: { label: 'Low Fat', shortLabel: 'Low Fat', color: 'bg-violet-500' },
    carbs: { label: 'Low Carbohydrate', shortLabel: 'Low Carb', color: 'bg-yellow-600' },
    favorites: { label: 'My Favorites', shortLabel: 'Favorites', color: 'bg-rose-500' },
}

/**
 * ActiveFilterChips - Displays active filters as removable chips
 * Features:
 * - Item count badge
 * - Removable filter chips with X button
 * - Color-coded by filter type
 * - Clear All button
 * - Smooth animations
 */
export default function ActiveFilterChips({
    activeFilters,
    onRemoveFilter,
    onClearAll,
    itemCount,
}: ActiveFilterChipsProps) {
    if (activeFilters.length === 0) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-4 py-3 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 overflow-x-auto no-visible-scrollbar"
        >
            {/* Item count */}
            {itemCount !== undefined && (
                <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 min-h-[44px] bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                        {itemCount}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        items
                    </span>
                </div>
            )}

            <div className="flex-shrink-0 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Active filter label - hidden on mobile */}
            <span className="hidden sm:block flex-shrink-0 text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wide">
                Filters:
            </span>

            {/* Filter chips - horizontally scrollable */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <AnimatePresence mode="popLayout">
                    {activeFilters.map((filterId) => {
                        const info = FILTER_INFO[filterId]
                        return (
                            <motion.button
                                key={filterId}
                                layout
                                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                onClick={() => onRemoveFilter(filterId)}
                                className="group flex items-center gap-2 px-3 py-2.5 min-h-[44px] min-w-[44px] rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 active:bg-blue-200 dark:active:bg-blue-800/50 transition-colors border border-blue-200/50 dark:border-blue-800/50"
                            >
                                <div className={`w-2.5 h-2.5 rounded-full ${info.color}`} />
                                <span className="text-sm font-bold whitespace-nowrap">{info.shortLabel}</span>
                                <X className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                        )
                    })}
                </AnimatePresence>
            </div>

            {/* Clear all button */}
            {activeFilters.length > 1 && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClearAll}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-2.5 min-h-[44px] text-xs text-zinc-500 hover:text-red-500 dark:hover:text-red-400 active:text-red-600 font-bold transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear all</span>
                </motion.button>
            )}
        </motion.div>
    )
}
