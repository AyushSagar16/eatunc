'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MasterFoodItem } from '@/lib/api'
import FoodCard from '@/components/FoodCard'
import FoodModal from '@/components/FoodModal'
import FoodDisplayLayout from '@/components/FoodDisplayLayout'
import FilterSidebar from '@/components/FilterSidebar'
import { FoodGridSkeleton, ContentLoader } from '@/components/LoadingStates'
import { FilterOption } from '@/lib/types'
import { calculateHealthyScore, getMealPeriodLabel } from '@/lib/utils'

interface MenuEntry {
    meal_period: string
    meal_station: string | null
    recipe_number: number
    master_food_items: MasterFoodItem | null
    dining_hall?: string | null
}

interface MenuContainerProps {
    allEntries: MenuEntry[]
    availablePeriods: string[]
    availableDates: string[]
    selectedDate: string
    selectedHall: string
}

interface StationSectionProps {
    station: string
    items: MasterFoodItem[]
    selectedHall: string
    selectedPeriod: string
    searchQuery: string
    hasActiveFilters: boolean
    forceState?: 'expanded' | 'collapsed' | null
    onItemClick: (item: MasterFoodItem, station: string) => void
}

const StationSection = ({
    station,
    items,
    selectedHall,
    selectedPeriod,
    searchQuery,
    hasActiveFilters,
    forceState,
    onItemClick
}: StationSectionProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Load saved state
    useEffect(() => {
        // Sanitize station name for key
        const safeStation = station.replace(/[^a-zA-Z0-9]/g, '_')
        const key = `collapsed_${selectedHall}_${safeStation}`
        const saved = localStorage.getItem(key)
        if (saved !== null) {
            setIsCollapsed(saved === 'true')
        }
    }, [selectedHall, station])

    // Handle forceState from expand/collapse all
    useEffect(() => {
        if (forceState === 'expanded') {
            setIsCollapsed(false)
        } else if (forceState === 'collapsed') {
            setIsCollapsed(true)
        }
    }, [forceState])

    // Auto-expand when filters are active
    useEffect(() => {
        if (hasActiveFilters && items.length > 0) {
            setIsCollapsed(false)
        }
    }, [hasActiveFilters, items.length])

    const toggle = () => {
        const safeStation = station.replace(/[^a-zA-Z0-9]/g, '_')
        const key = `collapsed_${selectedHall}_${safeStation}`
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem(key, String(newState))
    }

    return (
        <section className="flex flex-col gap-6">
            <button
                onClick={toggle}
                className="flex items-center gap-4 group w-full outline-none"
            >
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition-colors" />
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                        {station}
                    </h2>
                    <span className="text-xs font-medium text-zinc-300 dark:text-zinc-600">
                        ({items.length})
                    </span>
                    <motion.div
                        animate={{ rotate: isCollapsed ? 0 : 180 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                    >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 7l5 5 5-5" />
                        </svg>
                    </motion.div>
                </div>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition-colors" />
            </button>

            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {items.map((item, index) => (
                                <motion.div
                                    key={item.recipe_number}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: Math.min(index * 0.02, 0.4),
                                        duration: 0.2
                                    }}
                                    className="h-full"
                                >
                                    <FoodCard
                                        item={item}
                                        station={station}
                                        mealPeriod={selectedPeriod}
                                        searchQuery={searchQuery}
                                        onClick={() => onItemClick(item, station)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}

export default function MenuContainer({
    allEntries,
    availablePeriods,
    availableDates,
    selectedDate,
    selectedHall
}: MenuContainerProps) {
    // Initialize selectedPeriod default
    const [selectedPeriod, setSelectedPeriod] = useState(availablePeriods[0] || '')

    // Initialize hideCondiments from localStorage
    const [hideCondiments, setHideCondiments] = useState(true)

    // Load settings from localStorage and sync URL on mount/change
    useEffect(() => {
        const saved = localStorage.getItem('hideCondiments')
        if (saved !== null) {
            setHideCondiments(saved === 'true')
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('hideCondiments', hideCondiments.toString())
    }, [hideCondiments])


    // Filter state
    const [activeFilters, setActiveFilters] = useState<FilterOption[]>(['balanced'])

    const toggleFilter = (filter: FilterOption) => {
        setActiveFilters(prev =>
            prev.includes(filter)
                ? prev.filter(f => f !== filter)
                : [...prev, filter]
        )
    }

    const clearAllFilters = () => {
        setActiveFilters([])
    }

    const [isAllItemsOpen, setIsAllItemsOpen] = useState(true)
    const [forceState, setForceState] = useState<'expanded' | 'collapsed' | null>(null)
    const [selectedItemForModal, setSelectedItemForModal] = useState<MasterFoodItem | null>(null)
    const [selectedItemStation, setSelectedItemStation] = useState<string>('')

    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'recommended' | 'calories' | 'protein' | 'fat' | 'alphabetical'>('recommended')

    // Debounce search input to prevent excessive re-renders
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery)
        }, 300) // 300ms debounce
        return () => clearTimeout(timer)
    }, [searchQuery])

    const baseFilteredItems = useMemo(() => {
        const items: { item: MasterFoodItem; station: string }[] = []

        const beverageKeywords = ['beverage', 'drink', 'coffee', 'tea', 'soda', 'juice', 'condiment', 'sauce', 'dressing', 'toppings', 'packets']
        const foodKeywords = ['mustard', 'ketchup', 'mayo', 'relish', 'hot sauce', 'soy sauce', 'syrup', 'salt', 'pepper', 'sugar', 'creamer', 'dressing', 'vinaigrette', 'jam', 'jelly', 'honey', 'water', 'juice', 'milk', 'coffee', 'tea', 'coke', 'sprite']

        allEntries.forEach(entry => {
            if (entry.meal_period === selectedPeriod && entry.master_food_items) {
                const item = entry.master_food_items
                const station = entry.meal_station || 'Other'

                // Search Filter (using debounced query)
                if (debouncedSearchQuery && !item.food_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
                    return
                }

                if (hideCondiments) {
                    const stationMatch = beverageKeywords.some(kw => station.toLowerCase().includes(kw))
                    const foodMatch = foodKeywords.some(kw => item.food_name?.toLowerCase().includes(kw))
                    const nutrientMatch = (item.calories_kcal ?? 0) <= 15 &&
                        (item.protein_g ?? 0) <= 1 &&
                        (item.fat_g ?? 0) <= 1 &&
                        (item.carbohydrates_g ?? 0) <= 3

                    if (stationMatch || foodMatch || nutrientMatch) {
                        return
                    }
                }

                // Deduplicate items by recipe_number across stations for the "Picks" logic
                if (!items.find(it => it.item.recipe_number === item.recipe_number)) {
                    items.push({ item, station })
                }
            }
        })
        return items
    }, [allEntries, selectedPeriod, hideCondiments, debouncedSearchQuery])

    const applyGlobalSort = (items: any[]) => {
        if (sortBy === 'recommended') return items;

        return [...items].sort((a, b) => {
            const itemA = a.item || a;
            const itemB = b.item || b;

            switch (sortBy) {
                case 'calories':
                    return (itemA.calories_kcal ?? 0) - (itemB.calories_kcal ?? 0);
                case 'protein':
                    return (itemB.protein_g ?? 0) - (itemA.protein_g ?? 0);
                case 'fat':
                    return (itemA.fat_g ?? 0) - (itemB.fat_g ?? 0);
                case 'alphabetical':
                    return (itemA.food_name || '').localeCompare(itemB.food_name || '');
                default:
                    return 0;
            }
        });
    };

    const healthyPicks = useMemo(() => {
        if (activeFilters.length === 0) return []

        // Count how many filters each item matches
        const picks = baseFilteredItems
            .map(({ item, station }) => {
                // Exclude items with missing nutrition
                const cal = item.calories_kcal
                const protein = item.protein_g
                const fat = item.fat_g
                const carbs = item.carbohydrates_g

                if (cal === null || protein === null || fat === null || carbs === null) {
                    return null
                }

                // Count matched filters
                let matchCount = 0
                const matchedFilters: string[] = []

                for (const filter of activeFilters) {
                    let matches = false
                    switch (filter) {
                        case 'protein':
                            matches = (protein ?? 0) >= 20
                            if (matches) matchedFilters.push('High Protein')
                            break
                        case 'calories':
                            matches = (cal ?? 0) > 0 && (cal ?? 0) <= 350
                            if (matches) matchedFilters.push('Low Calorie')
                            break
                        case 'fat':
                            matches = (cal ?? 0) > 0 && (fat ?? 0) <= 8
                            if (matches) matchedFilters.push('Low Fat')
                            break
                        case 'balanced':
                            // Balanced: good macro ratios (at least 15g protein, under 400 cal, under 15g fat)
                            matches = (protein ?? 0) >= 15 && (cal ?? 0) <= 400 && (fat ?? 0) <= 15
                            if (matches) matchedFilters.push('Balanced')
                            break
                    }
                    if (matches) matchCount++
                }

                // Only include items matching 2+ filters (or all if only 1 active)
                const minMatches = activeFilters.length === 1 ? 1 : 2
                if (matchCount < minMatches) return null

                const score = matchCount + calculateHealthyScore(item, activeFilters[0]) / 100
                const reason = matchedFilters.join(' + ')

                return { item, station, score, matchCount, reason }
            })
            .filter((pick): pick is NonNullable<typeof pick> => pick !== null)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)

        return applyGlobalSort(picks);
    }, [baseFilteredItems, activeFilters, sortBy])

    const stationsMap = useMemo(() => {
        const map: Record<string, MasterFoodItem[]> = {}

        const beverageKeywords = ['beverage', 'drink', 'coffee', 'tea', 'soda', 'juice', 'condiment', 'sauce', 'dressing', 'toppings', 'packets']
        const foodKeywords = ['mustard', 'ketchup', 'mayo', 'relish', 'hot sauce', 'soy sauce', 'syrup', 'salt', 'pepper', 'sugar', 'creamer', 'dressing', 'vinaigrette', 'jam', 'jelly', 'honey', 'water', 'juice', 'milk', 'coffee', 'tea', 'coke', 'sprite']

        allEntries.forEach(entry => {
            if (entry.meal_period === selectedPeriod && entry.master_food_items) {
                const item = entry.master_food_items
                const station = entry.meal_station || 'Other'

                // Search Filter (using debounced query)
                if (debouncedSearchQuery && !item.food_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
                    return
                }

                // Nutrition Filters (Intersection) - REMOVED for All Items
                // Filters now only apply to "Top Picks" section

                if (hideCondiments) {
                    const stationMatch = beverageKeywords.some(kw => station.toLowerCase().includes(kw))
                    const foodMatch = foodKeywords.some(kw => item.food_name?.toLowerCase().includes(kw))
                    const nutrientMatch = (item.calories_kcal ?? 0) <= 15 &&
                        (item.protein_g ?? 0) <= 1 &&
                        (item.fat_g ?? 0) <= 1 &&
                        (item.carbohydrates_g ?? 0) <= 3

                    if (stationMatch || foodMatch || nutrientMatch) {
                        return
                    }
                }

                if (!map[station]) {
                    map[station] = []
                }
                if (!map[station].find(it => it.recipe_number === entry.recipe_number)) {
                    map[station].push(item)
                }
            }
        })

        // Apply global sort to each station
        Object.keys(map).forEach(station => {
            map[station] = applyGlobalSort(map[station]);
        });

        return map
    }, [allEntries, selectedPeriod, hideCondiments, debouncedSearchQuery, sortBy])

    // Initial visibility for stations (show first 3 immediately)
    const [visibleStationsCount, setVisibleStationsCount] = useState(3)

    useEffect(() => {
        // Stagger loading: Show remaining stations after initial render
        const timer = setTimeout(() => {
            setVisibleStationsCount(100) // Show all
        }, 50) // Reduced to 50ms for faster perceived performance
        return () => clearTimeout(timer)
    }, [selectedPeriod]) // Reset when meal period changes

    const sortedStations = useMemo(() => {
        const allSorted = Object.keys(stationsMap).sort((a, b) => {
            // Priority stations in order
            const priorityStations = [
                'The Kitchen Table',
                'Simply Prepared',
                'The Grill',
                'The Griddle'
            ];

            const indexA = priorityStations.findIndex(s => s.toLowerCase() === a.toLowerCase());
            const indexB = priorityStations.findIndex(s => s.toLowerCase() === b.toLowerCase());

            // If both are in priority list, sort by their order in that list
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // If only A is in priority list, it comes first
            if (indexA !== -1) return -1;
            // If only B is in priority list, it comes first
            if (indexB !== -1) return 1;

            const bottomStations = ['beverages', 'condiments', 'spreads', 'cereal', 'breads', 'bakery', 'dessert']
            const isABottom = bottomStations.some(s => a.toLowerCase().includes(s))
            const isBBottom = bottomStations.some(s => b.toLowerCase().includes(s))

            if (isABottom && !isBBottom) return 1
            if (!isABottom && isBBottom) return -1
            return a.localeCompare(b)
        })

        return allSorted;
    }, [stationsMap])

    const visibleStations = useMemo(() => {
        return sortedStations.slice(0, visibleStationsCount);
    }, [sortedStations, visibleStationsCount]);

    if (allEntries.length === 0) {
        const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
        })

        return (
            <FoodDisplayLayout
                diningHall={selectedHall}
                selectedDate={selectedDate}
                availableDates={availableDates}
                selectedPeriod=""
                availablePeriods={[]}
                onPeriodChange={() => { }}
            >
                <div className="max-w-2xl mx-auto py-12 text-center">
                    <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-3">
                            {selectedHall} isn't open on {formattedDate}
                        </h2>
                        <p className="text-zinc-500 mb-8 leading-relaxed">
                            We couldn't find any menu items for this date. It looks like the dining hall might be closed.
                        </p>
                        <a
                            href="https://dining.unc.edu/menu-hours/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors w-full sm:w-auto"
                        >
                            <span>Double Check Official Schedule</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            </FoodDisplayLayout>
        )
    }

    return (
        <FoodDisplayLayout
            diningHall={selectedHall}
            selectedDate={selectedDate}
            availableDates={availableDates}
            selectedPeriod={selectedPeriod}
            availablePeriods={availablePeriods}
            onPeriodChange={setSelectedPeriod}
            activeFilters={activeFilters}
            onRemoveFilter={toggleFilter}
            onClearFilters={clearAllFilters}
            itemCount={Object.values(stationsMap).reduce((sum, items) => sum + items.length, 0)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
        >
            <div className="flex gap-6">
                {/* Filter Sidebar */}
                <FilterSidebar
                    activeFilters={activeFilters}
                    onToggleFilter={toggleFilter}
                    onClearAll={clearAllFilters}
                />

                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-8 transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-2 min-w-0">

                    {activeFilters.length > 0 && healthyPicks.length > 0 && (
                        <section className="flex flex-col gap-6 p-6 -mx-4 sm:-mx-6 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border-y border-emerald-100 dark:border-emerald-900/30 rounded-none sm:rounded-2xl sm:mx-0 sm:border">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black tracking-tight text-emerald-700 dark:text-emerald-400">
                                            Top Picks
                                        </h2>
                                        <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 font-medium">
                                            {healthyPicks.length} items matching your filters
                                        </p>
                                    </div>
                                </div>
                                <div className="h-px flex-1 bg-emerald-200/50 dark:bg-emerald-800/30" />
                            </div>
                            <motion.div
                                key={activeFilters.join('-') + '-picks'}
                                className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                {healthyPicks.map(({ item, station, reason }, index) => (
                                    <motion.div
                                        key={item.recipe_number}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: Math.min(index * 0.03, 0.3),
                                            duration: 0.2
                                        }}
                                        className="h-full"
                                    >
                                        <FoodCard
                                            item={item}
                                            station={station}
                                            reason={reason}
                                            mealPeriod={selectedPeriod}
                                            searchQuery={debouncedSearchQuery}
                                            onClick={() => {
                                                setSelectedItemForModal(item)
                                                setSelectedItemStation(station)
                                            }}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </section>
                    )}

                    {/* Individual categorical sections removed in favor of global filter */}
                    {/* They can be re-added if specific un-filtered browsing of "Only Protein" is desired, but 
                    the prompt specified a row of pills that act as a global intersection filter. */}

                    <div className="flex flex-col gap-12">
                        <button
                            onClick={() => setIsAllItemsOpen(!isAllItemsOpen)}
                            className="flex items-center gap-4 group"
                        >
                            <h2 className="text-xl font-black italic tracking-tight text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                                ALL ITEMS
                            </h2>
                            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors" />
                            <div className={`text-zinc-400 transition-transform duration-300 ${isAllItemsOpen ? 'rotate-180' : ''}`}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 7l5 5 5-5" />
                                </svg>
                            </div>
                        </button>

                        {/* Expand/Collapse All buttons */}
                        {isAllItemsOpen && visibleStations.length > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setForceState('expanded')
                                        setTimeout(() => setForceState(null), 100)
                                    }}
                                    className="text-xs font-medium text-zinc-400 hover:text-blue-500 transition-colors px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                    Expand All
                                </button>
                                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                <button
                                    onClick={() => {
                                        setForceState('collapsed')
                                        setTimeout(() => setForceState(null), 100)
                                    }}
                                    className="text-xs font-medium text-zinc-400 hover:text-blue-500 transition-colors px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                    Collapse All
                                </button>
                            </div>
                        )}

                        {isAllItemsOpen && visibleStations.map((station) => (
                            <StationSection
                                key={station}
                                station={station}
                                items={stationsMap[station]}
                                selectedHall={selectedHall}
                                selectedPeriod={selectedPeriod}
                                searchQuery={debouncedSearchQuery}
                                hasActiveFilters={activeFilters.length > 0}
                                forceState={forceState}
                                onItemClick={(item, stat) => {
                                    setSelectedItemForModal(item)
                                    setSelectedItemStation(stat)
                                }}
                            />
                        ))}
                    </div>

                    {sortedStations.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-16 px-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                                No items match your filters
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                                {activeFilters.length > 0 ? (
                                    <>Try removing some filters or adjusting your search to see more options.</>
                                ) : (
                                    <>No food items found for <span className="font-bold text-zinc-700 dark:text-zinc-200">{getMealPeriodLabel(selectedPeriod)}</span> on this date.</>
                                )}
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {activeFilters.length > 0 && (
                                    <button
                                        onClick={() => activeFilters.forEach(f => toggleFilter(f))}
                                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                                {hideCondiments && (
                                    <button
                                        onClick={() => setHideCondiments(false)}
                                        className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        Show Condiments & Drinks
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {selectedItemForModal && (
                <FoodModal
                    item={selectedItemForModal}
                    station={selectedItemStation}
                    mealPeriod={selectedPeriod}
                    isOpen={!!selectedItemForModal}
                    onClose={() => setSelectedItemForModal(null)}
                />
            )}
        </FoodDisplayLayout>
    )
}
