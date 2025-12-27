'use client'

import React from 'react'
import { motion } from 'motion/react'

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
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.05
                    }
                }
            }}
            className="flex flex-wrap gap-2 py-4"
        >
            {filters.map((f) => {
                const isActive = activeFilters.includes(f.id)
                return (
                    <motion.button
                        key={f.id}
                        variants={{
                            hidden: { opacity: 0, scale: 0.8 },
                            visible: { opacity: 1, scale: 1 }
                        }}
                        onClick={() => onToggleFilter(f.id)}
                        title={f.description}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        animate={{
                            backgroundColor: isActive ? 'rgb(37, 99, 235)' : 'transparent',
                            borderColor: isActive ? 'rgb(37, 99, 235)' : 'rgb(228, 228, 231)',
                            color: isActive ? 'rgb(255, 255, 255)' : 'rgb(113, 113, 122)'
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                        }}
                        className={`
                            px-5 py-2 rounded-full text-sm font-bold border
                            ${isActive
                                ? 'shadow-md shadow-blue-500/20'
                                : 'dark:border-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300'
                            }
                        `}
                    >
                        {f.label}
                    </motion.button>
                )
            })}
        </motion.div>
    )
}
