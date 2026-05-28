'use client'

import { useState, useSyncExternalStore } from 'react'
import { m, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import { X, Sparkles } from 'lucide-react'

// SSR-safe client detection: false on the server, true after mount, no effect.
const emptySubscribe = () => () => {}

// PERFORMANCE: Hoist the formatter to module scope so it is created once and reused
const diningDayFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
})

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
    const { push } = useRouter()
    // Decide visibility on the client only (server renders nothing), so reading
    // sessionStorage / the current date can't cause a hydration mismatch.
    const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false)
    const [justDismissed, setJustDismissed] = useState(false)

    const isDismissed = justDismissed ||
        (isClient && sessionStorage.getItem('announcement_dismissed') === 'true')

    // Show the banner on or before the expiration date (Eastern Time).
    const withinWindow = isClient &&
        new Date().toLocaleDateString('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }) <= expirationDate

    const isVisible = isClient && !isDismissed && withinWindow

    const handleDismiss = () => {
        setJustDismissed(true)
        sessionStorage.setItem('announcement_dismissed', 'true')
    }

    const handleCheckItOut = () => {
        // Mark tutorial as completed so it doesn't interrupt the filter demo
        // Users clicking this are likely returning users who just want to see the new filters
        localStorage.setItem('eatunc_tutorial_completed', 'true')

        // Navigate to lenoir menu with openFilter query param
        const now = new Date()
        const today = diningDayFormatter.format(now)

        push(`/lenoir/${today}?openFilter=true`)
    }

    if (!isVisible || isDismissed) return null

    return (
        <AnimatePresence>
            <m.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white relative overflow-hidden ${className}`}
            >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

                <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 relative z-10">
                    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <m.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                className="flex-shrink-0"
                            >
                                <Sparkles className="size-5 text-yellow-200" />
                            </m.div>
                            <p className="text-sm font-medium">
                                <span className="font-bold">New!</span>{' '}
                                Eat UNC now has dietary preference and allergen filters: find exactly what works for you!
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <m.button
                                onClick={handleCheckItOut}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-sm font-bold transition-colors whitespace-nowrap"
                            >
                                Check it out →
                            </m.button>

                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                                aria-label="Dismiss announcement"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </m.div>
        </AnimatePresence>
    )
}
