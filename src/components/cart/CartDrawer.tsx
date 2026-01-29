'use client'

/**
 * Cart Drawer
 * 
 * Slide-out drawer displaying cart items, totals, and save/clear actions.
 */

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IconX, IconTrash } from '@tabler/icons-react'
import { useCartStore } from '@/stores/cartStore'
import { CartItem } from './CartItem'
import { CartTotals } from './CartTotals'
import { SaveMealButton } from './SaveMealButton'

export function CartDrawer() {
    const items = useCartStore((state) => state.items)
    const isOpen = useCartStore((state) => state.isOpen)
    const setIsOpen = useCartStore((state) => state.setIsOpen)
    const clearCart = useCartStore((state) => state.clearCart)

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false)
            }
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [isOpen, setIsOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-gray-900 border-l border-white/10 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-lg font-bold text-white">Meal Cart</h2>
                            <div className="flex items-center gap-2">
                                {items.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <IconTrash className="w-4 h-4" />
                                        Clear
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                    aria-label="Close cart"
                                >
                                    <IconX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-white mb-1">Your cart is empty</h3>
                                    <p className="text-sm text-zinc-500 max-w-[200px]">
                                        Add items from the menu to track your meal macros.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {items.map((item) => (
                                            <CartItem key={item.recipe_number} item={item} />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Footer with totals and save */}
                        {items.length > 0 && (
                            <div className="p-4 border-t border-white/10 space-y-4">
                                <CartTotals />
                                <SaveMealButton />
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
