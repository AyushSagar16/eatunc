'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Tabs } from '@/components/ui/tabs'
import { ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import SearchAndSort, { SortOption } from '@/components/SearchAndSort'
import type { FilterOption } from '@/lib/types'

interface FoodDisplayLayoutProps {
    diningHall: string
    selectedDate: string
    availableDates: string[]
    selectedPeriod: string
    availablePeriods: string[]
    onPeriodChange: (period: string) => void
    onDateChange?: (date: string) => void
    activeFilters?: FilterOption[]
    onRemoveFilter?: (filter: FilterOption) => void
    onClearFilters?: () => void
    itemCount?: number
    searchQuery?: string
    onSearchChange?: (query: string) => void
    sortBy?: SortOption
    onSortChange?: (sort: SortOption) => void
    children?: React.ReactNode
}

/**
 * MealTabsWithScrollIndicators - Horizontal scrollable tabs with dynamic scroll indicators
 */
function MealTabsWithScrollIndicators({
    availablePeriods,
    selectedPeriod,
    onPeriodChange,
    getMealLabel,
}: {
    availablePeriods: string[]
    selectedPeriod: string
    onPeriodChange: (period: string) => void
    getMealLabel: (period: string) => string
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [showLeftFade, setShowLeftFade] = useState(false)
    const [showRightFade, setShowRightFade] = useState(false)

    const checkScroll = useCallback(() => {
        const el = scrollRef.current
        if (!el) return

        const { scrollLeft, scrollWidth, clientWidth } = el
        const isScrollable = scrollWidth > clientWidth

        // Show left fade if scrolled away from start
        setShowLeftFade(isScrollable && scrollLeft > 5)
        // Show right fade if not scrolled to end
        setShowRightFade(isScrollable && scrollLeft < scrollWidth - clientWidth - 5)
    }, [])

    useEffect(() => {
        checkScroll()
        const el = scrollRef.current
        if (el) {
            el.addEventListener('scroll', checkScroll, { passive: true })
            window.addEventListener('resize', checkScroll)
            return () => {
                el.removeEventListener('scroll', checkScroll)
                window.removeEventListener('resize', checkScroll)
            }
        }
    }, [checkScroll, availablePeriods])

    return (
        <div className="relative max-w-full">
            {/* Left scroll fade indicator */}
            <div
                className={`absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-10 rounded-l-2xl sm:hidden transition-opacity duration-200 ${showLeftFade ? 'opacity-100' : 'opacity-0'}`}
            />
            {/* Right scroll fade indicator */}
            <div
                className={`absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-10 rounded-r-2xl sm:hidden transition-opacity duration-200 ${showRightFade ? 'opacity-100' : 'opacity-0'}`}
            />

            <div
                ref={scrollRef}
                className="inline-flex gap-1 p-1 bg-zinc-100 rounded-2xl border border-zinc-200/50 overflow-x-auto no-visible-scrollbar max-w-full"
            >
                {availablePeriods.map((period) => {
                    const isActive = selectedPeriod === period
                    return (
                        <motion.button
                            key={period}
                            onClick={() => onPeriodChange(period)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                                px-4 sm:px-6 py-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap touch-manipulation flex-shrink-0
                                ${isActive
                                    ? 'bg-white text-zinc-900 shadow-md'
                                    : 'text-zinc-500 hover:text-zinc-700 active:bg-white/50'
                                }
                            `}
                        >
                            {getMealLabel(period)}
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * FoodDisplayLayout - Redesigned food display with Aceternity UI components
 * Features:
 * - Sticky header with "EAT UNC" branding and dining hall name
 * - Date selector with navigation arrows
 * - Meal time tabs using Aceternity Tabs component
 * - Main content area for food items
 */
export default function FoodDisplayLayout({
    diningHall,
    selectedDate,
    availableDates,
    selectedPeriod,
    availablePeriods,
    onPeriodChange,
    onDateChange,
    activeFilters = [],
    onRemoveFilter,
    onClearFilters,
    itemCount,
    searchQuery = '',
    onSearchChange,
    sortBy = 'recommended',
    onSortChange,
    children
}: FoodDisplayLayoutProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Format date for display (e.g., "Wed, Jan 7")
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
        })
    }

    // Date navigation handlers
    const currentDate = new Date(selectedDate)

    // Bounds: Stay within a reasonable range (e.g., from the first known date to 14 days in the future)
    const minDate = availableDates.length > 0 ? new Date(availableDates[0]) : new Date()
    const maxDate = availableDates.length > 0 ? new Date(availableDates[availableDates.length - 1]) : new Date()

    // Allow going 7 days before the first menu and 14 days after the last menu
    minDate.setUTCDate(minDate.getUTCDate() - 7)
    maxDate.setUTCDate(maxDate.getUTCDate() + 14)

    const canGoBack = currentDate > minDate
    const canGoForward = currentDate < maxDate

    const handleDateChange = (date: string) => {
        if (onDateChange) {
            onDateChange(date)
        } else {
            const params = new URLSearchParams(searchParams.toString())
            params.set('date', date)
            router.push(`/?${params.toString()}`)
        }
    }

    const handlePrevDate = () => {
        const prev = new Date(selectedDate)
        prev.setUTCDate(prev.getUTCDate() - 1)
        handleDateChange(prev.toISOString().split('T')[0])
    }

    const handleNextDate = () => {
        const next = new Date(selectedDate)
        next.setUTCDate(next.getUTCDate() + 1)
        handleDateChange(next.toISOString().split('T')[0])
    }

    // Capitalize first letter of each word in meal period
    const getMealLabel = (period: string) => {
        return period
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    }

    // Dining hall switcher logic
    const getOppositeDiningHall = () => {
        return diningHall === 'Chase' ? 'Top of Lenoir' : 'Chase'
    }

    const getOppositeHallSlug = () => {
        return diningHall === 'Chase' ? 'lenoir' : 'chase'
    }

    const handleSwitchHall = () => {
        const oppositeSlug = getOppositeHallSlug()
        const params = new URLSearchParams(searchParams.toString())
        params.set('hall', oppositeSlug)
        params.set('date', selectedDate)
        router.push(`/?${params.toString()}`)
    }

    // Meal tabs configuration for Aceternity Tabs
    const mealTabs = availablePeriods.map((period, index) => ({
        title: getMealLabel(period),
        value: period.toLowerCase().replace(/\s+/g, '-'),
        content: (
            <div key={period} className="w-full min-h-[200px]">
                {selectedPeriod === period && children}
            </div>
        ),
    }))

    // Find active tab based on selected period
    const activeTabValue = selectedPeriod.toLowerCase().replace(/\s+/g, '-')

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-zinc-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left: Back Button & Branding */}
                        <div className="flex items-center gap-3">
                            <motion.a
                                href="/"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200 transition-colors touch-manipulation"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="text-sm font-medium hidden sm:inline">Back</span>
                            </motion.a>
                            <div className="h-6 w-px bg-zinc-200" />
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-blue-600 tracking-tight">EAT UNC</span>
                                <span className="text-zinc-300">•</span>
                                <h1 className="text-lg sm:text-xl font-bold text-zinc-900">
                                    {diningHall}
                                </h1>
                            </div>
                        </div>

                        {/* Right: Dining Hall Switcher & Date Selector */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            {/* Dining Hall Switcher Button */}
                            <motion.button
                                onClick={handleSwitchHall}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md hover:shadow-lg touch-manipulation"
                            >
                                <ArrowLeftRight className="w-4 h-4" />
                                <span className="whitespace-nowrap">Switch to {getOppositeDiningHall()}</span>
                            </motion.button>

                            {/* Date Selector */}
                            <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/50">
                                <motion.button
                                    onClick={handlePrevDate}
                                    disabled={!canGoBack}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-3 min-w-[44px] min-h-[44px] rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-white active:bg-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-all touch-manipulation flex items-center justify-center"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </motion.button>

                                <div className="px-3 sm:px-4 min-w-[100px] sm:min-w-[120px] text-center font-bold text-sm text-zinc-900">
                                    {formatDate(selectedDate)}
                                </div>

                                <motion.button
                                    onClick={handleNextDate}
                                    disabled={!canGoForward}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-3 min-w-[44px] min-h-[44px] rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-white active:bg-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-all touch-manipulation flex items-center justify-center"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Meal Time Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
                <div className="flex justify-center mb-6">
                    <MealTabsWithScrollIndicators
                        availablePeriods={availablePeriods}
                        selectedPeriod={selectedPeriod}
                        onPeriodChange={onPeriodChange}
                        getMealLabel={getMealLabel}
                    />
                </div>

                {/* Search and Sort */}
                {onSearchChange && onSortChange && (
                    <div className="mt-4">
                        <SearchAndSort
                            searchQuery={searchQuery}
                            onSearchChange={onSearchChange}
                            sortBy={sortBy}
                            onSortChange={onSortChange}
                        />
                    </div>
                )}


            </div>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
                {children}
            </main>
        </div>
    )
}
