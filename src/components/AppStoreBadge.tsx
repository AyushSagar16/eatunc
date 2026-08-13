'use client'

import Image from 'next/image'
import { usePostHog } from 'posthog-js/react'
import { appLink } from '@/lib/app-store'
import { cn } from '@/lib/utils'

interface AppStoreBadgeProps {
    /** Recorded as `source` on the redirect event, so each placement is separable. */
    source: string
    /**
     * Which official lockup to use. Apple ships two: the black badge for light
     * backgrounds and the white badge for dark ones. Pick by what it sits on.
     */
    variant?: 'black' | 'white'
    className?: string
}

/**
 * Apple's official "Download on the App Store" badge.
 *
 * The artwork in `public/app-store/` is Apple's unmodified US/UK SVG. Apple's
 * marketing guidelines do not allow recoloring, restretching or adding effects
 * to it, so this only ever scales it proportionally and keeps clear space
 * around it — the `p-1` is roughly the required tenth of the badge height.
 *
 * Links to `/app` rather than the App Store directly so the click lands in the
 * same server-side count as every other route to the app.
 */
export default function AppStoreBadge({
    source,
    variant = 'black',
    className,
}: AppStoreBadgeProps) {
    const posthog = usePostHog()

    return (
        // A plain anchor, not next/link: /app redirects off-site, so prefetching
        // it would fire phantom hits.
        <a
            href={appLink(source)}
            onClick={() => posthog?.capture('app_badge_clicked', { source })}
            aria-label="Download Eat UNC on the App Store"
            className={cn(
                'inline-block p-1 transition-transform duration-200',
                'hover:scale-[1.03] active:scale-[0.98]',
                className
            )}
        >
            <Image
                src={variant === 'white' ? '/app-store/badge-white.svg' : '/app-store/badge-black.svg'}
                alt="Download on the App Store"
                width={120}
                height={40}
                unoptimized
                className="h-9 w-auto sm:h-10"
            />
        </a>
    )
}
