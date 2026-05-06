'use client'

import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/stores/cart'

interface CartButtonProps {
    className?: string
}

export default function CartButton({ className = '' }: CartButtonProps) {
    const items = useCart((s) => s.items)
    const setOpen = useCart((s) => s.setOpen)
    const count = items.reduce((acc, i) => acc + (i.servings || 1), 0)
    const hasItems = items.length > 0

    return (
        <motion.button
            type="button"
            aria-label={`Open cart (${items.length} items)`}
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className={`fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-white shadow-xl shadow-navy-900/30 ring-1 ring-white/10 transition-colors hover:bg-navy-800 ${className}`}
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0)',
            }}
        >
            <ShoppingBag className="h-5 w-5" strokeWidth={2.25} />
            <AnimatePresence>
                {hasItems && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                        className="absolute -top-1 -right-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-carolina-500 px-1.5 text-xs font-bold text-navy-900 ring-2 ring-white"
                        aria-hidden="true"
                    >
                        {count >= 100 ? '99+' : Math.round(count)}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    )
}
