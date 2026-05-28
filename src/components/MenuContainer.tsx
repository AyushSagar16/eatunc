'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef, useReducer } from 'react'
import { m, AnimatePresence } from 'motion/react'
import { usePostHog } from 'posthog-js/react'
import { MasterFoodItem } from '@/lib/api'
import FoodCard from '@/components/FoodCard'
import FoodModal from '@/components/FoodModal'
import FoodDisplayLayout from '@/components/FoodDisplayLayout'
import FilterSidebar from '@/components/FilterSidebar'
import { FoodGridSkeleton, ContentLoader } from '@/components/LoadingStates'
import { FilterOption, DietaryPreferenceOption, AllergenOption } from '@/lib/types'
import { calculateHealthyScore, getMealPeriodLabel, getActiveMealPeriod } from '@/lib/utils'
import { useVirtualizer } from '@tanstack/react-virtual'
import { parseDietaryPreferences, parseAllergens } from '@/components/icons/dietary'
import { useFilters } from '@/hooks/useFilters'

// Debug flag: enable via NEXT_PUBLIC_DEBUG_MENU_PAGE=true in .env.local
const DEBUG_MENU = process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_DEBUG_MENU_PAGE === 'true';

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
    initialPeriod?: string
}

interface StationSectionProps {
    station: string
    items: MasterFoodItem[]
    selectedHall: string
    selectedPeriod: string
    searchQuery: string
    hasActiveFilters: boolean
    isFirstStation?: boolean
    onItemClick: (item: MasterFoodItem, station: string) => void
    activeAllergens: AllergenOption[]
    activeDietaryPreferences: DietaryPreferenceOption[]
}

// Maps dietary preference IDs to the values stored in the database.
const PREF_ID_TO_DB: Record<DietaryPreferenceOption, string> = {
    'vegan': 'vegan',
    'vegetarian': 'vegetarian',
    'gluten-free': 'made without gluten',
    'halal': 'halal',
    'local': 'local',
    'organic': 'organic',
    'smart-choice': 'smart choice',
    'sustainable-seafood': 'sustainable seafood',
    'coolfood': 'coolfood',
}

// Intl constructors are expensive; build the date-key formatter once.
const NY_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
})

// Search input and its debounced value, grouped as one reducer (related state).
interface SearchState {
    input: string
    debounced: string
}
type SearchAction = { type: 'input'; value: string } | { type: 'commit' }
function searchReducer(state: SearchState, action: SearchAction): SearchState {
    switch (action.type) {
        case 'input': return { ...state, input: action.value }
        case 'commit': return { ...state, debounced: state.input }
        default: return state
    }
}

const BEVERAGE_KEYWORDS = ['beverage', 'drink', 'coffee', 'tea', 'soda', 'juice', 'condiment', 'sauce', 'dressing', 'toppings', 'packets']
const FOOD_KEYWORDS = ['mustard', 'ketchup', 'mayo', 'relish', 'hot sauce', 'soy sauce', 'syrup', 'salt', 'pepper', 'sugar', 'creamer', 'dressing', 'vinaigrette', 'jam', 'jelly', 'honey', 'water', 'juice', 'milk', 'coffee', 'tea', 'coke', 'sprite']
const TOPPING_KEYWORDS = ['lettuce', 'tomato', 'tomatoes', 'onion', 'onions', 'pickle', 'pickles', 'banana pepper', 'banana peppers', 'jalapeno', 'jalapenos', 'pepperoncini', 'sauerkraut']

