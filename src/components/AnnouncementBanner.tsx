'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import { X, Sparkles } from 'lucide-react'

interface AnnouncementBannerProps {
    /**
     * Expiration date in YYYY-MM-DD format (Eastern Time)
     * Banner will not show after this date
     */
    expirationDate: string
    className?: string
}

/**
 * Temporary announcement banner that disappears after a specified date
 * Used to announce new features temporarily
 */
export default function AnnouncementBanner({
    expirationDate,
    className = ''
}: AnnouncementBannerProps) {
    const router = useRouter()
    const [isVisible, setIsVisible] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    useEffect(() => {
        // Check if already dismissed in this session
        const dismissed = sessionStorage.getItem('announcement_dismissed')
        if (dismissed) {
            setIsDismissed(true)
            return
        }

        // Check if current date is past expiration (in Eastern Time)
        const now = new Date()
        const estTimeString = now.toLocaleDateString('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) // Returns YYYY-MM-DD

        // Compare dates - show banner if today is on or before expiration date
        if (estTimeString <= expirationDate) {
            setIsVisible(true)
        }
    }, [expirationDate])

    const handleDismiss = () => {
        setIsDismissed(true)
        sessionStorage.setItem('announcement_dismissed', 'true')
    }

    const handleCheckItOut = () => {
        // Mark tutorial as completed so it doesn't interrupt the filter demo
        // Users clicking this are likely returning users who just want to see the new filters
        localStorage.setItem('eatunc_tutorial_completed', 'true')

        // Navigate to lenoir menu with openFilter query param
        const now = new Date()
        const today = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(now)

        router.push(`/lenoir/${today}?openFilter=true`)
    }

    if (!isVisible || isDismissed) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, transition: { duration: 0.15, ease: 'easeOut' } }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white relative overflow-hidden ${className}`}
            >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

                <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 relative z-10">
                    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                className="flex-shrink-0"
                            >
                                <Sparkles className="w-5 h-5 text-yellow-200" />
                            </motion.div>
                            <p className="text-sm font-medium">
                                <span className="font-bold">New!</span>{' '}
                                Eat UNC now has dietary preference and allergen filters — find exactly what works for you!
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <motion.button
                                onClick={handleCheckItOut}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.96 }}
                                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-sm font-bold transition-colors whitespace-nowrap"
                            >
                                Check it out →
                            </motion.button>

                            <button
                                onClick={handleDismiss}
                                className="relative p-1.5 hover:bg-white/20 rounded-full transition-[background-color,transform] duration-150 ease-out active:scale-[0.96] before:content-[''] before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:h-10 before:w-10"
                                aria-label="Dismiss announcement"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
