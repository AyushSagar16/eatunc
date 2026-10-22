'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { usePostHog } from 'posthog-js/react'
import { X } from 'lucide-react'
import { isAppDownloadPromptEligible } from '@/lib/app-download-prompt'
import AppStoreBadge from './AppStoreBadge'
import { useOnboarding } from '@/providers/OnboardingProvider'

/** Nothing here changes after mount, so there is nothing to subscribe to — this is
 *  read once via `useSyncExternalStore` purely to defer it past hydration safely. */
const neverChanges = () => () => { }

const readEligible = () => isAppDownloadPromptEligible()

/**
 * Kept as `'prominent'` / `'popup-prominent'` even though there is only one variant now, so the
 * PostHog funnel and the `/app` source attribution line up with everything recorded before the
 * compact corner card was retired.
 */
const VARIANT = 'prominent'
const SOURCE = 'popup-prominent'

/**
 * A one-time nudge toward the iOS app for a brand-new visitor, or one who hasn't been
 * back in five-plus days — the two moments where someone is deciding how they want to
 * use Eat UNC going forward, rather than mid-way through an existing habit.
 *
 * Only iPhone and iPad visitors ever see it (`isAppDownloadPromptEligible` decides that), as a
 * centered modal. A laptop or an Android phone can't install the app, so there is nothing to
 * ask them; the App Store badges elsewhere on the site, and `/app`'s "grab your phone" page,
 * still cover anyone who goes looking.
 *
 * Eligibility is shared with `AppInstallBanner` and `CookieConsent` through
 * `isAppDownloadPromptEligible`, so this never stacks with the top banner. Cookie consent
 * additionally waits on `OnboardingProvider`'s app-promotion status, which this reports into
 * below — so it holds until this is actually gone, not for a guessed number of seconds.
 */
export default function AppDownloadPrompt() {
    const posthog = usePostHog()
    const panelRef = useRef<HTMLDivElement>(null)
    const { reportAppPromotionVisibility } = useOnboarding()

    // Server snapshot hides it, hydration reveals it — matches the pattern
    // AppInstallBanner uses so the client render doesn't fight the server HTML.
    const isEligible = useSyncExternalStore(neverChanges, readEligible, () => false)
    const [dismissedNow, setDismissedNow] = useState(false)

    const isOpen = isEligible && !dismissedNow

    useEffect(() => {
        reportAppPromotionVisibility('download-prompt', isOpen ? 'visible' : 'hidden')
    }, [isOpen, reportAppPromotionVisibility])

    useEffect(() => {
        if (!isOpen) return
        posthog?.capture('app_download_prompt_shown', { variant: VARIANT })
    }, [isOpen, posthog])

    const dismiss = useCallback(
        (reason: 'close' | 'backdrop' | 'escape' | 'timeout') => {
            setDismissedNow(true)
            posthog?.capture('app_download_prompt_dismissed', { variant: VARIANT, reason })
        },
        [posthog]
    )

    const handleClick = () => {
        posthog?.capture('app_download_prompt_clicked', { variant: VARIANT })
        setDismissedNow(true)
    }

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                dismiss('escape')
                return
            }
            // A dialog that claims `aria-modal` has to actually hold focus, or a keyboard or
            // screen-reader user tabs straight out into the page behind the backdrop — which
            // is still there, still blocking every one of those elements from being clicked.
            if (e.key !== 'Tab') return

            const panel = panelRef.current
            if (!panel) return
            const stops = panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
            if (stops.length === 0) return

            const first = stops[0]
            const last = stops[stops.length - 1]
            const active = document.activeElement
            const outside = !panel.contains(active)

            if (e.shiftKey && (outside || active === first)) {
                e.preventDefault()
                last.focus()
            } else if (!e.shiftKey && (outside || active === last)) {
                e.preventDefault()
                first.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, dismiss])

    // Opening moves focus into the dialog; nothing restores it on close because the prompt is
    // one-shot and unfocusable afterwards, so there is no trigger element to return to.
    useEffect(() => {
        if (!isOpen) return
        panelRef.current?.focus()
    }, [isOpen])

    // Auto-dismisses after five seconds the visitor actually spent looking at it — not five
    // seconds of wall-clock time. The countdown pauses while the tab is hidden (backgrounded,
    // another tab focused) and resumes from where it left off once it's visible again, so a
    // popup opened just before someone alt-tabs away is still waiting when they come back.
    useEffect(() => {
        if (!isOpen) return

        const AUTO_DISMISS_MS = 5000
        let remainingMs = AUTO_DISMISS_MS
        let resumedAt = performance.now()
        let timerId: number | null = document.hidden
            ? null
            : window.setTimeout(() => dismiss('timeout'), remainingMs)

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (timerId !== null) {
                    window.clearTimeout(timerId)
                    timerId = null
                    remainingMs -= performance.now() - resumedAt
                }
            } else if (timerId === null && remainingMs > 0) {
                resumedAt = performance.now()
                timerId = window.setTimeout(() => dismiss('timeout'), remainingMs)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            if (timerId !== null) window.clearTimeout(timerId)
        }
    }, [isOpen, dismiss])

    if (!isEligible) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="app-download-prompt-title"
                >
                    <motion.div
                        aria-hidden="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => dismiss('backdrop')}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        ref={panelRef}
                        tabIndex={-1}
                        className="relative w-full max-w-[22rem] outline-none overflow-hidden rounded-3xl border border-zinc-200 bg-white p-7 text-center shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
                    >
                        <button
                            onClick={() => dismiss('close')}
                            aria-label="Dismiss"
                            className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-[18px] border border-zinc-200 shadow-sm dark:border-zinc-800">
                            <Image
                                src="/eat_unc_logo_square.png"
                                alt="Eat UNC app icon"
                                fill
                                sizes="64px"
                                className="object-cover"
                                unoptimized
                            />
                        </div>

                        <h2
                            id="app-download-prompt-title"
                            className="mt-4 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                        >
                            Eat UNC is better in the app
                        </h2>
                        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                            Faster menus, favorites and a nutrition-aware meal log — made for iPhone.
                        </p>

                        <div className="mt-5 flex flex-col items-center gap-3">
                            <AppStoreBadge source={SOURCE} className="mx-auto" onClick={handleClick} />
                            <button
                                onClick={() => dismiss('close')}
                                className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                            >
                                Not now
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
