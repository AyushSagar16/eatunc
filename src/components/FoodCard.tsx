'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MasterFoodItem } from '@/lib/api'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { DIETARY_ICON_MAP, parseDietaryPreferences } from '@/components/icons/DietaryIcons'

// Mapping of dietary preference keys to display names
const DIETARY_DISPLAY_NAMES: Record<string, string> = {
    'vegan': 'Vegan',
    'vegetarian': 'Vegetarian',
    'made without gluten': 'Gluten Free',
    'halal': 'Halal',
    'local': 'Local',
    'organic': 'Organic',
    'smart choice': 'Smart Choice',
    'sustainable seafood': 'Sustainable Seafood',
    'coolfood': 'Coolfood',
}

interface FoodCardProps {
    item: MasterFoodItem
    station: string
    reason?: string
    mealPeriod: string
    searchQuery?: string
    onClick: () => void
    containsAllergen?: boolean
    matchesDietaryFilter?: boolean
}

// PERFORMANCE: Move pure function outside component to prevent recreation on every render
// Highlight matching text in food names
function highlightText(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'gi'))

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

// PERFORMANCE: Move pure function outside component to prevent recreation on every render
// Color-coded reason badges based on filter type
function getReasonStyle(reasonText: string): string {
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

// PERFORMANCE: Wrap with React.memo to prevent re-renders when props haven't changed
// This is especially important since FoodCard is rendered many times in lists
const FoodCard = React.memo(function FoodCard({ item, station, reason, mealPeriod, searchQuery = '', onClick, containsAllergen = false, matchesDietaryFilter = false }: FoodCardProps) {
    const {
        food_name,
        calories_kcal,
        protein_g,
        fat_g,
        carbohydrates_g,
    } = item

    const dietaryPrefs = parseDietaryPreferences(item.dietary_preferences)

    // State for card hover (for z-index)
    const [isHovered, setIsHovered] = useState(false)

    // State for responsive icon display (2 on mobile, 3 on desktop)
    const [isMobile, setIsMobile] = useState(false)

    // Detect mobile breakpoint
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // State and refs for dietary preferences popover
    const [showDietaryPopover, setShowDietaryPopover] = useState(false)
    const popoverRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    // State for individual icon tooltips
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

    // Close popover and tooltips when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                showDietaryPopover &&
                popoverRef.current &&
                triggerRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setShowDietaryPopover(false)
            }
            // Close tooltip if clicking outside
            setActiveTooltip(null)
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showDietaryPopover])

    // Maximum icons to show: 2 on mobile, 3 on desktop
    const VISIBLE_ICONS_LIMIT = isMobile ? 2 : 3
    const hiddenCount = dietaryPrefs.length - VISIBLE_ICONS_LIMIT

    return (
        <motion.div
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick?.()
                }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false)
                setActiveTooltip(null)
            }}
            role="button"
            tabIndex={0}
            aria-label={`${food_name}. ${calories_kcal} calories, ${protein_g}g protein, ${fat_g}g fat, ${carbohydrates_g}g carbs${reason ? `. Tagged as ${reason}` : ''}. Click for details.`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            whileHover={{
                scale: 1.01,
                y: -2,
            }}
            whileTap={{ scale: 0.99 }}
            transition={{
                duration: 0.2,
                ease: 'easeOut',
            }}
            style={{ zIndex: isHovered || showDietaryPopover ? 20 : 1 }}
            className={cn(
                'group relative flex flex-col cursor-pointer',
                'rounded-2xl',
                containsAllergen
                    ? 'border-2 border-dashed border-zinc-300 dark:border-zinc-700 opacity-60'
                    : matchesDietaryFilter
                        ? 'border-2 border-green-400 dark:border-green-600 bg-green-50/50 dark:bg-green-900/20'
                        : 'border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60',
                !containsAllergen && !matchesDietaryFilter && 'bg-white dark:bg-zinc-900/60',
                'p-5 sm:p-6',
                'h-full min-h-[140px]',
                'transition-shadow duration-300',
                containsAllergen
                    ? ''
                    : 'hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
            )}
        >
            {/* Animated glow effect - hidden on low-capability devices via menu-glow-effect */}
            <motion.div
                className="menu-glow-effect absolute -right-12 -top-12 h-28 w-28 rounded-full bg-gradient-to-br from-blue-400/10 to-purple-400/5 blur-3xl pointer-events-none"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.3 }}
                transition={{ duration: 0.3 }}
            />

            <div className="flex flex-col gap-3 flex-1 relative z-10">
                {/* Reason badge - color-coded */}
                {reason && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-wrap gap-1.5"
                    >
                        {/* PERFORMANCE: Use stable keys (reason text) instead of index */}
                        {reason.split('+').map((r) => (
                            <span
                                key={r.trim()}
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
                <h3 className={cn(
                    'text-lg sm:text-xl font-bold tracking-tight leading-tight line-clamp-2 transition-colors',
                    containsAllergen
                        ? 'text-zinc-400 dark:text-zinc-600'
                        : 'text-zinc-900 dark:text-zinc-50 group-hover:text-zinc-700 dark:group-hover:text-zinc-200'
                )}>
                    {highlightText(food_name || 'Unknown Item', searchQuery)}
                </h3>

                {/* Spacer to push nutrition to bottom */}
                <div className="flex-1" />

                {/* Compact nutritional info row */}


                {/* Calories - prominent with gradient */}
                <motion.div
                    className="flex items-baseline gap-1.5 mt-1"
                    initial={{ opacity: 0.8 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <span className={cn(
                        'text-2xl sm:text-3xl font-black',
                        containsAllergen
                            ? 'text-zinc-300 dark:text-zinc-700'
                            : 'bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent'
                    )}>
                        {calories_kcal ?? 0}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold tracking-wide">
                        kcal
                    </span>
                </motion.div>
            </div>

            {/* Dietary Preference Icons - Bottom Right */}
            {/* Mobile: vertical layout with 2 visible, Desktop: horizontal with 3 visible */}
            {dietaryPrefs.length > 0 && (
                <div className={`absolute bottom-3 right-3 flex ${isMobile ? 'flex-col items-end' : 'flex-row items-center'} gap-1`}>
                    {dietaryPrefs.slice(0, VISIBLE_ICONS_LIMIT).map((pref) => {
                        const IconComponent = DIETARY_ICON_MAP[pref]
                        if (!IconComponent) return null

                        return (
                            <div
                                key={pref}
                                className="relative"
                            >
                                <div
                                    className="menu-dietary-icon w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                                    onMouseEnter={() => setActiveTooltip(pref)}
                                    onMouseLeave={() => setActiveTooltip(null)}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveTooltip(activeTooltip === pref ? null : pref)
                                    }}
                                >
                                    <IconComponent className="w-4 h-4" />
                                </div>
                                {/* Tooltip */}
                                <AnimatePresence>
                                    {activeTooltip === pref && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            transition={{ duration: 0.1 }}
                                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-md whitespace-nowrap z-50 pointer-events-none"
                                        >
                                            {DIETARY_DISPLAY_NAMES[pref] || pref}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                    {/* +n button - show when there are hidden icons */}
                    {hiddenCount > 0 && (
                        <div className="relative">
                            {/* Larger touch target wrapper on mobile */}
                            <button
                                ref={triggerRef}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setShowDietaryPopover(!showDietaryPopover)
                                }}
                                onTouchEnd={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setShowDietaryPopover(!showDietaryPopover)
                                }}
                                className={`${isMobile ? 'w-11 h-11 -m-2' : 'w-6 h-6'} flex items-center justify-center cursor-pointer`}
                                aria-label={`Show ${hiddenCount} more dietary preferences`}
                            >
                                {/* Visual button - always 24x24, uses menu-dietary-icon for iOS fallback */}
                                <div className="menu-dietary-icon w-6 h-6 rounded-full flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                                        +{hiddenCount}
                                    </span>
                                </div>
                            </button>

                            {/* Popover with all dietary preferences */}
                            <AnimatePresence>
                                {showDietaryPopover && (
                                    <motion.div
                                        ref={popoverRef}
                                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-3 z-50"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                                            Dietary Preferences
                                        </h4>
                                        <div className="flex flex-col gap-2">
                                            {dietaryPrefs.map((pref) => {
                                                const IconComponent = DIETARY_ICON_MAP[pref]
                                                if (!IconComponent) return null

                                                return (
                                                    <div
                                                        key={pref}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                            <IconComponent className="w-3.5 h-3.5" />
                                                        </div>
                                                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                                            {DIETARY_DISPLAY_NAMES[pref] || pref}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    )
})

export default FoodCard
