'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MessageSquare, X } from 'lucide-react'
import Link from 'next/link'

// Storage key for tracking when popup was last shown
const FEEDBACK_POPUP_STORAGE_KEY = 'eatunc_feedback_popup_last_shown'

// Time in milliseconds (7 days)
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

// Delay before showing popup (15 seconds)
const POPUP_DELAY_MS = 15000

/**
 * FeedbackPopup - Non-intrusive popup asking for user feedback
 * 
 * Features:
 * - Appears after 15 seconds on menu pages
 * - Only shows once per week (tracked via localStorage)
 * - Smooth slide-in animation from top
 * - Dismiss button to close
 * - Link to feedback page
 */
export default function FeedbackPopup() {
    const [isVisible, setIsVisible] = useState(false)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isClient) return

        // Check if we should show the popup
        const lastShown = localStorage.getItem(FEEDBACK_POPUP_STORAGE_KEY)
        const lastShownTime = lastShown ? parseInt(lastShown, 10) : 0
        const timeSinceLastShown = Date.now() - lastShownTime

        // Only show if more than a week has passed (or never shown)
        if (timeSinceLastShown < ONE_WEEK_MS) {
            return
        }

        // Show popup after delay
        const timer = setTimeout(() => {
            setIsVisible(true)
        }, POPUP_DELAY_MS)

        return () => clearTimeout(timer)
    }, [isClient])

    const handleDismiss = () => {
        setIsVisible(false)
        // Record when popup was shown/dismissed
        localStorage.setItem(FEEDBACK_POPUP_STORAGE_KEY, String(Date.now()))
    }

    const handleFeedbackClick = () => {
        // Record when popup was shown before navigating
        localStorage.setItem(FEEDBACK_POPUP_STORAGE_KEY, String(Date.now()))
    }

    // Don't render on server
    if (!isClient) return null

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md"
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-3">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-[#4B9CD3]/10 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-5 h-5 text-[#4B9CD3]" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                Enjoying Eat UNC?
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                We&apos;d love to hear your feedback!
                            </p>
                        </div>

                        {/* Feedback Button */}
                        <Link
                            href="/feedback"
                            onClick={handleFeedbackClick}
                            className="px-4 py-2 bg-[#4B9CD3] hover:bg-[#4B9CD3]/90 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
                        >
                            Give Feedback
                        </Link>

                        {/* Dismiss Button */}
                        <button
                            onClick={handleDismiss}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
