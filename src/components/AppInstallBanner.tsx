'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { usePostHog } from 'posthog-js/react'
import { X } from 'lucide-react'
import { AppleLogo } from './icons/AppleLogo'
import { appLink } from '@/lib/app-store'

const DISMISSED_KEY = 'eatunc_app_banner_dismissed'
const IMPRESSION_KEY = 'eatunc_app_banner_seen'

interface AppInstallBannerProps {
    className?: string
}

/** The dismissal flag only changes via this component, so there is nothing to subscribe to. */
const neverChanges = () => () => { }

const readDismissed = () => localStorage.getItem(DISMISSED_KEY) !== null

/**
 * Promotes the Eat UNC iOS app at the top of every page.
 *
 * The CTA points at `/app`, not the App Store directly, so the click is counted
 * server-side even for visitors who have not accepted cookies. The PostHog
 * events here are the consent-gated extras on top of that: they attribute the
 * funnel (shown -> clicked -> dismissed) for visitors who have opted in.
 */
export default function AppInstallBanner({ className = '' }: AppInstallBannerProps) {
    const posthog = usePostHog()
    const pathname = usePathname()
    // localStorage is client-only, so the server snapshot hides the banner and
    // hydration reveals it. Reading it through useSyncExternalStore keeps the
    // markup consistent without a setState-in-effect cascade.
    const wasDismissed = useSyncExternalStore(neverChanges, readDismissed, () => true)
    const [dismissedNow, setDismissedNow] = useState(false)
    // The homepage is a single non-scrolling screen and this banner sits above it in the
    // document flow, so on `/` it would push the screen taller than the viewport. That page
    // carries its own App Store badge, which is the same ask in a place that fits.
    const isLanding = pathname === '/'
    const isHidden = wasDismissed || dismissedNow || isLanding

    useEffect(() => {
        if (isHidden) return

        // One impression per session, so repeat page views don't inflate the count.
        if (sessionStorage.getItem(IMPRESSION_KEY) === null) {
            sessionStorage.setItem(IMPRESSION_KEY, 'true')
            posthog?.capture('app_banner_shown')
        }
    }, [isHidden, posthog])

    const handleDismiss = () => {
        setDismissedNow(true)
        localStorage.setItem(DISMISSED_KEY, 'true')
        posthog?.capture('app_banner_dismissed')
    }

    const handleClick = () => {
        posthog?.capture('app_banner_clicked', { source: 'banner' })
    }

    if (isHidden) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`relative w-full overflow-hidden border-b border-white/10 bg-gradient-to-r from-[#0b1832] via-[#1d4a7a] to-[#0b1832] text-white ${className}`}
            >
                {/* Carolina-blue glow behind the centered content, so the bar reads
                    as lit from the middle rather than as a flat strip. */}
                <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4B9CD3]/40 blur-3xl" />

                {/* Slow light sweep across the whole bar. */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

                {/* The horizontal padding keeps the centered content clear of the
                    dismiss button; the tighter mobile sizing keeps it on one line. */}
                <div className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-2 px-9 py-2.5 text-center sm:gap-x-3 sm:px-11 sm:py-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-inset ring-white/20 sm:h-7 sm:w-7">
                        <AppleLogo className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </span>

                    <p className="text-[13px] font-medium sm:text-sm">
                        <span className="font-bold">Eat UNC is on iPhone.</span>{' '}
                        <span className="hidden text-blue-100/75 sm:inline">
                            Menus, filters, and nutrition facts in a native app.
                        </span>
                    </p>

                    {/* A plain anchor, not next/link: /app redirects off-site, so
                        client-side prefetching would fire phantom hits. */}
                    <a
                        href={appLink('banner')}
                        onClick={handleClick}
                        className="rounded-full bg-white px-3 py-1 text-[13px] font-bold text-[#0b1832] shadow-lg shadow-black/20 transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98] sm:px-4 sm:text-sm"
                    >
                        Get the app
                    </a>
                </div>

                <button
                    onClick={handleDismiss}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5 transition-colors hover:bg-white/20 sm:right-3"
                    aria-label="Dismiss app announcement"
                >
                    <X className="h-4 w-4" />
                </button>
            </motion.div>
        </AnimatePresence>
    )
}
