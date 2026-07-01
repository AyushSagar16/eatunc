'use client'

import { motion } from 'motion/react'
import { getMealPeriodLabel } from '@/lib/utils'

interface MealPeriodSelectorProps {
    periods: string[]
    selectedPeriod: string
    onPeriodChange: (period: string) => void
}

export default function MealPeriodSelector({ periods, selectedPeriod, onPeriodChange }: MealPeriodSelectorProps) {
    return (
        <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 ml-1">
                Meal Period
            </span>
            <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl shadow-border transition-[box-shadow] duration-150 ease-out hover:shadow-border-hover w-fit">
                {periods.map((period) => {
                    const isActive = period === selectedPeriod
                    return (
                        <motion.button
                            key={period}
                            onClick={() => onPeriodChange(period)}
                            whileTap={{ scale: 0.96 }}
                            className={`
                                relative px-6 py-2 rounded-xl text-sm font-bold transition-colors duration-150 ease-out
                                ${isActive
                                    ? 'text-zinc-900 dark:text-zinc-50'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mealPeriodActivePill"
                                    transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                                    className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-border"
                                />
                            )}
                            <span className="relative z-10">{getMealPeriodLabel(period)}</span>
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}