const isCondimentOrDrink = (item: MasterFoodItem, station: string) => {
    const s = station.toLowerCase()
    const name = item.food_name?.toLowerCase() || ''
    const calories = item.calories_kcal ?? 0
    const matchesCompactCalorieThreshold = calories <= 50

    // 1. Station Match (Partial match is safer for stations)
    const stationMatch = BEVERAGE_KEYWORDS.some(kw => s.includes(kw))

    // 2. Food Name Match (Whole Word boundary to avoid false positives like "Jambalaya" matching "jam")
    const foodMatch = matchesCompactCalorieThreshold && FOOD_KEYWORDS.some(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'i')
        return regex.test(name)
    })

    // Common burger and sandwich toppings should stay compact when they are genuinely small add-ons.
    const toppingMatch = matchesCompactCalorieThreshold && TOPPING_KEYWORDS.some(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'i')
        return regex.test(name)
    })

    // 3. Nutrient Match (Items with virtually no nutritional value that aren't at main stations)
    const mainFoodStations = ['kitchen table', 'grill', 'griddle', 'simply prepared', 'global']
    const isMainFoodStation = mainFoodStations.some(mfs => s.includes(mfs))

    const nutrientMatch = !isMainFoodStation &&
        (item.calories_kcal ?? 0) <= 5 &&
        (item.protein_g ?? 0) <= 1 &&
        (item.fat_g ?? 0) <= 1 &&
        (item.carbohydrates_g ?? 0) <= 2

    return stationMatch || foodMatch || toppingMatch || nutrientMatch
}

// Pick scoring for the "Top Picks" panel. Pure module-scope computation so it
// stays out of the MenuContainer render body. Mirrors the prior useMemo logic
// exactly: the allergen / dietary checks use the same module-level parsers.
const computeHealthyPicks = (
    baseFilteredItems: { item: MasterFoodItem; station: string }[],
    activeFilters: FilterOption[],
    activeDietaryPreferences: DietaryPreferenceOption[],
    activeAllergens: AllergenOption[],
    applyGlobalSort: (items: any[]) => any[]
) => {
    // Show Top Picks if any macro filters or dietary preferences are active
    if (activeFilters.length === 0 && activeDietaryPreferences.length === 0) return []

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

            if (isCondimentOrDrink(item, station)) {
                return null
            }

            // Skip items containing allergens to avoid
            if (activeAllergens.length > 0) {
                const itemAllergens = parseAllergens(item.allergens)
                const hasAllergen = activeAllergens.some(allergen =>
                    itemAllergens.some(itemAllergen =>
                        itemAllergen.toLowerCase() === allergen.toLowerCase()
                    )
                )
                if (hasAllergen) {
                    return null
                }
            }

            // Skip items that don't match dietary preferences
            if (activeDietaryPreferences.length > 0) {
                const itemPrefs = parseDietaryPreferences(item.dietary_preferences)
                const matchesAll = activeDietaryPreferences.every(pref =>
                    itemPrefs.includes(PREF_ID_TO_DB[pref])
                )
                if (!matchesAll) {
                    return null
                }
            }

            // Count matched macro filters
            let matchCount = 0
            const matchedFilters: string[] = []

            // Add matched dietary preferences to reason
            if (activeDietaryPreferences.length > 0) {
                const itemPrefs = parseDietaryPreferences(item.dietary_preferences)
                activeDietaryPreferences.forEach(pref => {
                    if (itemPrefs.includes(PREF_ID_TO_DB[pref])) {
                        matchedFilters.push(pref.charAt(0).toUpperCase() + pref.slice(1).replace('-', ' '))
                        matchCount++
                    }
                })
            }

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
                    case 'carbs':
                        // Low Carbohydrate: Under 15g carbs
                        matches = (carbs ?? 0) <= 15
                        if (matches) matchedFilters.push('Low Carbohydrate')
                        break
                }
                if (matches) matchCount++
            }

            // Need at least 1 match to appear in Top Picks
            const totalFiltersActive = activeFilters.length + activeDietaryPreferences.length
            const minMatches = totalFiltersActive === 1 ? 1 : Math.min(2, totalFiltersActive)
            if (matchCount < minMatches) return null

            const score = matchCount + calculateHealthyScore(item, activeFilters[0] || 'protein') / 100
            const reason = matchedFilters.join(' + ')

            return { item, station, score, matchCount, reason }
        })
        .filter((pick): pick is NonNullable<typeof pick> => pick !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)

    return applyGlobalSort(picks);
}

