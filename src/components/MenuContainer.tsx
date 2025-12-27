'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { MasterFoodItem } from '@/lib/api'
import FoodCard from '@/components/FoodCard'
import FoodModal from '@/components/FoodModal'
import MenuHeader from '@/components/MenuHeader'
import FilterPills, { FilterOption } from '@/components/FilterPills'
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

    const [isAllItemsOpen, setIsAllItemsOpen] = useState(true)
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

        const picks = baseFilteredItems
            .filter(({ item }) => {
                // Apply intersection logic
                for (const filter of activeFilters) {
                    if (filter === 'protein' && (item.protein_g ?? 0) < 20) return false
                    if (filter === 'calories' && ((item.calories_kcal ?? 0) > 350 || (item.calories_kcal ?? 0) === 0)) return false
                    if (filter === 'fat' && ((item.fat_g ?? 0) > 8 || (item.calories_kcal ?? 0) === 0)) return false
                }

                // Exclude items with missing nutrition if any filters are active
                const cal = item.calories_kcal
                const protein = item.protein_g
                const fat = item.fat_g
                const carbs = item.carbohydrates_g

                if (cal === null || protein === null || fat === null || carbs === null) {
                    return false
                }

                return true
            })
            .map(({ item, station }) => {
                // Combined score based on all active filters
                let totalScore = 0
                activeFilters.forEach(f => {
                    totalScore += calculateHealthyScore(item, f)
                })
                const score = totalScore / activeFilters.length

                const reason = activeFilters.map(f => {
                    if (f === 'protein') return 'High Protein'
                    if (f === 'calories') return 'Low Calorie'
                    if (f === 'fat') return 'Low Fat'
                    return 'Balanced'
                }).join(' + ')

                return { item, station, score, reason }
            })
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

    return (
        <div className="flex flex-col gap-8">
            <MenuHeader
                dates={availableDates}
                selectedDate={selectedDate}
                periods={availablePeriods}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                diningHalls={['Chase', 'Top of Lenoir']}
                selectedHall={selectedHall}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                hideCondiments={hideCondiments}
                onToggleCondiments={setHideCondiments}
            />

            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex flex-col gap-8 transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-2">
                <FilterPills
                    activeFilters={activeFilters}
                    onToggleFilter={toggleFilter}
                />

                {activeFilters.length > 0 && healthyPicks.length > 0 && (
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black italic tracking-tight text-green-600 dark:text-green-500">
                                    TOP PICKS
                                </h2>
                                <div className="group relative">
                                    <div className="cursor-help text-green-600/50 dark:text-green-500/50 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                        </svg>
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-green-50 dark:bg-zinc-900 border border-green-100 dark:border-zinc-800 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                                        <p className="text-[11px] font-bold text-green-800 dark:text-green-300 leading-normal">
                                            Optimizing for {activeFilters.join(' + ')} items within the top nutritional matches.
                                        </p>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-green-50 dark:border-t-zinc-900" />
                                    </div>
                                </div>
                            </div>
                            <div className="h-px flex-1 bg-green-100 dark:bg-green-900/30" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {healthyPicks.map(({ item, station, reason }) => (
                                <FoodCard
                                    key={item.recipe_number}
                                    item={item}
                                    station={station}
                                    reason={reason}
                                    mealPeriod={selectedPeriod}
                                    onClick={() => {
                                        setSelectedItemForModal(item)
                                        setSelectedItemStation(station)
                                    }}
                                />
                            ))}
                        </div>
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

                    {isAllItemsOpen && visibleStations.map((station) => (
                        <section key={station} className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                                    {station}
                                </h2>
                                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {stationsMap[station].map((item) => (
                                    <FoodCard
                                        key={item.recipe_number}
                                        item={item}
                                        station={station}
                                        mealPeriod={selectedPeriod}
                                        onClick={() => {
                                            setSelectedItemForModal(item)
                                            setSelectedItemStation(station)
                                        }}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>

            {sortedStations.length === 0 && (
                <div className="text-center py-20 px-6 rounded-3xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/50">
                    <p className="text-zinc-500 font-medium">
                        No food items found for <span className="text-zinc-900 dark:text-zinc-100 font-bold">{getMealPeriodLabel(selectedPeriod)}</span> on this date.
                    </p>
                    {hideCondiments && (
                        <button
                            onClick={() => setHideCondiments(false)}
                            className="mt-4 text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline"
                        >
                            Try showing condiments & drinks
                        </button>
                    )}
                </div>
            )}
            {selectedItemForModal && (
                <FoodModal
                    item={selectedItemForModal}
                    station={selectedItemStation}
                    mealPeriod={selectedPeriod}
                    isOpen={!!selectedItemForModal}
                    onClose={() => setSelectedItemForModal(null)}
                />
            )}
        </div>
    )
}
