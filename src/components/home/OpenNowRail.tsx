import Link from 'next/link'

import { CAMPUS_TIMEZONE } from '@/lib/campus'
import type { NextVenue, OpenVenue } from '@/lib/home'

/**
 * "What else is open on campus right now", under the two hall cards.
 *
 * Server-rendered on purpose: the venue names and closing times need to sit in the crawlable
 * HTML rather than behind a client fetch. The hero above is a fixed `100dvh` screen, so this
 * takes whatever height its flex parent hands it — only the row list scrolls, and it scrolls
 * inside itself.
 */

// Built once at module scope, not per row — this formats every venue on the page.
const CLOCK = new Intl.DateTimeFormat('en-US', {
    timeZone: CAMPUS_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
})

/** The app writes "5:00 pm", not "5:00 PM". */
function clock(ms: number) {
    return CLOCK.format(new Date(ms)).replace('AM', 'am').replace('PM', 'pm')
}

/** `Open` is the period label for nearly every satellite venue — repeating it says nothing. */
function where(venue: OpenVenue) {
    return venue.period && venue.period !== 'Open' ? `${venue.building} · ${venue.period}` : venue.building
}

function Chevron() {
    return (
        <svg aria-hidden className="size-3.5 shrink-0 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
    )
}

function Row({ children, index }: { children: React.ReactNode; index: number }) {
    // Alternating tone instead of a rule between rows — a hairline on glass is a grey scratch.
    return <li className={index % 2 === 1 ? 'bg-white/[0.03]' : undefined}>{children}</li>
}

/** 2am has no open venues but still has a real answer: what opens next, and when. */
function NothingOpen({ nextVenues }: { nextVenues: NextVenue[] }) {
    if (nextVenues.length === 0) {
        return (
            <p className="px-4 py-5 text-sm text-blue-100/75">
                Nothing is serving on campus right now, and no hours are posted for what opens next.
            </p>
        )
    }

    return (
        <ul>
            <li className="px-4 pb-1 pt-3 text-sm text-blue-100/75">Nothing is serving right now. Opening next:</li>
            {nextVenues.map((venue, index) => (
                <Row key={venue.id} index={index}>
                    <Link
                        href={venue.href}
                        className="focus-ring flex min-h-[44px] items-center gap-3 px-4 py-2 transition-colors hover:bg-white/[0.06]"
                    >
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{venue.name}</span>
                        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-white/70">
                            Opens at {clock(venue.opensAt)}
                        </span>
                        <Chevron />
                    </Link>
                </Row>
            ))}
        </ul>
    )
}

export default function OpenNowRail({
    openVenues,
    nextVenues,
    totalLocations,
}: {
    openVenues: OpenVenue[]
    nextVenues: NextVenue[]
    totalLocations: number
}) {
    const hasOpen = openVenues.length > 0

    return (
        <section aria-labelledby="open-now-heading" className="flex min-h-0 w-full flex-col">
            <div className="flex shrink-0 items-baseline justify-between gap-3 pb-2">
                <h2 id="open-now-heading" className="text-lg font-bold tracking-tight text-white sm:text-xl">
                    Open now
                </h2>
                <p className="text-[13px] text-blue-200/70">
                    {hasOpen
                        ? `${openVenues.length} campus spot${openVenues.length === 1 ? '' : 's'}`
                        : 'Nothing serving'}
                </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 backdrop-blur-md">
                <div className="no-visible-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {hasOpen ? (
                        <ul>
                            {openVenues.map((venue, index) => (
                                <Row key={venue.id} index={index}>
                                    <Link
                                        href={venue.href}
                                        className="focus-ring flex min-h-[46px] items-center gap-3 px-4 py-2 transition-colors hover:bg-white/[0.06]"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold leading-tight text-white">
                                                {venue.name}
                                            </span>
                                            <span className="block truncate text-[11px] leading-tight text-blue-200/70">
                                                {where(venue)}
                                            </span>
                                        </span>
                                        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-emerald-300">
                                            Closes at {clock(venue.closesAt)}
                                        </span>
                                        <Chevron />
                                    </Link>
                                </Row>
                            ))}
                        </ul>
                    ) : (
                        <NothingOpen nextVenues={nextVenues} />
                    )}
                </div>

                {/* Pinned under the list, the way the app's "Browse all campus dining" row sits
                    below its open-now group. */}
                <Link
                    href="/locations"
                    className="focus-ring flex min-h-[48px] shrink-0 items-center gap-3 border-t border-white/10 bg-white/[0.04] px-4 py-2.5 transition-colors hover:bg-white/[0.09]"
                >
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">
                            Browse all campus dining
                        </span>
                        <span className="block truncate text-[11px] text-blue-200/70">
                            {totalLocations} locations, menus and hours
                        </span>
                    </span>
                    <Chevron />
                </Link>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-[13px]">
                <Link href="/today" className="focus-ring rounded font-semibold text-blue-200/80 transition-colors hover:text-white">
                    Today&apos;s menus →
                </Link>
                <Link href="/open-now" className="focus-ring rounded font-semibold text-blue-200/80 transition-colors hover:text-white">
                    Open now &amp; next →
                </Link>
                <Link href="/hours" className="focus-ring rounded font-semibold text-blue-200/80 transition-colors hover:text-white">
                    Dining hours →
                </Link>
            </div>
        </section>
    )
}
