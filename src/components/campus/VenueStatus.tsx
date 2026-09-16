'use client'

import { useEffect, useState } from 'react'

import { formatClock } from '@/components/campus/campusDisplay'
import { Badge } from '@/components/campus/CampusChrome'
import { isOpenAt, liveStatus, type StatusRow } from '@/lib/venueStatus'

/**
 * A minute is far finer than the fifteen the server used to manage and costs nothing, because
 * nothing leaves the browser. The page a student left open while walking to Lenoir now updates
 * itself instead of insisting the place is still open.
 */
const TICK_MS = 60_000

/**
 * The open/closed line, computed in the browser rather than baked into the cached page.
 *
 * It used to be rendered on the server from `Date.now()`, which quietly made `/locations/<slug>`
 * the largest consumer of the ISR write allowance on the whole site. Vercel skips the write when
 * a regeneration produces byte-identical output; a clock in the markup guarantees it never does,
 * so all 38 prerendered venue pages paid a full write every revalidation — ~109K units a month
 * for rows the nightly sweep touches once. Moving the clock here is what lets the page be
 * regenerated on demand by the sweep instead of on a timer.
 *
 * The server still renders a real sentence rather than a skeleton. `fallback` is derived from the
 * schedule alone, so it is deterministic, true at every hour, and identical between the server
 * render and the first client render — which is the only way to upgrade without a hydration
 * mismatch. It is less specific, never wrong: "Serving today" where this will say "Open · Closes
 * at 8:00 PM". Someone with JS disabled keeps a correct page and the hours printed beside it.
 */
/**
 * The `/locations` index badge — the same move as `VenueStatus`, in the shape that page wants.
 *
 * `getOpenNow()` used to resolve "Open now · until 8:00 PM" on the server for all 40 venues,
 * which put a clock in the index's cached output for the same reason the venue pages had one.
 * The server now renders whether the venue serves at all today, which turns over at midnight
 * and not before; the browser sharpens it to the live answer.
 */
export function VenueOpenBadge({ rows, today }: { rows: StatusRow[]; today: string }) {
    const servesToday = rows.some((row) => row.service_date === today)
    const [live, setLive] = useState<{ open: boolean; closesLabel?: string } | null>(null)

    useEffect(() => {
        const update = () => {
            const open = rows.find((row) => isOpenAt(row, Date.now()))
            setLive(open ? { open: true, closesLabel: open.closes_label } : { open: false })
        }
        update()
        const id = setInterval(update, TICK_MS)
        return () => clearInterval(id)
    }, [rows])

    if (live?.open) {
        return (
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                Open now · until {formatClock(live.closesLabel!)}
            </Badge>
        )
    }

    if (live) {
        return (
            <Badge className="bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20">
                Closed right now
            </Badge>
        )
    }

    // Pre-hydration, and the no-JS answer. Deliberately not "Closed right now": the server does
    // not know, and guessing closed on a page someone opened at lunchtime is the one wrong
    // answer that matters here.
    return servesToday ? (
        <Badge className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20">Serving today</Badge>
    ) : (
        <Badge className="bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20">Closed today</Badge>
    )
}

export function VenueStatus({ rows, today, fallback }: { rows: StatusRow[]; today: string; fallback: string }) {
    // Seeded with `fallback` rather than the live answer on purpose: the first client render has
    // to match the server's HTML exactly or React discards it. The effect below runs immediately
    // after mount, so the precise line lands in the same frame the user sees.
    const [status, setStatus] = useState(fallback)

    useEffect(() => {
        const update = () => setStatus(liveStatus(rows, today, Date.now()))
        update()
        const id = setInterval(update, TICK_MS)
        return () => clearInterval(id)
    }, [rows, today])

    return (
        <span
            className={`font-semibold ${
                status.startsWith('Open')
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-600 dark:text-zinc-400'
            }`}
        >
            {status}
        </span>
    )
}
