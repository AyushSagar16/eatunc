'use client'

import { MasterFoodItem } from '@/lib/api'
import { getMealPeriodLabel } from '@/lib/utils'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { DIETARY_ICON_MAP, parseDietaryPreferences } from '@/components/icons/DietaryIcons'

// Mapping of dietary preference keys to display names
const DIETARY_DISPLAY_NAMES: Record<string, string> = {
    'vegan': 'Vegan',
    'vegetarian': 'Vegetarian',
    'made without gluten': 'Gluten Free',
    'halal': 'Halal',
    'local': 'Local',
    'organic': 'Organic',
    'smart choice': 'Smart Choice',
    'sustainable seafood': 'Sustainable Seafood',
    'coolfood': 'Coolfood',
}

interface FoodModalProps {
    item: MasterFoodItem
    station: string
    mealPeriod: string
    isOpen: boolean
    onClose: () => void
}

// Helper function to parse comma-separated allergens string
function parseAllergens(allergensString: string | null): string[] {
    if (!allergensString) return []
    return allergensString.split(',').map(a => a.trim())
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

    const allergens = parseAllergens(item.allergens)
    const dietaryPrefs = parseDietaryPreferences(item.dietary_preferences)

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        transition={{
                            duration: 0.2,
                            ease: "easeOut"
                        }}
                        className="relative w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    >
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-6 top-6 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 transition-colors z-10"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>

                        <motion.div
                            className="flex flex-col gap-6"
                        >
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

                            <div
                                className="grid grid-cols-2 gap-6 py-6 border-y border-zinc-100 dark:border-zinc-800"
                            >
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-1">Total Calories</span>
                                    <span
                                        className="text-5xl font-black text-blue-600 dark:text-blue-400"
                                    >
                                        {calories_kcal ?? 0}
                                        <span className="ml-2 text-lg font-normal text-zinc-400">kcal</span>
                                    </span>
                                    {amount_per_serving && (
                                        <div className="mt-2">
                                            <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Serving: </span>
                                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{amount_per_serving}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Dietary Preferences - inline on mobile */}
                                {dietaryPrefs.length > 0 && (
                                    <div className="flex flex-col justify-center sm:hidden">
                                        <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Dietary</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {dietaryPrefs.map((pref) => {
                                                const IconComponent = DIETARY_ICON_MAP[pref]
                                                if (!IconComponent) return null

                                                return (
                                                    <div
                                                        key={pref}
                                                        className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 flex items-center justify-center"
                                                        title={DIETARY_DISPLAY_NAMES[pref] || pref}
                                                    >
                                                        <IconComponent className="w-4 h-4" />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div
                                className="grid grid-cols-3 gap-4"
                            >
                                <NutrientHighlight label="Protein" value={protein_g} unit="g" color="text-emerald-600 dark:text-emerald-400" bgColor="bg-emerald-500/10" />
                                <NutrientHighlight label="Carbs" value={carbohydrates_g} unit="g" color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-500/10" />
                                <NutrientHighlight label="Fat" value={fat_g} unit="g" color="text-rose-600 dark:text-rose-400" bgColor="bg-rose-500/10" />
                            </div>

                            {/* Dietary Preferences Section - full display on desktop only */}
                            {dietaryPrefs.length > 0 && (
                                <div className="hidden sm:block mt-2 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                    <h3 className="text-sm font-bold text-green-900 dark:text-green-200 mb-3">
                                        Dietary Information
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {dietaryPrefs.map((pref) => {
                                            const IconComponent = DIETARY_ICON_MAP[pref]
                                            if (!IconComponent) return null

                                            return (
                                                <div
                                                    key={pref}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-green-200 dark:border-green-700"
                                                >
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <IconComponent className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-xs font-medium text-green-800 dark:text-green-300">
                                                        {DIETARY_DISPLAY_NAMES[pref] || pref}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Allergens Section */}
                            {allergens.length > 0 && (
                                <div className="mt-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-2">
                                        Allergens
                                    </h3>
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        {allergens.join(', ')}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

function NutrientHighlight({ label, value, unit, color, bgColor }: { label: string, value: number | null, unit: string, color: string, bgColor: string }) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className={`flex flex-col items-center gap-1 rounded-2xl p-4 ${bgColor}`}
        >
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</span>
            <div className={`flex items-baseline gap-0.5 ${color}`}>
                <span className="text-xl font-black">{value ?? 0}</span>
                <span className="text-xs font-bold opacity-70">{unit}</span>
            </div>
        </motion.div>
    )
}
