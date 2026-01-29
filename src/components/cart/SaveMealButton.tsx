'use client'

/**
 * Save Meal Button
 * 
 * Button to save cart items as a meal log entry.
 * Opens a modal to select meal type.
 */

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IconCheck, IconLoader2, IconX } from '@tabler/icons-react'
import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/hooks/useAuth'
import { saveMealLog } from '@/app/dashboard/actions'

const MEAL_TYPES = [
    { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { id: 'lunch', label: 'Lunch', icon: '☀️' },
    { id: 'dinner', label: 'Dinner', icon: '🌙' },
    { id: 'snack', label: 'Snack', icon: '🍎' },
] as const

type MealType = typeof MEAL_TYPES[number]['id']

export function SaveMealButton() {
    const { isAuthenticated, profile } = useAuth()
    const items = useCartStore((state) => state.items)
    const clearCart = useCartStore((state) => state.clearCart)
    const setIsOpen = useCartStore((state) => state.setIsOpen)

    const [showModal, setShowModal] = useState(false)
    const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSave = () => {
        if (!isAuthenticated || !profile) {
            setError('Please log in to save meals')
            return
        }

        setError(null)

        startTransition(async () => {
            const result = await saveMealLog({
                mealType: selectedMeal,
                items: items.map(item => ({
                    recipe_number: item.recipe_number,
                    food_name: item.food_name,
                    servings: item.servings,
                    calories_per_serving: item.calories_per_serving,
                    protein_per_serving: item.protein_per_serving,
                    carbs_per_serving: item.carbs_per_serving,
                    fat_per_serving: item.fat_per_serving,
                })),
            })

            if (result.success) {
                setSuccess(true)
                clearCart()
                setTimeout(() => {
                    setShowModal(false)
                    setIsOpen(false)
                    setSuccess(false)
                }, 1500)
            } else {
                setError(result.error || 'Failed to save meal')
            }
        })
    }

    if (!isAuthenticated) {
        return (
            <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-sm text-zinc-400">
                    <a href="/auth/login" className="text-blue-400 hover:underline">Log in</a> to save meals to your tracker
                </p>
            </div>
        )
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
            >
                Log This Meal
            </button>

            {/* Meal Type Selection Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80"
                            onClick={() => !isPending && setShowModal(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-sm bg-gray-800 border border-white/10 rounded-2xl p-6"
                        >
                            {success ? (
                                <div className="text-center py-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                                    >
                                        <IconCheck className="w-8 h-8 text-green-400" />
                                    </motion.div>
                                    <h3 className="font-semibold text-white">Meal Logged!</h3>
                                    <p className="text-sm text-zinc-400 mt-1">Added to your daily tracker</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-white">Log as...</h3>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            disabled={isPending}
                                            className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <IconX className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {MEAL_TYPES.map((meal) => (
                                            <button
                                                key={meal.id}
                                                onClick={() => setSelectedMeal(meal.id)}
                                                disabled={isPending}
                                                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedMeal === meal.id
                                                        ? 'bg-blue-500/20 border-blue-500/50 text-white'
                                                        : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="text-lg">{meal.icon}</span>
                                                <span className="font-medium text-sm">{meal.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {error && (
                                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                            <p className="text-sm text-red-400">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSave}
                                        disabled={isPending}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isPending ? (
                                            <>
                                                <IconLoader2 className="w-5 h-5 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <IconCheck className="w-5 h-5" />
                                                Save {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
