import type { LocationHours } from '@/lib/campus'
import { formatCampusDateShort, formatClock } from '@/components/campus/campusDisplay'

/**
 * Open/closed, as pure functions of the hours rows.
 *
 * Split out of `components/campus/VenueStatus.tsx` because that module is `'use client'` and the
 * server needs `scheduleStatus` to render the pre-hydration line. Nothing here touches the
 * network, the DOM or — apart from the `nowMs` a caller passes in — the clock, which is the
 * whole point: `scheduleStatus` is what the cached HTML is allowed to contain, `liveStatus` is
 * what only the browser may compute.
 */
export type StatusRow = Pick<
    LocationHours,
    'opens_at' | 'closes_at' | 'opens_label' | 'closes_label' | 'service_date'
>

export function isOpenAt(row: StatusRow, atMs: number): boolean {
    const opens = Date.parse(row.opens_at)
    const closes = Date.parse(row.closes_at)
    return !Number.isNaN(opens) && !Number.isNaN(closes) && opens <= atMs && atMs < closes
}

/**
 * The live answer. Ported verbatim from the server's old `venueStatus`, including its promise:
 * the times printed are `opens_label` / `closes_label`, the strings UNC itself publishes, so
 * this line can never contradict the hours rendered next to it. The instants come from the
 * timestamptz columns, which makes an overnight period fall out for free.
 */
export function liveStatus(rows: StatusRow[], today: string, nowMs: number): string {
    if (rows.length === 0) return 'UNC has published no hours for this venue'

    const open = rows.find((row) => isOpenAt(row, nowMs))
    if (open) return `Open · Closes at ${formatClock(open.closes_label)}`

    const next = rows
        .filter((row) => Date.parse(row.opens_at) > nowMs)
        .sort((a, b) => Date.parse(a.opens_at) - Date.parse(b.opens_at))[0]

    if (!next) return 'Closed'
    if (next.service_date === today) return `Closed · Opens at ${formatClock(next.opens_label)}`
    return `Closed · Opens ${formatCampusDateShort(next.service_date)} at ${formatClock(next.opens_label)}`
}

/**
 * What the server can say without asking what time it is.
 *
 * Every branch here is a function of the hours rows and the calendar date, both of which change
 * only when the nightly sweep changes them — so the cached bytes are stable all day and the
 * regeneration the sweep triggers is the only one that costs anything.
 */
export function scheduleStatus(rows: StatusRow[], today: string): string {
    if (rows.length === 0) return 'UNC has published no hours for this venue'
    if (rows.some((row) => row.service_date === today)) return 'Serving today'

    const next = rows
        .filter((row) => row.service_date > today)
        .sort((a, b) => a.service_date.localeCompare(b.service_date) || a.opens_at.localeCompare(b.opens_at))[0]

    if (!next) return 'Closed'
    return `Closed · Opens ${formatCampusDateShort(next.service_date)} at ${formatClock(next.opens_label)}`
}
