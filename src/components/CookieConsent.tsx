'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import posthog from 'posthog-js'
import { checkAppDownloadPromptEligible } from '@/lib/app-download-prompt'

// The usual delay before showing the cookie banner. When the app download prompt is
// also showing this load, cookie consent waits behind it instead — surfacing two
// unrelated popups within the same second reads as a wall of dialogs, not a homepage.
const DEFAULT_DELAY_MS = 1000
const DELAY_BEHIND_APP_PROMPT_MS = 8000

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        const consent = localStorage.getItem('cookie_consent')

        if (!consent) {
            const delay = checkAppDownloadPromptEligible() ? DELAY_BEHIND_APP_PROMPT_MS : DEFAULT_DELAY_MS
            const timer = setTimeout(() => setShowBanner(true), delay)
            return () => clearTimeout(timer)
        } else if (consent === 'accepted') {
            posthog.opt_in_capturing()
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted')
        posthog.opt_in_capturing()
        setShowBanner(false)
    }

    if (!mounted) return null

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[100]"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-4">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                            Eat UNC uses cookies to improve your experience.{' '}
                            <Link href="/privacy" className="underline hover:text-zinc-900 dark:hover:text-zinc-200">
                                Privacy Policy
                            </Link>
                        </p>
                        <button
                            onClick={handleAccept}
                            className="w-full px-4 py-2 rounded-lg bg-[#4B9CD3] text-white text-sm font-semibold hover:bg-[#3d8bc2] transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export function CookieSettingsLink() {
    const handleOpenSettings = () => {
        localStorage.removeItem('cookie_consent')
        window.location.reload()
    }

    return (
        <button
            onClick={handleOpenSettings}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline underline-offset-2 transition-colors"
        >
            Cookie Settings
        </button>
    )
}
