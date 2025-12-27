'use client'

import { getMealPeriodLabel } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import DiningHallSelector from './DiningHallSelector'
import { motion } from 'motion/react'

interface MenuHeaderProps {
    // Date props
    dates: string[]
    selectedDate: string
    // Meal props
    periods: string[]
    selectedPeriod: string
    onPeriodChange: (period: string) => void
    // Dining Hall Props
    diningHalls: string[]
    selectedHall: string
    onHallChange?: (hall: string) => void
    // Search & Sort props
    searchQuery: string
    onSearchChange: (query: string) => void
    sortBy: 'recommended' | 'calories' | 'protein' | 'fat' | 'alphabetical'
    onSortChange: (sort: 'recommended' | 'calories' | 'protein' | 'fat' | 'alphabetical') => void
    // Toggle props
    hideCondiments: boolean
    onToggleCondiments: (hide: boolean) => void
}

const HALL_SLUGS: Record<string, string> = {
    'Chase': 'chase',
    'Top of Lenoir': 'lenoir',
}

export default function MenuHeader({
    dates,
    selectedDate,
    periods,
    selectedPeriod,
    onPeriodChange,
    diningHalls,
    selectedHall,
    onHallChange,
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    hideCondiments,
    onToggleCondiments
}: MenuHeaderProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleDateChange = (date: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('date', date)
        router.push(`/?${params.toString()}`)
    }

    const handleHallChange = (hall: string) => {
        const params = new URLSearchParams(searchParams.toString())
        const slug = HALL_SLUGS[hall] || 'chase'
        params.set('hall', slug)
        router.push(`/?${params.toString()}`)
    }

    return (
        <header className="sticky top-0 z-[60] w-full bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">

                    {/* Left: Date & Meal Selectors */}
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        {/* Date Stepper */}
                        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                            <motion.button
                                onClick={() => {
                                    const currIdx = dates.indexOf(selectedDate);
                                    if (currIdx > 0) handleDateChange(dates[currIdx - 1]);
                                }}
                                disabled={dates.indexOf(selectedDate) <= 0}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-white dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </motion.button>

                            <div className="px-3 min-w-[120px] text-center font-bold text-sm text-zinc-900 dark:text-zinc-50">
                                {new Date(selectedDate).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    timeZone: 'UTC',
                                })}
                            </div>

                            <motion.button
                                onClick={() => {
                                    const currIdx = dates.indexOf(selectedDate);
                                    if (currIdx < dates.length - 1) handleDateChange(dates[currIdx + 1]);
                                }}
                                disabled={dates.indexOf(selectedDate) >= dates.length - 1}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-white dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </motion.button>
                        </div>

                        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

                        <div className="relative group">
                            <select
                                value={selectedPeriod}
                                onChange={(e) => onPeriodChange(e.target.value)}
                                className="pl-4 pr-10 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 text-sm font-bold text-zinc-900 dark:text-zinc-50 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                {periods.map((period) => {
                                    // Helper to capitalize the first letter of each word
                                    const capitalizeWords = (str: string) => {
                                        return str.replace(/\b\w/g, l => l.toUpperCase());
                                    };

                                    return (
                                        <option key={period} value={period}>
                                            {capitalizeWords(period)}
                                        </option>
                                    );
                                })}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>

                        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

                        <DiningHallSelector
                            halls={diningHalls}
                            selectedHall={selectedHall}
                            onHallChange={onHallChange || handleHallChange}
                        />
                    </div>

                    {/* Middle: Search bar */}
                    <div className="flex-1 relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm placeholder-zinc-400 dark:text-zinc-50"
                        />
                    </div>

                    {/* Right: Sort & Toggle */}
                    <div className="flex items-center gap-3 ml-auto">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={hideCondiments}
                                    onChange={(e) => onToggleCondiments(e.target.checked)}
                                    className="sr-only"
                                />
                                <motion.div
                                    animate={{
                                        backgroundColor: hideCondiments ? 'rgb(37, 99, 235)' : 'rgb(228, 228, 231)'
                                    }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className="w-9 h-5 rounded-full border border-zinc-200 dark:border-zinc-800"
                                />
                                <motion.div
                                    animate={{
                                        x: hideCondiments ? 16 : 0
                                    }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm"
                                />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors whitespace-nowrap">
                                Hide Extras
                            </span>
                        </label>

                        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => onSortChange(e.target.value as any)}
                                className="pl-8 pr-10 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 text-xs font-bold text-zinc-900 dark:text-zinc-50 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                <option value="recommended">Best Match</option>
                                <option value="calories">Calories</option>
                                <option value="protein">Protein</option>
                                <option value="fat">Fat</option>
                                <option value="alphabetical">A-Z</option>
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 7 4-4 4 4m-4-4v14m14-4-4 4-4-4m4-4v14" /></svg>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </header>
    )
}
