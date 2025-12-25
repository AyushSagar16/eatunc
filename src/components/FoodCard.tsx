'use client'

import { useState } from 'react'
import { MasterFoodItem } from '@/lib/api'
import FoodModal from './FoodModal'

interface FoodCardProps {
    item: MasterFoodItem
    station: string
    reason?: string
    mealPeriod: string
    onClick: () => void
}

export default function FoodCard({ item, station, reason, mealPeriod, onClick }: FoodCardProps) {
    const {
        food_name,
        calories_kcal,
        protein_g,
        fat_g,
    } = item

    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white/40 p-6 backdrop-blur-md transition-all hover:bg-white/60 hover:shadow-2xl hover:shadow-blue-500/10 dark:bg-zinc-900/50 dark:border-zinc-800 h-full"
        >
            <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-colors" />

            <div className="flex flex-col gap-4 flex-1">
                {reason && (
                    <div className="w-fit px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                        <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-tighter">
                            {reason}
                        </span>
                    </div>
                )}
                <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug flex-1">
                    {food_name || 'Unknown Item'}
                </h3>

                <div className="flex items-end justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-bold">Calories</span>
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                            {calories_kcal ?? 0}
                            <span className="ml-1 text-sm font-normal text-zinc-400">kcal</span>
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5 items-end mb-1">
                        {protein_g !== null && (
                            <div className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 whitespace-nowrap">P: {protein_g}g</span>
                            </div>
                        )}
                        {fat_g !== null && (
                            <div className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 whitespace-nowrap">F: {fat_g}g</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
