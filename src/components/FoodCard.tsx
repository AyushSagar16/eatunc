'use client'

import React from 'react'
import { MasterFoodItem } from '@/lib/api'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface FoodCardProps {
    item: MasterFoodItem
    station: string
    reason?: string
    mealPeriod: string
    searchQuery?: string
    onClick: () => void
}

// Highlight matching text in food names
function highlightText(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))

    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/50 text-zinc-900 dark:text-zinc-100 rounded px-0.5">
                {part}
            </mark>
        ) : (
            <span key={i}>{part}</span>
        )
    )
}

export default function FoodCard({ item, station, reason, mealPeriod, searchQuery = '', onClick }: FoodCardProps) {
    const {
        food_name,
        calories_kcal,
        protein_g,
        fat_g,
        carbohydrates_g,
    } = item

    // Color-coded reason badges based on filter type
    const getReasonStyle = (reasonText: string) => {
        const lower = reasonText.toLowerCase()
        if (lower.includes('protein')) {
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
        }
        if (lower.includes('calorie') || lower.includes('low cal')) {
            return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400'
        }
        if (lower.includes('fat')) {
            return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400'
        }
        if (lower.includes('carbohydrate') || lower.includes('carb')) {
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-500'
        }
        // Default green for combined
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    }

    return (
        <motion.div
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick?.()
                }
            }}
            role="button"
            tabIndex={0}
            aria-label={`${food_name}. ${calories_kcal} calories, ${protein_g}g protein, ${fat_g}g fat, ${carbohydrates_g}g carbs${reason ? `. Tagged as ${reason}` : ''}. Click for details.`}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{
                scale: 1.03,
                y: -6,
            }}
            whileTap={{ scale: 0.98 }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                layout: { type: 'spring', stiffness: 300, damping: 30 },
            }}
            className={cn(
                'group relative flex flex-col cursor-pointer overflow-hidden',
                'rounded-2xl border border-zinc-200/80 dark:border-zinc-800',
                'bg-white dark:bg-zinc-900/60',
                'p-5 sm:p-6',
                'h-full min-h-[180px]',
                'transition-shadow duration-300',
                'hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50',
                'hover:border-zinc-300 dark:hover:border-zinc-700',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
            )}
        >
            {/* Animated glow effect */}
            <motion.div
                className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/10 blur-3xl pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 0.4, scale: 1.2 }}
                transition={{ duration: 0.4 }}
            />

            <div className="flex flex-col gap-3 flex-1 relative z-10">
                {/* Reason badge - color-coded */}
                {reason && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, type: 'spring', stiffness: 300 }}
                        className="flex flex-wrap gap-1.5"
                    >
                        {reason.split('+').map((r, i) => (
                            <span
                                key={i}
                                className={cn(
                                    'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider',
                                    getReasonStyle(r.trim())
                                )}
                            >
                                {r.trim()}
                            </span>
                        ))}
                    </motion.div>
                )}

                {/* Food name - larger, prominent, with search highlighting */}
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight line-clamp-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                    {highlightText(food_name || 'Unknown Item', searchQuery)}
                </h3>

                {/* Spacer to push nutrition to bottom */}
                <div className="flex-1" />

                {/* Compact nutritional info row */}
                <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] font-medium">
                    <span className="text-zinc-700 dark:text-zinc-300">{protein_g ?? 0}g</span>
                    <span className="text-zinc-400 dark:text-zinc-600">protein</span>
                    <span className="text-zinc-300 dark:text-zinc-700 mx-0.5">|</span>
                    <span className="text-zinc-700 dark:text-zinc-300">{fat_g ?? 0}g</span>
                    <span className="text-zinc-400 dark:text-zinc-600">fat</span>
                    <span className="text-zinc-300 dark:text-zinc-700 mx-0.5">|</span>
                    <span className="text-zinc-700 dark:text-zinc-300">{carbohydrates_g ?? 0}g</span>
                    <span className="text-zinc-400 dark:text-zinc-600">carbs</span>
                </div>

                {/* Calories - prominent with gradient */}
                <motion.div
                    className="flex items-baseline gap-1.5 mt-1"
                    initial={{ opacity: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                >
                    <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                        {calories_kcal ?? 0}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold tracking-wide">
                        kcal
                    </span>
                </motion.div>
            </div>
        </motion.div>
    )
}
