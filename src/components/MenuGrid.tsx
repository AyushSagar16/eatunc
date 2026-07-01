'use client'

import React from 'react'
import { MasterFoodItem } from '@/lib/api'
import FoodCard from '@/components/FoodCard'

interface MenuItem {
    item: MasterFoodItem
    station: string
    reason?: string
    score?: number
}

interface MenuGridProps {
    items: MenuItem[]
    selectedPeriod: string
    onItemClick: (item: MasterFoodItem, station: string) => void
    isLoading?: boolean
}

export default function MenuGrid({ items, selectedPeriod, onItemClick, isLoading }: MenuGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-[280px] rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                ))}
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 px-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 mb-8 rounded-3xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 dark:text-zinc-600 shadow-border">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
                    No results found
                </h3>
                <p className="text-zinc-500 dark:text-zinc-500 max-w-sm font-medium leading-relaxed">
                    We couldn't find any items matching your criteria. Try adjusting your filters or search query.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 stagger-children">
            {items.map((entry, idx) => (
                <FoodCard
                    key={`${entry.item.recipe_number}-${idx}`}
                    item={entry.item}
                    station={entry.station}
                    reason={entry.reason}
                    mealPeriod={selectedPeriod}
                    onClick={() => onItemClick(entry.item, entry.station)}
                />
            ))}
        </div>
    )
}
