'use client'

import { useState, useMemo, useEffect } from 'react'
import { MasterFoodItem } from '@/lib/api'
import FoodCard from '@/components/FoodCard'
import FoodModal from '@/components/FoodModal'
import MealPeriodSelector from '@/components/MealPeriodSelector'
import HealthyPicksSelector, { HealthyPreset } from '@/components/HealthyPicksSelector'
import { calculateHealthyScore, getMealPeriodLabel } from '@/lib/utils'

interface MenuEntry {
    meal_period: string
    meal_station: string | null
    recipe_number: number
    master_food_items: MasterFoodItem | null
}

interface MenuContainerProps {
    allEntries: MenuEntry[]
    availablePeriods: string[]
}

export default function MenuContainer({ allEntries, availablePeriods }: MenuContainerProps) {
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


    // Healthy Picks state
    const [showHealthy, setShowHealthy] = useState(true)
    const [healthyPreset, setHealthyPreset] = useState<HealthyPreset>('balanced')
    const [strictness, setStrictness] = useState(50)
    const [isAllItemsOpen, setIsAllItemsOpen] = useState(false)
    const [selectedItemForModal, setSelectedItemForModal] = useState<MasterFoodItem | null>(null)
    const [selectedItemStation, setSelectedItemStation] = useState<string>('')

    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'recommended' | 'calories' | 'protein' | 'fat' | 'alphabetical'>('recommended')

    const baseFilteredItems = useMemo(() => {
        const items: { item: MasterFoodItem; station: string }[] = []

        const beverageKeywords = ['beverage', 'drink', 'coffee', 'tea', 'soda', 'juice', 'condiment', 'sauce', 'dressing', 'toppings', 'packets']
        const foodKeywords = ['mustard', 'ketchup', 'mayo', 'relish', 'hot sauce', 'soy sauce', 'syrup', 'salt', 'pepper', 'sugar', 'creamer', 'dressing', 'vinaigrette', 'jam', 'jelly', 'honey', 'water', 'juice', 'milk', 'coffee', 'tea', 'coke', 'sprite']

        allEntries.forEach(entry => {
            if (entry.meal_period === selectedPeriod && entry.master_food_items) {
                const item = entry.master_food_items
                const station = entry.meal_station || 'Other'

                // Search Filter
                if (searchQuery && !item.food_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
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
    }, [allEntries, selectedPeriod, hideCondiments, searchQuery])

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
        if (!showHealthy) return []

        const includeUnknownNutrition = false

        const picks = baseFilteredItems
            .filter(({ item }) => {
                const cal = item.calories_kcal
                const protein = item.protein_g
                const fat = item.fat_g
                const carbs = item.carbohydrates_g

                // Exclude if any nutritional value is missing unless flag is on
                if (!includeUnknownNutrition) {
                    if (cal === null || protein === null || fat === null || carbs === null) {
                        return false
                    }
                }

                return true
            })
            .map(({ item, station }) => {
                const cal = item.calories_kcal ?? 0
                const protein = item.protein_g ?? 0
                const fat = item.fat_g ?? 0
                const carbs = item.carbohydrates_g ?? 0

                const score = calculateHealthyScore(item, healthyPreset)
                let reason = ""

                switch (healthyPreset) {
                    case 'protein':
                        reason = "High protein for calories"
                        break
                    case 'calories':
                        reason = "Low calorie option"
                        break
                    case 'fat':
                        reason = "Low fat option"
                        break
                    case 'balanced':
                    default:
                        reason = "Balanced macros"
                        break
                }

                return { item, station, score, reason }
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)

        return applyGlobalSort(picks);
    }, [baseFilteredItems, showHealthy, healthyPreset, sortBy])

    const highProteinItems = useMemo(() => {
        if (!showHealthy) return []
        const items = baseFilteredItems
            .filter(({ item }) => (item.protein_g ?? 0) >= 20)
            .sort((a, b) => {
                if (b.item.protein_g !== a.item.protein_g) {
                    return (b.item.protein_g ?? 0) - (a.item.protein_g ?? 0)
                }
                return (a.item.calories_kcal ?? 0) - (b.item.calories_kcal ?? 0)
            })
            .slice(0, 12)

        return applyGlobalSort(items);
    }, [baseFilteredItems, showHealthy, sortBy])

    const lowCalorieItems = useMemo(() => {
        if (!showHealthy) return []
        const items = baseFilteredItems
            .filter(({ item }) => (item.calories_kcal ?? 0) <= 350 && (item.calories_kcal ?? 0) > 0)
            .sort((a, b) => {
                if (a.item.calories_kcal !== b.item.calories_kcal) {
                    return (a.item.calories_kcal ?? 0) - (b.item.calories_kcal ?? 0)
                }
                return (b.item.protein_g ?? 0) - (a.item.protein_g ?? 0)
            })
            .slice(0, 12)

        return applyGlobalSort(items);
    }, [baseFilteredItems, showHealthy, sortBy])

    const lowFatItems = useMemo(() => {
        if (!showHealthy) return []
        const items = baseFilteredItems
            .filter(({ item }) => (item.fat_g ?? 0) <= 8 && (item.calories_kcal ?? 0) > 0)
            .sort((a, b) => {
                if (a.item.fat_g !== b.item.fat_g) {
                    return (a.item.fat_g ?? 0) - (b.item.fat_g ?? 0)
                }
                return (b.item.protein_g ?? 0) - (a.item.protein_g ?? 0)
            })
            .slice(0, 12)

        return applyGlobalSort(items);
    }, [baseFilteredItems, showHealthy, sortBy])

    const stationsMap = useMemo(() => {
        const map: Record<string, MasterFoodItem[]> = {}

        // We use baseFilteredItems but need to keep station association
        const itemsWithStations: { item: MasterFoodItem; station: string }[] = []
        const beverageKeywords = ['beverage', 'drink', 'coffee', 'tea', 'soda', 'juice', 'condiment', 'sauce', 'dressing', 'toppings', 'packets']
        const foodKeywords = ['mustard', 'ketchup', 'mayo', 'relish', 'hot sauce', 'soy sauce', 'syrup', 'salt', 'pepper', 'sugar', 'creamer', 'dressing', 'vinaigrette', 'jam', 'jelly', 'honey', 'water', 'juice', 'milk', 'coffee', 'tea', 'coke', 'sprite']

        allEntries.forEach(entry => {
            if (entry.meal_period === selectedPeriod && entry.master_food_items) {
                const item = entry.master_food_items
                const station = entry.meal_station || 'Other'

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
    }, [allEntries, selectedPeriod, hideCondiments, searchQuery, sortBy])

    const sortedStations = useMemo(() => {
        return Object.keys(stationsMap).sort((a, b) => {
            const bottomStations = ['beverages', 'condiments', 'spreads', 'cereal', 'breads', 'bakery', 'dessert']
            const isABottom = bottomStations.some(s => a.toLowerCase().includes(s))
            const isBBottom = bottomStations.some(s => b.toLowerCase().includes(s))

            if (isABottom && !isBBottom) return 1
            if (!isABottom && isBBottom) return -1
            return a.localeCompare(b)
        })
    }, [stationsMap])

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                {availablePeriods.length > 0 && (
                    <MealPeriodSelector
                        periods={availablePeriods}
                        selectedPeriod={selectedPeriod}
                        onPeriodChange={setSelectedPeriod}
                    />
                )}

                <label className="flex items-center gap-3 cursor-pointer group mb-1">
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={hideCondiments}
                            onChange={(e) => setHideCondiments(e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-11 h-6 transition-colors rounded-full border border-zinc-200 dark:border-zinc-800 ${hideCondiments ? 'bg-blue-600' : 'bg-zinc-100 dark:bg-zinc-900'}`} />
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${hideCondiments ? 'translate-x-5' : 'translate-x-0'} shadow-sm`} />
                    </div>
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                        Hide condiments & drinks
                    </span>
                </label>
            </div>

            <HealthyPicksSelector
                showHealthy={showHealthy}
                onToggleHealthy={setShowHealthy}
                preset={healthyPreset}
                onPresetChange={setHealthyPreset}
                strictness={strictness}
                onStrictnessChange={setStrictness}
            />

            {/* Search and Sort Panel */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search items (e.g., chicken, yogurt, tofu)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/40 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-50 placeholder-zinc-400"
                    />
                </div>

                <div className="relative w-full md:w-64 group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h10M3 12h10M4 17v4m0 0l-3-3m3 3l3-3M21 4v16m0 0l-3-3m3 3l3-3" />
                        </svg>
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full pl-12 pr-10 py-4 rounded-2xl bg-white/40 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-50 appearance-none font-medium cursor-pointer"
                    >
                        <option value="recommended">Recommended</option>
                        <option value="calories">Calories (Low → High)</option>
                        <option value="protein">Protein (High → Low)</option>
                        <option value="fat">Fat (Low → High)</option>
                        <option value="alphabetical">Alphabetical</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            <div key={selectedPeriod} className="flex flex-col gap-12 transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-2">
                {showHealthy && healthyPicks.length > 0 && (
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-black italic tracking-tight text-green-600 dark:text-green-500">
                                TOP PICKS
                            </h2>
                            <div className="h-px flex-1 bg-green-100 dark:bg-green-900/30" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {healthyPicks.map(({ item, station, reason }) => (
                                <FoodCard
                                    key={`pick-${item.recipe_number}`}
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

                <div className="flex flex-col gap-12">
                    {showHealthy && (
                        <>
                            {highProteinItems.length > 0 && (
                                <section className="flex flex-col gap-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl font-black italic tracking-tight text-zinc-900 dark:text-zinc-100">
                                            HIGH PROTEIN
                                        </h2>
                                        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                        <span className="text-[10px] font-bold text-zinc-400">20G+ PROTEIN</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {highProteinItems.map(({ item, station }) => (
                                            <FoodCard
                                                key={`hp-${item.recipe_number}`}
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
                            )}

                            {lowCalorieItems.length > 0 && (
                                <section className="flex flex-col gap-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl font-black italic tracking-tight text-zinc-900 dark:text-zinc-100">
                                            LOW CALORIE
                                        </h2>
                                        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                        <span className="text-[10px] font-bold text-zinc-400">UNDER 350 KCAL</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {lowCalorieItems.map(({ item, station }) => (
                                            <FoodCard
                                                key={`lc-${item.recipe_number}`}
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
                            )}

                            {lowFatItems.length > 0 && (
                                <section className="flex flex-col gap-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl font-black italic tracking-tight text-zinc-900 dark:text-zinc-100">
                                            LOW FAT
                                        </h2>
                                        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                        <span className="text-[10px] font-bold text-zinc-400">UNDER 8G FAT</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {lowFatItems.map(({ item, station }) => (
                                            <FoodCard
                                                key={`lf-${item.recipe_number}`}
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
                            )}
                        </>
                    )}

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

                        {isAllItemsOpen && sortedStations.map((station) => (
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
        </div>
    )
}
