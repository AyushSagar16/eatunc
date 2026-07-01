'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, AlertTriangle, Clock } from 'lucide-react'

interface CDSBannerProps {
    className?: string
}

/**
 * CDS Safety Announcement Banner
 * Shows important safety messages about dining hall hours
 * Appears until January 29th, 2026
 */
export default function CDSBanner({ className = '' }: CDSBannerProps) {
    // Initialize state with values from sessionStorage to avoid sync setState in effect
    const isVisible = useState(() => {
        if (typeof window === 'undefined') return false
        const now = new Date()
        const estTimeString = now.toLocaleDateString('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) // Returns YYYY-MM-DD
        return estTimeString <= '2026-01-29'
    })[0]

    const [isDismissed, setIsDismissed] = useState(() => {
        if (typeof window === 'undefined') return false
        return sessionStorage.getItem('cds_banner_dismissed') !== null
    })

    const handleDismiss = () => {
        setIsDismissed(true)
        sessionStorage.setItem('cds_banner_dismissed', 'true')
    }

    if (!isVisible || isDismissed) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, transition: { duration: 0.15, ease: 'easeOut' } }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`w-full bg-red-500 text-white relative overflow-hidden ${className}`}
            >

                <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 relative z-10">
                    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                className="flex-shrink-0"
                            >
                                <AlertTriangle className="w-5 h-5 text-yellow-200" />
                            </motion.div>
                            <div className="flex items-center gap-2 min-w-0">
                                <p className="text-sm font-medium">
                                    <span className="font-bold">Message from UNC CDS:</span>{' '}
                                    To ensure the safety of our staff, Chase Dining Hall and Subway/Rams Market will end their late night service at 10pm through Thursday, January 29th.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="relative flex-shrink-0 p-1.5 hover:bg-white/20 rounded-full transition-[background-color,transform] duration-150 ease-out active:scale-[0.96] before:content-[''] before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:h-11 before:w-11"
                            aria-label="Dismiss CDS announcement"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}