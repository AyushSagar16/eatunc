'use client'

import React from 'react'

export type FilterOption = 'protein' | 'calories' | 'fat' | 'balanced'

interface FilterPillsProps {
    activeFilters: FilterOption[]
    onToggleFilter: (filter: FilterOption) => void
}

export default function FilterPills({ activeFilters, onToggleFilter }: FilterPillsProps) {
    const filters: { id: FilterOption; label: string; description: string }[] = [
        { id: 'protein', label: 'High Protein', description: '20g+ protein' },
        { id: 'calories', label: 'Low Calorie', description: 'Under 350 kcal' },
        { id: 'fat', label: 'Low Fat', description: 'Under 8g fat' },
        { id: 'balanced', label: 'Balanced', description: 'Optimal macro ratios' },
    ]

    return (
        <div className="flex flex-wrap gap-2 py-4">
            {filters.map((f) => {
                const isActive = activeFilters.includes(f.id)
                return (
                    <button
                        key={f.id}
                        onClick={() => onToggleFilter(f.id)}
                        title={f.description}
                        className={`
                            px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 border
                            ${isActive
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'bg-transparent border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300'
                            }
                        `}
                    >
                        {f.label}
                    </button>
                )
            })}
        </div>
    )
}
