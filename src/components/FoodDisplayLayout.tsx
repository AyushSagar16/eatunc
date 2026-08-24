'use client'

import { useState, useEffect, useRef, useCallback, useMemo, useTransition } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import SearchAndSort, { SortOption } from '@/components/SearchAndSort'
import CalendarPicker from '@/components/CalendarPicker'

// PERFORMANCE: Move pure function outside component to prevent recreation on every render
// Capitalize first letter of each word in meal period
function getMealLabel(period: string): string {
    return period
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

interface FoodDisplayLayoutProps {
    diningHall: string
    selectedDate: string
    availableDates: string[]
    /**
     * Where the date stepper navigates, as `${dateBasePath}/${date}`.
     *
     * The halls are the only pages whose URL can be derived from the hall name, and this
     * component used to do exactly that. A campus venue page reuses the whole layout, so it
     * passes its own base path instead of having its date arrows silently jump to Lenoir.
     */
    dateBasePath?: string
    /** Replaces the hall switcher on pages that are not one of the two halls. */
    switchLink?: { label: string; href: string }
    /**
     * Rendered inside the page chrome, directly under the sticky header.
     *
     * A server-rendered node passed down from a server component, the same way `children` is:
     * the venue pages put their breadcrumbs and open/closed line here, and breadcrumbs have to
     * stay real `<a>` elements in the HTML.
     */
    subHeader?: React.ReactNode
    /**
     * Replaces the date stepper and calendar with a static "Same menu every day" badge. For a
     * menu that has no date — a third-party brand publishes one menu that is the same every
     * day, so arrows to step through would invent a distinction that does not exist.
     */
    hideDateNav?: boolean
    selectedPeriod: string
    availablePeriods: string[]
    onPeriodChange: (period: string) => void
    onDateChange?: (date: string) => void
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
        const frame = requestAnimationFrame(checkScroll)
        const el = scrollRef.current
        if (el) {
            el.addEventListener('scroll', checkScroll, { passive: true })
            window.addEventListener('resize', checkScroll)
            return () => {
                cancelAnimationFrame(frame)
                el.removeEventListener('scroll', checkScroll)
                window.removeEventListener('resize', checkScroll)
            }
        }
        return () => cancelAnimationFrame(frame)
    }, [checkScroll, availablePeriods])

    return (
        <div className="relative max-w-full" data-tutorial-target="meal-tabs">
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
                role="tablist"
                aria-label="Meal period"
                className="inline-flex gap-1 p-1 bg-zinc-100 rounded-2xl border border-zinc-200/50 overflow-x-auto no-visible-scrollbar max-w-full"
            >
                {availablePeriods.map((period) => {
                    const isActive = selectedPeriod === period
                    return (
                        <motion.button
                            type="button"
                            key={period}
                            onClick={() => onPeriodChange(period)}
                            role="tab"
                            aria-selected={isActive}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                                px-4 sm:px-6 py-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap touch-manipulation flex-shrink-0
                                ${isActive
                                    ? 'bg-blue-600 text-white shadow-md'
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
    dateBasePath,
    switchLink,
    subHeader,
    hideDateNav = false,
    selectedPeriod,
    availablePeriods,
    onPeriodChange,
    onDateChange,
    searchQuery = '',
    onSearchChange,
    sortBy = 'recommended',
    onSortChange,
    children
}: FoodDisplayLayoutProps) {
    const router = useRouter()

    // The menu route is force-dynamic and has no loading.tsx (deliberately — a root Suspense
    // boundary is what let invalid URLs stream a 200 before notFound() ran), so without this
    // a date step or hall switch gives no feedback until the server responds.
    const [isNavigating, startNavigation] = useTransition()

    // Calendar picker state
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const datePickerRef = useRef<HTMLDivElement>(null)

    // PERFORMANCE: Memoize date formatting to prevent re-running expensive toLocaleDateString
    // Only recalculate when selectedDate changes
    const formattedDate = useMemo(() => {
        const date = new Date(selectedDate)
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC', // MIGHT HAVE TO CHANGE THIS LATER TO EST
        })
    }, [selectedDate])

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
        } else if (dateBasePath) {
            startNavigation(() => router.push(`${dateBasePath}/${date}`))
        } else {
            // Updated to path-based routing: /{diningHall}/{date}
            const hallSlug = diningHall === 'Chase' ? 'chase' : 'lenoir'
            startNavigation(() => router.push(`/${hallSlug}/${date}`))
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

    // Calendar handlers
    const handleCalendarToggle = () => {
        setIsCalendarOpen(!isCalendarOpen)
    }

    const handleCalendarDateSelect = (date: string) => {
        handleDateChange(date)
        setIsCalendarOpen(false)
    }

    // Outside click and escape key handler for calendar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false)
            }
        }

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsCalendarOpen(false)
            }
        }

        if (isCalendarOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('keydown', handleEscapeKey)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscapeKey)
        }
    }, [isCalendarOpen])

    // Dining hall switcher logic
    const getOppositeDiningHall = () => {
        return diningHall === 'Chase' ? 'Top of Lenoir' : 'Chase'
    }

    const getOppositeHallSlug = () => {
        return diningHall === 'Chase' ? 'lenoir' : 'chase'
    }

    const handleSwitchHall = () => {
        const oppositeSlug = getOppositeHallSlug()
        // Updated to path-based routing
        startNavigation(() => router.push(`/${oppositeSlug}/${selectedDate}`))
    }

    // A one-item tab strip is dead chrome: nearly every campus venue outside the two halls
    // stores `Open` as its only service period. Gated on the count, never on whether the page
    // is a hall — Beach Grille keeps its real Breakfast/Lunch tabs.
    const showPeriodTabs = availablePeriods.length > 1

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
            {/* Sticky Header */}
            <header
                className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-zinc-200 shadow-sm"
                aria-busy={isNavigating}
            >
                {isNavigating && (
                    <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
                        <div className="h-full w-full bg-blue-500 animate-pulse" />
                    </div>
                )}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left: Eat UNC brand & Dining Hall Name */}
                        <div className="flex min-w-0 items-center gap-3 justify-start flex-1 sm:gap-4">
                            <Link
                                href="/"
                                aria-label="Eat UNC home"
                                className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3] focus-visible:ring-offset-4"
                            >
                                <Image
                                    src="/eat_unc_text_logo_nw.png"
                                    alt="Eat UNC"
                                    width={1200}
                                    height={895}
                                    className="h-10 w-auto sm:h-12"
                                    priority
                                />
                            </Link>
                            <span aria-hidden className="h-9 w-px shrink-0 bg-zinc-200 sm:h-10" />
                            <h1 className="text-3xl sm:text-4xl font-black text-zinc-800">
                                {diningHall}
                            </h1>
                        </div>

                        {/* Right: Dining Hall Switcher & Date Selector */}
                        <div className="flex flex-row items-center justify-between sm:justify-center gap-3 sm:gap-4">
                            {/* Dining Hall Switcher Button */}
                            <motion.button
                                type="button"
                                data-tutorial-target="hall-switcher"
                                aria-label={switchLink ? switchLink.label : `Switch to ${getOppositeDiningHall()}`}
                                onClick={() =>
                                    switchLink
                                        ? startNavigation(() => router.push(switchLink.href))
                                        : handleSwitchHall()
                                }
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-1.5 px-3 sm:px-6 py-1.5 min-h-[52px] rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200/50 font-bold text-md sm:text-base hover:bg-zinc-200 active:bg-zinc-300 transition-all touch-manipulation"
                            >
                                <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 shrink-0" />
                                <span className="whitespace-nowrap">
                                    {switchLink ? (
                                        switchLink.label
                                    ) : (
                                        <>
                                            <span className="hidden sm:inline">Switch to </span>
                                            {getOppositeDiningHall()}
                                        </>
                                    )}
                                </span>
                            </motion.button>

                            {/* Date Selector, or what stands in its place on a menu with no date:
                                the slot is filled rather than left empty so the header keeps its
                                shape and the badge answers the question the arrows would have. */}
                            {hideDateNav ? (
                                <div className="flex items-center justify-center px-3 sm:px-5 min-h-[52px] rounded-xl bg-zinc-100 border border-zinc-200/50 text-xs sm:text-sm font-bold text-zinc-500 text-center shrink-0">
                                    Same menu every day
                                </div>
                            ) : (
                            <div ref={datePickerRef} className="relative flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-zinc-100 rounded-xl border border-zinc-200/50 min-h-[52px] shrink-0" data-tutorial-target="date-nav">
                                <motion.button
                                    type="button"
                                    onClick={handlePrevDate}
                                    aria-label="Previous date"
                                    disabled={!canGoBack}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-3 min-w-[44px] min-h-[44px] rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-white active:bg-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-all touch-manipulation flex items-center justify-center"
                                >
                                    <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                                </motion.button>

                                <motion.button
                                    type="button"
                                    onClick={handleCalendarToggle}
                                    aria-label={`Choose date. Current date: ${formattedDate}`}
                                    aria-expanded={isCalendarOpen}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-2 sm:px-4 min-w-[80px] sm:min-w-[120px] text-center font-bold text-md sm:text-base text-zinc-900 hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                    {formattedDate}
                                </motion.button>

                                <motion.button
                                    type="button"
                                    onClick={handleNextDate}
                                    aria-label="Next date"
                                    disabled={!canGoForward}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-3 min-w-[44px] min-h-[44px] rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-white active:bg-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-all touch-manipulation flex items-center justify-center"
                                >
                                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                                </motion.button>

                                {/* Calendar Popup */}
                                <AnimatePresence>
                                    {isCalendarOpen && (
                                        <CalendarPicker
                                            selectedDate={selectedDate}
                                            availableDates={availableDates}
                                            onDateSelect={handleCalendarDateSelect}
                                            onClose={() => setIsCalendarOpen(false)}
                                            minDate={minDate}
                                            maxDate={maxDate}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {subHeader}

            {/* Meal selection and Filtering. Dropped entirely rather than left as an empty
                band: the zero-item card passes neither periods nor search handlers. */}
            <div
                className={`max-w-7xl mx-auto px-4 sm:px-6 pt-6 ${
                    showPeriodTabs || (onSearchChange && onSortChange) ? '' : 'hidden'
                }`}
            >
                {/* Mobile View: Same row for Period and Sort */}
                <div className="flex sm:hidden flex-row items-stretch gap-3 mb-6 w-full">
                    {showPeriodTabs && (
                        <div className="relative flex-1" data-tutorial-target="meal-dropdown">
                            <select
                                aria-label="Meal period"
                                value={selectedPeriod}
                                onChange={(e) => onPeriodChange(e.target.value)}
                                className="w-full h-14 px-4 bg-blue-600 border border-blue-500 rounded-2xl text-base font-bold text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer pr-12 shadow-lg shadow-blue-500/20"
                            >
                                {availablePeriods.map((period) => (
                                    <option key={period} value={period} className="bg-white text-zinc-900">
                                        {getMealLabel(period)}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                                <ChevronRight className="w-5 h-5 rotate-90" />
                            </div>
                        </div>
                    )}
                    {onSearchChange && onSortChange && (
                        // Without a period control beside it the sort button is the whole row,
                        // and it keeps its right edge rather than sliding to the left margin.
                        <div className={showPeriodTabs ? '' : 'flex-1'}>
                            <SearchAndSort
                                searchQuery={searchQuery}
                                onSearchChange={onSearchChange}
                                sortBy={sortBy}
                                onSortChange={onSortChange}
                            />
                        </div>
                    )}
                </div>

                {/* Desktop View: Tabs and Search/Sort separated */}
                <div className="hidden sm:block">
                    {showPeriodTabs && (
                        <div className="flex justify-center mb-6 w-full">
                            <MealTabsWithScrollIndicators
                                availablePeriods={availablePeriods}
                                selectedPeriod={selectedPeriod}
                                onPeriodChange={onPeriodChange}
                                getMealLabel={getMealLabel}
                            />
                        </div>
                    )}

                    {onSearchChange && onSortChange && (
                        <div className="mb-3">
                            <SearchAndSort
                                searchQuery={searchQuery}
                                onSearchChange={onSearchChange}
                                sortBy={sortBy}
                                onSortChange={onSortChange}
                            />
                        </div>
                    )}
                </div>
            </div>


            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
                {children}
            </main>
        </div>
    )
}
