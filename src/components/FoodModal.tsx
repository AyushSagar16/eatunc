'use client'

import { MasterFoodItem } from '@/lib/api'
import { getMealPeriodLabel } from '@/lib/utils'
import { useEffect } from 'react'

interface FoodModalProps {
    item: MasterFoodItem
    station: string
    mealPeriod: string
    isOpen: boolean
    onClose: () => void
}

export default function FoodModal({
    item,
    station,
    mealPeriod,
    isOpen,
    onClose
}: FoodModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const {
        food_name,
        calories_kcal,
        protein_g,
        carbohydrates_g,
        fat_g,
        amount_per_serving
    } = item

    const isHighProtein = (protein_g ?? 0) >= 20
    const isLowCal = (calories_kcal ?? 0) <= 350 && (calories_kcal ?? 0) > 0
    const isLowFat = (fat_g ?? 0) <= 8 && (calories_kcal ?? 0) > 0

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 transition-colors z-10"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                Nutritional Details
                            </span>
                            {isHighProtein && (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    High Protein
                                </span>
                            )}
                            {isLowCal && (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                    Low Cal
                                </span>
                            )}
                            {isLowFat && (
                                <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                                    Low Fat
                                </span>
                            )}
                        </div>
                        <h2 id="modal-title" className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                            {food_name || 'Unknown Item'}
                        </h2>
                        <p className="mt-2 text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em]">
                            {getMealPeriodLabel(mealPeriod)} • {station}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 py-6 border-y border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-1">Total Calories</span>
                            <span className="text-5xl font-black text-blue-600 dark:text-blue-400">
                                {calories_kcal ?? 0}
                                <span className="ml-2 text-lg font-normal text-zinc-400">kcal</span>
                            </span>
                        </div>
                        {amount_per_serving && (
                            <div className="flex flex-col justify-end">
                                <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-1">Serving Size</span>
                                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{amount_per_serving}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <NutrientHighlight label="Protein" value={protein_g} unit="g" color="text-emerald-600 dark:text-emerald-400" bgColor="bg-emerald-500/10" />
                        <NutrientHighlight label="Carbs" value={carbohydrates_g} unit="g" color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-500/10" />
                        <NutrientHighlight label="Fat" value={fat_g} unit="g" color="text-rose-600 dark:text-rose-400" bgColor="bg-rose-500/10" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function NutrientHighlight({ label, value, unit, color, bgColor }: { label: string, value: number | null, unit: string, color: string, bgColor: string }) {
    return (
        <div className={`flex flex-col items-center gap-1 rounded-2xl p-4 ${bgColor}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</span>
            <div className={`flex items-baseline gap-0.5 ${color}`}>
                <span className="text-xl font-black">{value ?? 0}</span>
                <span className="text-xs font-bold opacity-70">{unit}</span>
            </div>
        </div>
    )
}
