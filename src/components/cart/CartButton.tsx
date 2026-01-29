'use client'

/**
 * Cart Button
 * 
 * Floating action button that shows cart item count and opens the cart drawer.
 */

import { motion, AnimatePresence } from 'motion/react'
import { IconShoppingCart } from '@tabler/icons-react'
import { useCartStore } from '@/stores/cartStore'

export function CartButton() {
    const items = useCartStore((state) => state.items)
    const toggleCart = useCartStore((state) => state.toggleCart)

    const itemCount = items.reduce((sum, item) => sum + item.servings, 0)

    return (
        <motion.button
            onClick={toggleCart}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/25 transition-colors"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <IconShoppingCart className="w-5 h-5" />
            <span className="font-semibold">Cart</span>

            {/* Item count badge */}
            <AnimatePresence mode="wait">
                {itemCount > 0 && (
                    <motion.span
                        key={itemCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-2 -right-2 min-w-[24px] h-6 flex items-center justify-center px-1.5 bg-white text-blue-600 text-sm font-bold rounded-full"
                    >
                        {itemCount}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    )
}