/**
 * Groups food items by their station for display. Pure module-scope helper so the
 * grouping/dedup logic stays out of the MenuContainer render body.
 *
 * Deduplication Logic:
 * - Each station can only have ONE instance of each recipe_number
 * - This is necessary because the database may have duplicate entries for the same item at the same station
 * - We use a Set to track processed station+recipe combinations
 *
 * Items are ONLY skipped if:
 * 1. They don't match the selected meal period
 * 2. They have null master_food_items (no nutrition data in database)
 * 3. They don't match the search query
 * 4. They are a duplicate (same recipe_number at the same station)
 */
const buildStationsMap = (
    allEntries: MenuEntry[],
    selectedPeriod: string,
    debouncedSearchQuery: string,
    applyGlobalSort: (items: any[]) => any[]
): Record<string, MasterFoodItem[]> => {
    const map: Record<string, MasterFoodItem[]> = {}
    // Track processed combinations: "station:recipe_number"
    const processedIds = new Set<string>()

    allEntries.forEach(entry => {
        if (entry.meal_period === selectedPeriod && entry.master_food_items) {
            const item = entry.master_food_items
            const station = entry.meal_station || 'Other'

            // Search Filter (using debounced query)
            if (debouncedSearchQuery && !item.food_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
                return
            }

            // Create a unique key combining station and recipe_number
            // This ensures we only skip TRUE duplicates (same item at same station)
            const uniqueKey = `${station}:${entry.recipe_number}`

            // Only skip if this exact station+recipe combo was already processed
            if (processedIds.has(uniqueKey)) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[MENU] Skipping duplicate: ${item.food_name} (${entry.recipe_number}) at ${station}`)
                }
                return
            }

            processedIds.add(uniqueKey)

            if (!map[station]) {
                map[station] = []
            }
            map[station].push(item)
        }
    })

    // Log final counts for debugging
    if (process.env.NODE_ENV === 'development') {
        console.log('[MENU] Final station item counts:',
            Object.entries(map).map(([station, items]) => ({
                station,
                count: items.length,
                recipes: items.map(i => i.recipe_number)
            }))
        )
    }

    // Apply global sort to each station
    Object.keys(map).forEach(station => {
        map[station] = applyGlobalSort(map[station]);
    });

    return map
}

// Orders stations: priority stations first, "bottom" stations last, the rest by
// descending average calories (then alphabetical). Pure module-scope helper.
const sortStations = (stationsMap: Record<string, MasterFoodItem[]>): string[] => {
    return Object.keys(stationsMap).sort((a, b) => {
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

        const bottomStations = ['beverages', 'condiments', 'spreads', 'cereal', 'breads', 'bakery', 'dessert', 'stress less', 'cabinet']
        const isABottom = bottomStations.some(s => a.toLowerCase().includes(s))
        const isBBottom = bottomStations.some(s => b.toLowerCase().includes(s))

        if (isABottom && !isBBottom) return 1
        if (!isABottom && isBBottom) return -1

        // Calculate average calories for each station
        const getAvgCalories = (stationName: string) => {
            const items = stationsMap[stationName] || []
            if (items.length === 0) return 0
            const total = items.reduce((sum, item) => sum + (item.calories_kcal ?? 0), 0)
            return total / items.length
        }

        const avgA = getAvgCalories(a)
        const avgB = getAvgCalories(b)

        // Sort by average calories descending (Higher on top)
        // Use a small epsilon for float comparison safety, though likely overkill here
        if (Math.abs(avgA - avgB) > 0.1) {
            return avgB - avgA
        }

        // Fallback to alphabetical if averages are roughly equal
        return a.localeCompare(b)
    })
}

// PERFORMANCE: Memoize MiniFoodCard to prevent re-renders when props haven't changed
const MiniFoodCard = React.memo(({ item, station, onSelect, containsAllergen = false }: { item: MasterFoodItem; station: string; onSelect: (item: MasterFoodItem, station: string) => void; containsAllergen?: boolean }) => {
    return (
        <m.div
            onClick={() => onSelect(item, station)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={containsAllergen ? {} : { backgroundColor: "rgba(250, 250, 250, 1)" }}
            whileTap={{ scale: 0.99 }}
            className={`flex items-center justify-between p-3 rounded-xl border bg-white/50 dark:bg-zinc-900/30 cursor-pointer transition-all group h-full min-h-[42px] ${containsAllergen
                ? 'border-2 border-dashed border-zinc-300 dark:border-zinc-700 opacity-60'
                : 'border-zinc-200/50 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
        >
            <span className={`text-sm font-bold transition-colors ${containsAllergen
                ? 'text-zinc-400 dark:text-zinc-600'
                : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
                }`}>
                {item.food_name}
            </span>
        </m.div>
    )
})

// PERFORMANCE: Memoize StationSection to prevent re-renders of large sections
// This component renders many FoodCards, so preventing unnecessary re-renders is critical
const StationSection = React.memo((({
    station,
    items,
    selectedHall,
    selectedPeriod,
    searchQuery,
    hasActiveFilters,
    isFirstStation = false,
    onItemClick,
    activeAllergens,
    activeDietaryPreferences
}: StationSectionProps) => {
    const collapseKey = `collapsed_${selectedHall}_${station.replace(/[^a-zA-Z0-9]/g, '_')}`
    // User's saved collapse preference for this station (read once on mount).
    const [userCollapsed, setUserCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false
        return localStorage.getItem(collapseKey) === 'true'
    })
    // Filtering forces the section open so matching items stay visible.
    const isCollapsed = userCollapsed && !(hasActiveFilters && items.length > 0)
    const parentRef = useRef<HTMLDivElement>(null)

    // Helper to check if item contains allergens to avoid
    const itemContainsAllergens = useCallback((item: MasterFoodItem): boolean => {
        if (activeAllergens.length === 0) return false
        const itemAllergens = parseAllergens(item.allergens)
        return activeAllergens.some(allergen =>
            itemAllergens.some(itemAllergen =>
                itemAllergen.toLowerCase() === allergen.toLowerCase()
            )
        )
    }, [activeAllergens])

    // Helper to check if item matches ALL selected dietary preferences
    const itemMatchesDietaryFilter = useCallback((item: MasterFoodItem): boolean => {
        if (activeDietaryPreferences.length === 0) return false
        const itemPrefs = parseDietaryPreferences(item.dietary_preferences)
        return activeDietaryPreferences.every(pref =>
            itemPrefs.includes(PREF_ID_TO_DB[pref])
        )
    }, [activeDietaryPreferences])

    const toggle = () => {
        const newState = !isCollapsed
        setUserCollapsed(newState)
        localStorage.setItem(collapseKey, String(newState))
    }

    // Sort items: Main items first, then Condiments
    const sortedItems = useMemo(() => {
        const main: MasterFoodItem[] = []
        const cond: MasterFoodItem[] = []
        items.forEach(item => {
            if (isCondimentOrDrink(item, station)) {
                cond.push(item)
            } else {
                main.push(item)
            }
        })
        return [...main, ...cond]
    }, [items, station])

    // VIRTUAL SCROLLING: Calculate items per row based on responsive breakpoints
    // This matches the grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 layout
    const getItemsPerRow = useCallback(() => {
        if (typeof window === 'undefined') return 2
        const width = window.innerWidth
        if (width >= 1280) return 4 // xl
        if (width >= 1024) return 3 // lg
        if (width >= 768) return 2  // md
        return 2 // mobile
    }, [])

    // VIRTUAL SCROLLING: Only enable for large lists (50+ items) to improve performance
    // For smaller lists, use regular rendering to preserve animations
    const shouldVirtualize = sortedItems.length > 50
    const [itemsPerRow, setItemsPerRow] = useState(getItemsPerRow)

    // Update items per row on window resize
    useEffect(() => {
        if (!shouldVirtualize) return

        const handleResize = () => {
            const width = window.innerWidth
            setItemsPerRow(width >= 1280 ? 4 : width >= 1024 ? 3 : 2)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [shouldVirtualize])

    // VIRTUAL SCROLLING: Setup virtualizer for large lists
    // Virtualizes rows instead of individual items to maintain grid layout
    const rowVirtualizer = useVirtualizer({
        count: shouldVirtualize ? Math.ceil(sortedItems.length / itemsPerRow) : 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 240, // Estimated row height in pixels
        overscan: 5, // Render 5 extra rows above/below viewport for smooth scrolling
    })

    return (
        <section className="flex flex-col gap-6">
            <button
                type="button"
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
                    <m.div
                        animate={{ rotate: isCollapsed ? 0 : 180 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                    >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 7l5 5 5-5" />
                        </svg>
                    </m.div>
                </div>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition-colors" />
            </button>

            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <m.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        {/* VIRTUAL SCROLLING: Use virtualized rendering for large lists (50+ items) */}
                        {shouldVirtualize ? (
                            <div
                                ref={parentRef}
                                className="relative"
                                style={{
                                    height: '600px', // Fixed height for virtual scroller
                                    overflow: 'auto',
                                }}
                            >
                                <div
                                    style={{
                                        height: `${rowVirtualizer.getTotalSize()}px`,
                                        width: '100%',
                                        position: 'relative',
                                    }}
                                >
                                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                        const startIndex = virtualRow.index * itemsPerRow
                                        const rowItems = sortedItems.slice(startIndex, startIndex + itemsPerRow)

                                        return (
                                            <div
                                                key={virtualRow.key}
                                                data-index={virtualRow.index}
                                                ref={rowVirtualizer.measureElement}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                }}
                                            >
                                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 grid-flow-row-dense">
                                                    {rowItems.map((item) => (
                                                        <div
                                                            key={item.recipe_number}
                                                            className={`h-full ${isCondimentOrDrink(item, station) ? 'row-span-1' : 'row-span-3'}`}
                                                        >
                                                            {isCondimentOrDrink(item, station) ? (
                                                                <MiniFoodCard
                                                                    item={item}
                                                                    station={station}
                                                                    onSelect={onItemClick}
                                                                    containsAllergen={itemContainsAllergens(item)}
                                                                />
                                                            ) : (
                                                                <FoodCard
                                                                    item={item}
                                                                    station={station}
                                                                    mealPeriod={selectedPeriod}
                                                                    searchQuery={searchQuery}
                                                                    onClick={() => onItemClick(item, station)}
                                                                    containsAllergen={itemContainsAllergens(item)}
                                                                    matchesDietaryFilter={!itemContainsAllergens(item) && itemMatchesDietaryFilter(item)}
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            // Regular rendering for smaller lists (< 50 items) - preserves animations
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 grid-flow-row-dense">
                                {sortedItems.map((item, index) => {
                                    const isCondiment = isCondimentOrDrink(item, station)
                                    // Add tutorial target to first non-condiment card in first station
                                    const shouldAddTutorialTarget = isFirstStation && index === 0 && !isCondiment
                                    return (
                                        <m.div
                                            key={item.recipe_number}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                delay: Math.min(index * 0.02, 0.4),
                                                duration: 0.2
                                            }}
                                            className={`h-full ${isCondiment ? 'row-span-1' : 'row-span-3'}`}
                                            {...(shouldAddTutorialTarget ? { 'data-tutorial-target': 'food-card' } : {})}
                                        >
                                            {isCondiment ? (
                                                <MiniFoodCard
                                                    item={item}
                                                    station={station}
                                                    onSelect={onItemClick}
                                                    containsAllergen={itemContainsAllergens(item)}
                                                />
                                            ) : (
                                                <FoodCard
                                                    item={item}
                                                    station={station}
                                                    mealPeriod={selectedPeriod}
                                                    searchQuery={searchQuery}
                                                    onClick={() => onItemClick(item, station)}
                                                    containsAllergen={itemContainsAllergens(item)}
                                                    matchesDietaryFilter={!itemContainsAllergens(item) && itemMatchesDietaryFilter(item)}
                                                />
                                            )}
                                        </m.div>
                                    )
                                })}
                            </div>
                        )}
                    </m.div>
                )}
            </AnimatePresence>
        </section>
    )
}))

// Shown when the dining hall has no menu entries for the selected date.
const ClosedHallNotice = ({
    diningHall,
    selectedDate,
    availableDates,
}: {
    diningHall: string
    selectedDate: string
    availableDates: string[]
}) => {
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    })

    return (
        <FoodDisplayLayout
            diningHall={diningHall}
            selectedDate={selectedDate}
            availableDates={availableDates}
            selectedPeriod=""
            availablePeriods={[]}
            onPeriodChange={() => { }}
        >
            <div className="max-w-2xl mx-auto py-12 text-center">
                <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="size-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="size-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-3">
                        {diningHall} isn't open on {formattedDate}
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
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </div>
        </FoodDisplayLayout>
    )
}

// "Top Picks" panel: highest-scoring items matching the active filters.
const TopPicksSection = ({
    picks,
    activeFilters,
    selectedPeriod,
    debouncedSearchQuery,
    onItemClick,
}: {
    picks: { item: MasterFoodItem; station: string; reason: string }[]
    activeFilters: FilterOption[]
    selectedPeriod: string
    debouncedSearchQuery: string
    onItemClick: (item: MasterFoodItem, station: string) => void
}) => {
    return (
        <section className="flex flex-col gap-6 p-6 -mx-4 sm:-mx-6 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border-y border-emerald-100 dark:border-emerald-900/30 rounded-none sm:rounded-2xl sm:mx-0 sm:border">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <svg className="size-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-emerald-700 dark:text-emerald-400">
                            Top Picks
                        </h2>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 font-medium">
                            {picks.length} items matching your filters
                        </p>
                    </div>
                </div>
                <div className="h-px flex-1 bg-emerald-200/50 dark:bg-emerald-800/30" />
            </div>
            <m.div
                key={activeFilters.join('-') + '-picks'}
                className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
            >
                {picks.map(({ item, station, reason }, index) => (
                    <m.div
                        key={item.recipe_number}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: Math.min(index * 0.03, 0.3),
                            duration: 0.2
                        }}
                        className="h-full"
                        {...(index === 0 ? { 'data-tutorial-target': 'food-card' } : {})}
                    >
                        <FoodCard
                            item={item}
                            station={station}
                            reason={reason}
                            mealPeriod={selectedPeriod}
                            searchQuery={debouncedSearchQuery}
                            onClick={() => onItemClick(item, station)}
                        />
                    </m.div>
                ))}
            </m.div>
        </section>
    )
}

// Empty state shown when no stations match the current filters / search.
const NoMatchingItems = ({
    hasFilters,
    mealPeriodLabel,
    onClearFilters,
}: {
    hasFilters: boolean
    mealPeriodLabel: string
    onClearFilters: () => void
}) => {
    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800"
        >
            <div className="size-16 mx-auto mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                <svg className="size-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                No items match your filters
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                {hasFilters ? (
                    <>Try removing some filters or adjusting your search to see more options.</>
                ) : (
                    <>No food items found for <span className="font-bold text-zinc-700 dark:text-zinc-200">{mealPeriodLabel}</span> on this date.</>
                )}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
                {hasFilters && (
                    <button
                        type="button"
                        onClick={onClearFilters}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                    >
                        Clear All Filters
                    </button>
                )}
            </div>
        </m.div>
    )
}

