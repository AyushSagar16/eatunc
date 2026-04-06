'use client'

import React from 'react'
import { motion } from 'motion/react'
import { usePostHog } from 'posthog-js/react'

import type { MasterFoodItem } from '@/lib/api'
import { cn } from '@/lib/utils'

interface CompactFoodRowProps {
    item: MasterFoodItem
    station: string
    mealPeriod: string
    searchQuery?: string
    onClick: () => void
    containsAllergen?: boolean
    matchesDietaryFilter?: boolean
}

function highlightText(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'gi'))

    return parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
            <mark
                key={`${part}-${index}`}
                className="rounded bg-yellow-200 px-0.5 text-zinc-900 dark:bg-yellow-800/50 dark:text-zinc-100"
            >
                {part}
            </mark>
        ) : (
            <span key={`${part}-${index}`}>{part}</span>
        )
    )
}

const CompactFoodRow = React.memo(function CompactFoodRow({
    item,
    station,
    mealPeriod,
    searchQuery = '',
    onClick,
    containsAllergen = false,
    matchesDietaryFilter = false,
}: CompactFoodRowProps) {
    const posthog = usePostHog()

    const handleClick = () => {
        posthog.capture('food_card_clicked', {
            food_name: item.food_name,
            recipe_number: item.recipe_number,
            calories: item.calories_kcal,
            protein: item.protein_g,
            station,
            meal_period: mealPeriod,
            has_allergens: !!item.allergens,
            dietary_preferences: item.dietary_preferences || 'none',
            view_mode: 'compact',
        })

        onClick()
    }

    return (
        <motion.button
            type="button"
            onClick={handleClick}
            className={cn(
                'group relative flex min-h-[64px] w-full items-start gap-3 border-b border-zinc-200/80 py-3 pr-1 text-left transition-colors duration-200 dark:border-zinc-800/80',
                containsAllergen
                    ? 'text-zinc-400 opacity-55 dark:text-zinc-600'
                    : 'text-zinc-700 hover:bg-zinc-100/70 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-50',
                'focus:outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
            )}
            whileHover={{ x: containsAllergen ? 0 : 2 }}
            whileTap={{ scale: 0.995 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
        >
            <span
                className={cn(
                    'absolute inset-y-2 left-0 w-[3px] rounded-full bg-transparent transition-colors',
                    matchesDietaryFilter && !containsAllergen && 'bg-emerald-500',
                    containsAllergen && 'bg-zinc-300 dark:bg-zinc-700'
                )}
            />

            <span
                className={cn(
                    'pl-3 pr-2 text-sm font-semibold leading-[1.25] tracking-tight sm:text-[15px]',
                    'line-clamp-2 break-words text-pretty'
                )}
            >
                {highlightText(item.food_name || 'Unknown Item', searchQuery)}
            </span>
        </motion.button>
    )
})
CompactFoodRow.displayName = 'CompactFoodRow'

export default CompactFoodRow
