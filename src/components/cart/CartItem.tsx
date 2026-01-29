'use client'

/**
 * Cart Item
 * 
 * Individual cart item row with quantity controls and macro display.
 */

import { motion } from 'motion/react'
import { IconMinus, IconPlus, IconTrash } from '@tabler/icons-react'
import { useCartStore, CartItem as CartItemType } from '@/stores/cartStore'

interface CartItemProps {
    item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
    const incrementServings = useCartStore((state) => state.incrementServings)
    const decrementServings = useCartStore((state) => state.decrementServings)
    const removeItem = useCartStore((state) => state.removeItem)

    const totalCalories = Math.round(item.calories_per_serving * item.servings)
    const totalProtein = Math.round(item.protein_per_serving * item.servings * 10) / 10
    const totalCarbs = Math.round(item.carbs_per_serving * item.servings * 10) / 10
    const totalFat = Math.round(item.fat_per_serving * item.servings * 10) / 10

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 bg-white/5 border border-white/10 rounded-xl"
        >
            {/* Header: Name + Remove button */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <h4 className="font-medium text-white line-clamp-2 flex-1">
                    {item.food_name}
                </h4>
                <button
                    onClick={() => removeItem(item.recipe_number)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    aria-label="Remove item"
                >
                    <IconTrash className="w-4 h-4" />
                </button>
            </div>

            {/* Macros row */}
            <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
                <span className="text-white font-semibold">{totalCalories} kcal</span>
                <span>P: {totalProtein}g</span>
                <span>C: {totalCarbs}g</span>
                <span>F: {totalFat}g</span>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">Servings:</span>
                <div className="flex items-center gap-1 ml-auto">
                    <button
                        onClick={() => decrementServings(item.recipe_number)}
                        className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
                        aria-label="Decrease servings"
                    >
                        <IconMinus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold text-white">
                        {item.servings}
                    </span>
                    <button
                        onClick={() => incrementServings(item.recipe_number)}
                        className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
                        aria-label="Increase servings"
                    >
                        <IconPlus className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