export default function MenuContainer({
    allEntries,
    availablePeriods,
    availableDates,
    selectedDate,
    selectedHall,
    initialPeriod
}: MenuContainerProps) {
    // iOS CRASH DEBUG: Log render counts and payload sizes
    //     if (DEBUG_MENU && typeof window !== 'undefined') {
    //         console.count('[MenuContainer] render');
    //         console.log('[MenuContainer] allEntries:', allEntries.length);
    //         console.log('[MenuContainer] availablePeriods:', availablePeriods.length);
    //         console.log('[MenuContainer] payload size (bytes):',
    //             JSON.stringify({ allEntries, availablePeriods }).length);
    //     }

    // PostHog for analytics
    const posthog = usePostHog()
    // Initialize selectedPeriod default - try initialPeriod first, then time-based (if today), then fallback
    const [selectedPeriod, setSelectedPeriod] = useState(() => {
        if (initialPeriod) {
            const normalizedInitial = initialPeriod.split('(')[0].trim().toLowerCase()
            // Find a case-insensitive match in availablePeriods after stripping parentheses
            const match = availablePeriods.find(p => {
                const normalizedP = p.split('(')[0].trim().toLowerCase()
                return normalizedP === normalizedInitial
            })
            if (match) return match
        }

        // Only auto-select based on current time if viewing today's date
        const now = new Date()
        const todayStr = NY_DATE_FORMATTER.format(now)

        if (selectedDate === todayStr) {
            return getActiveMealPeriod(availablePeriods, now) || availablePeriods[0] || ''
        }

        // For past/future dates, default to first period
        return availablePeriods[0] || ''
    })


    // ========================================
    // PERSISTENT FILTERS (macro / dietary / allergens)
    // ========================================
    // State + localStorage persistence live in the useFilters hook; analytics
    // stay here via callbacks so the hook needn't know about PostHog.
    const {
        activeFilters,
        activeDietaryPreferences,
        activeAllergens,
        toggleFilter,
        toggleDietaryPreference,
        toggleAllergen,
        clearMacroFilters,
        clearAllFilters,
    } = useFilters({
        onToggle: (filter_type, filter_name, action) => {
            posthog.capture('filter_toggled', {
                filter_type,
                filter_name,
                action,
                hall: selectedHall,
                meal_period: selectedPeriod,
            })
        },
        onClear: (counts) => {
            posthog.capture('filters_cleared', {
                macro_filters_count: counts.macro,
                dietary_filters_count: counts.dietary,
                allergen_filters_count: counts.allergens,
                hall: selectedHall,
                meal_period: selectedPeriod,
            })
        },
    })


    // ========================================
    // HELPER FUNCTIONS FOR FILTERING
    // ========================================

    const [modalSelection, setModalSelection] = useState<{ item: MasterFoodItem; station: string } | null>(null)

    const handleItemClick = useCallback((item: MasterFoodItem, station: string) => {
        setModalSelection({ item, station })
    }, [])

    const [search, dispatchSearch] = useReducer(searchReducer, { input: '', debounced: '' })
    const searchQuery = search.input
    const debouncedSearchQuery = search.debounced
    const [sortBy, setSortBy] = useState<'recommended' | 'calories' | 'protein' | 'fat' | 'alphabetical'>('recommended')

    // Debounce search input to prevent excessive re-renders
    useEffect(() => {
        const timer = setTimeout(() => {
            dispatchSearch({ type: 'commit' })
        }, 300) // 300ms debounce
        return () => clearTimeout(timer)
    }, [searchQuery])



    const baseFilteredItems = useMemo(() => {
        const items: { item: MasterFoodItem; station: string }[] = []

        allEntries.forEach(entry => {
            if (entry.meal_period === selectedPeriod && entry.master_food_items) {
                const item = entry.master_food_items
                const station = entry.meal_station || 'Other'

                // Search Filter (using debounced query)
                if (debouncedSearchQuery && !item.food_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
                    return
                }

                /*
                if (hideCondiments && isCondimentOrDrink(item, station)) {
                    return
                }
                */

                // Deduplicate items by recipe_number across stations for the "Picks" logic
                if (!items.find(it => it.item.recipe_number === item.recipe_number)) {
                    items.push({ item, station })
                }
            }
        })
        return items
    }, [allEntries, selectedPeriod, debouncedSearchQuery])

    const applyGlobalSort = useCallback((items: any[]) => {
        if (sortBy === 'recommended') return items;

        return items.toSorted((a, b) => {
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
    }, [sortBy]);

    const healthyPicks = useMemo(() => {
        return computeHealthyPicks(baseFilteredItems, activeFilters, activeDietaryPreferences, activeAllergens, applyGlobalSort)
    }, [baseFilteredItems, activeFilters, activeDietaryPreferences, activeAllergens, applyGlobalSort])

    /**
     * stationsMap: Groups food items by their station for display
     * 
     * Deduplication Logic:
     * - Each station can only have ONE instance of each recipe_number
     * - This is necessary because the database may have duplicate entries for the same item at the same station
     * - We use a Set to track processed station+recipe combinations
     * 
     * Items are ONLY skipped if:
     * 1. They don't match the selected meal period
     * 2. They have null master_food_items (no nutrition data in database)
     * 3. They don't match the search query
     * 4. They are a duplicate (same recipe_number at the same station)
     */
    const stationsMap = useMemo(() => {
        return buildStationsMap(allEntries, selectedPeriod, debouncedSearchQuery, applyGlobalSort)
    }, [allEntries, selectedPeriod, debouncedSearchQuery, applyGlobalSort])

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
        return sortStations(stationsMap);
    }, [stationsMap])

    const visibleStations = useMemo(() => {
        return sortedStations.slice(0, visibleStationsCount);
    }, [sortedStations, visibleStationsCount]);

    if (allEntries.length === 0) {
        return (
            <ClosedHallNotice
                diningHall={selectedHall}
                selectedDate={selectedDate}
                availableDates={availableDates}
            />
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
            onSearchChange={(value) => dispatchSearch({ type: 'input', value })}
            sortBy={sortBy}
            onSortChange={setSortBy}
        >
            {/* Filter Sidebar - Now just the floating button */}
            <FilterSidebar
                activeFilters={activeFilters}
                onToggleFilter={toggleFilter}
                onClearAll={clearAllFilters}
                activeDietaryPreferences={activeDietaryPreferences}
                onToggleDietaryPreference={toggleDietaryPreference}
                activeAllergens={activeAllergens}
                onToggleAllergen={toggleAllergen}
            />

            {/* Main Content - Full Width */}
            <div className="w-full flex flex-col gap-8 transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-2">

                {(activeFilters.length > 0 || activeDietaryPreferences.length > 0) && healthyPicks.length > 0 && (
                    <TopPicksSection
                        picks={healthyPicks}
                        activeFilters={activeFilters}
                        selectedPeriod={selectedPeriod}
                        debouncedSearchQuery={debouncedSearchQuery}
                        onItemClick={handleItemClick}
                    />
                )}

                {/* Individual categorical sections removed in favor of global filter */}
                {/* They can be re-added if specific un-filtered browsing of "Only Protein" is desired, but 
                    the prompt specified a row of pills that act as a global intersection filter. */}

                <div className="flex flex-col gap-12">
                    {visibleStations.map((station, stationIndex) => (
                        <StationSection
                            key={station}
                            station={station}
                            items={stationsMap[station]}
                            selectedHall={selectedHall}
                            selectedPeriod={selectedPeriod}
                            searchQuery={debouncedSearchQuery}
                            hasActiveFilters={activeFilters.length > 0 || activeDietaryPreferences.length > 0}
                            isFirstStation={stationIndex === 0 && activeFilters.length === 0 && activeDietaryPreferences.length === 0}
                            onItemClick={handleItemClick}
                            activeAllergens={activeAllergens}
                            activeDietaryPreferences={activeDietaryPreferences}
                        />
                    ))}
                </div>

                {sortedStations.length === 0 && (
                    <NoMatchingItems
                        hasFilters={activeFilters.length > 0}
                        mealPeriodLabel={getMealPeriodLabel(selectedPeriod)}
                        onClearFilters={clearMacroFilters}
                    />
                )}
            </div>

            {modalSelection && (
                <FoodModal
                    item={modalSelection.item}
                    station={modalSelection.station}
                    mealPeriod={selectedPeriod}
                    isOpen={!!modalSelection}
                    onClose={() => setModalSelection(null)}
                />
            )}
        </FoodDisplayLayout>
    )
}
