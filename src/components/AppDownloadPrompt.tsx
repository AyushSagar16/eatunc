'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { usePostHog } from 'posthog-js/react'
import { X } from 'lucide-react'
import { appLink } from '@/lib/app-store'
import { checkAppDownloadPromptEligible } from '@/lib/app-download-prompt'
import { isIOSDevice, isMacOSDevice, isSafariBrowser } from '@/lib/platform'
import AppStoreBadge from './AppStoreBadge'

/** Nothing here changes after mount, so there is nothing to subscribe to — these are
 *  read once via `useSyncExternalStore` purely to defer them past hydration safely. */
const neverChanges = () => () => { }

const readEligible = () => checkAppDownloadPromptEligible()
const readIsProminent = () => isIOSDevice() || isMacOSDevice() || isSafariBrowser()

/**
 * A one-time nudge toward the iOS app for a brand-new visitor, or one who hasn't been
 * back in five-plus days — the two moments where someone is deciding how they want to
 * use Eat UNC going forward, rather than mid-way through an existing habit.
 *
 * iPhone, Mac and Safari visitors get a centered, more deliberate modal; everyone else
 * gets a small corner card that gets out of the way on the first outside click. A Mac
 * counts even though it cannot install the app itself — someone browsing from a MacBook
 * is a good bet to also own an iPhone, so it is worth the more deliberate ask. Eligibility
 * is shared with `AppInstallBanner` and `CookieConsent` through
 * `checkAppDownloadPromptEligible` so this never stacks with the top banner, and cookie
 * consent waits for this to be dismissed first.
 */
export default function AppDownloadPrompt() {
    const posthog = usePostHog()
    const cardRef = useRef<HTMLDivElement>(null)

    // Server snapshot hides both, hydration reveals them — matches the pattern
    // AppInstallBanner uses so the client render doesn't fight the server HTML.
    const isEligible = useSyncExternalStore(neverChanges, readEligible, () => false)
    const isProminent = useSyncExternalStore(neverChanges, readIsProminent, () => false)
    const [dismissedNow, setDismissedNow] = useState(false)

    const isOpen = isEligible && !dismissedNow

    useEffect(() => {
        if (!isOpen) return
        posthog?.capture('app_download_prompt_shown', {
            variant: isProminent ? 'prominent' : 'compact',
        })
    }, [isOpen, isProminent, posthog])

    const dismiss = (reason: 'close' | 'backdrop' | 'outside' | 'escape' | 'timeout') => {
        setDismissedNow(true)
        posthog?.capture('app_download_prompt_dismissed', {
            variant: isProminent ? 'prominent' : 'compact',
            reason,
        })
    }

    const handleClick = () => {
        posthog?.capture('app_download_prompt_clicked', {
            variant: isProminent ? 'prominent' : 'compact',
        })
        setDismissedNow(true)
    }

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') dismiss('escape')
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    // The compact variant has no backdrop, so "click-out-able" means a real outside
    // click on the page rather than a dedicated dismiss target.
    useEffect(() => {
        if (!isOpen || isProminent) return

        const handlePointerDown = (e: PointerEvent) => {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                dismiss('outside')
            }
        }
        document.addEventListener('pointerdown', handlePointerDown)
        return () => document.removeEventListener('pointerdown', handlePointerDown)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, isProminent])

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    if (!isEligible) return null

    const source = isProminent ? 'popup-prominent' : 'popup-compact'
    const headline = 'Eat UNC is better in the app'
    const body = 'Faster menus, favorites and a nutrition-aware meal log — made for iPhone.'

    if (isProminent) {
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
                            className="relative w-full max-w-[22rem] overflow-hidden rounded-3xl border border-zinc-200 bg-white p-7 text-center shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
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
                                {headline}
                            </h2>
                            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                                {body}
                            </p>

                            <div className="mt-5 flex flex-col items-center gap-3">
                                <div onClick={handleClick}>
                                    <AppStoreBadge source={source} className="mx-auto" />
                                </div>
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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={cardRef}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                    className="fixed bottom-4 left-4 right-4 z-[110] sm:left-auto sm:right-4 sm:max-w-[19rem]"
                    role="dialog"
                    aria-labelledby="app-download-prompt-title"
                >
                    <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-3.5 shadow-lg backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[10px] border border-zinc-200 dark:border-zinc-800">
                            <Image
                                src="/eat_unc_logo_square.png"
                                alt=""
                                fill
                                sizes="36px"
                                className="object-cover"
                                unoptimized
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p id="app-download-prompt-title" className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                                {headline}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                Free on the App Store.
                            </p>
                            <a
                                href={appLink(source)}
                                onClick={handleClick}
                                className="mt-2 inline-block rounded-full bg-[#4B9CD3] px-3 py-1 text-xs font-semibold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
                            >
                                Get the app
                            </a>
                        </div>

                        <button
                            onClick={() => dismiss('close')}
                            aria-label="Dismiss"
                            className="shrink-0 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
