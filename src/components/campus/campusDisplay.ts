import { CAMPUS_TIMEZONE } from '@/lib/campus'
import type { Location, LocationHours } from '@/lib/campus'

/**
 * Presentation-only helpers shared by /locations, /locations/[slug], /open-now and /hours.
 *
 * Nothing here invents a fact. Times come from `opens_label` / `closes_label`, which are the
 * strings UNC itself prints on its menu-hours page, so a rendered range can never disagree
 * with the source. The only formatting applied is casing.
 */

export type KindMeta = {
    /** Full sentence-case label used in prose and badges. */
    label: string
    /** Two-word form for tight badges. */
    short: string
    badgeClass: string
    /** One line explaining what this kind of venue actually is. */
    description: string
}

const FALLBACK_KIND: KindMeta = {
    label: 'Campus venue',
    short: 'Venue',
    badgeClass: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20',
    description: 'A campus dining location listed by UNC Dining.',
}

const KINDS: Record<string, KindMeta> = {
    dining_hall: {
        label: 'All-you-can-eat dining hall',
        short: 'Dining hall',
        badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
        description:
            'You swipe in once and eat as much as you like. UNC publishes a full menu for every meal period.',
    },
    unc_menu: {
        label: 'UNC-published daily menu',
        short: 'Daily menu',
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        description:
            'Pay per item. UNC Dining publishes this counter’s menu day by day, with nutrition for every recipe.',
    },
    external: {
        label: 'Third-party brand',
        short: 'Brand',
        badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        description:
            'A national or local brand operating on campus. Its menu comes from the brand, not from UNC, so it does not change day to day.',
    },
    retail: {
        label: 'Market and grab-and-go',
        short: 'Market',
        badgeClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
        description: 'Packaged food, snacks and drinks rather than a made-to-order line.',
    },
}

export function kindMeta(kind: string): KindMeta {
    return KINDS[kind] ?? FALLBACK_KIND
}

/** `8:00 am` as UNC prints it becomes `8:00 AM`. Nothing else is changed. */
export function formatClock(label: string): string {
    return label.replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase())
}

export function formatHoursRange(row: Pick<LocationHours, 'opens_label' | 'closes_label'>): string {
    return `${formatClock(row.opens_label)} – ${formatClock(row.closes_label)}`
}

/**
 * Service-period names are not a fixed enum: the halls use Breakfast/Lunch/Late Lunch/Dinner,
 * nearly every other venue uses `Open`, and the food trucks file theirs under the stop they
 * parked at that day (`SASB`, `Marsico Hall`).
 */
export function periodLabel(name: string): string {
    return name.trim()
}

/** A YYYY-MM-DD dining day, formatted without ever touching the server's local timezone. */
export function formatCampusDate(date: string): string {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(`${date}T12:00:00Z`))
}

export function formatCampusDateShort(date: string): string {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(new Date(`${date}T12:00:00Z`))
}

export function formatCampusWeekday(date: string): string {
    return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(
        new Date(`${date}T12:00:00Z`),
    )
}

/** Wall-clock time in Chapel Hill for an instant — e.g. `3:42 PM`. */
export function formatCampusTime(at: Date | number): string {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: CAMPUS_TIMEZONE,
        hour: 'numeric',
        minute: '2-digit',
    }).format(at)
}

/** `Wednesday, August 19` in Chapel Hill for an instant. */
export function formatCampusDay(at: Date | number): string {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: CAMPUS_TIMEZONE,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).format(at)
}

export type BuildingMeta = {
    /** The H2 for this building, naming the student name for the room where one exists. */
    heading: string
    /** Short form for badges and breadcrumbs. */
    short: string
    /** What is actually in the building. Kept free of counts so it cannot drift from the data. */
    blurb?: string
    order: number
}

/**
 * Student names matter here. Nobody searches "Brinkhous-Bullitt Building"; they search
 * "the beach cafe unc". Nobody searches "Lenoir Hall ground floor"; they search
 * "bottom of lenoir". Both names have to be on the page for either query to find it.
 */
const BUILDINGS: Record<string, BuildingMeta> = {
    'Top of Lenoir': {
        heading: 'Top of Lenoir',
        short: 'Top of Lenoir',
        blurb: 'Upstairs in Lenoir Hall: the all-you-can-eat hall you swipe into.',
        order: 1,
    },
    'Bottom of Lenoir': {
        heading: 'Bottom of Lenoir',
        short: 'Bottom of Lenoir',
        blurb:
            'The food court on the ground floor of Lenoir Hall, where you pay counter by counter.',
        order: 2,
    },
    // Kept as a fallback heading. `groupByBuilding` splits this venue_group in two before it is
    // ever looked up, so nothing should reach it — but a new Lenoir venue arriving with an
    // unexpected slug should still land somewhere sensible rather than under a bare string.
    'Lenoir Hall': {
        heading: 'Lenoir Hall',
        short: 'Lenoir Hall',
        order: 2,
    },
    'Brinkhous-Bullitt Building: The Beach Cafe': {
        heading: 'Brinkhous-Bullitt Building — The Beach Cafe',
        short: 'The Beach Cafe',
        blurb:
            'The Beach Cafe is the food court inside the Brinkhous-Bullitt Building, at the medical-school end of campus. It is the largest collection of counters outside Lenoir Hall, and the only place on campus serving Makus Empanadas and Hibachi & Co.',
        order: 3,
    },
    'Chase Hall': {
        heading: 'Chase Hall — Chase Dining Hall, Cafe 1789 & Rams Market',
        short: 'Chase Hall',
        blurb:
            'South Campus. Chase itself is the all-you-can-eat hall; Cafe 1789, Rams Market and Subway share the building for a faster stop.',
        order: 4,
    },
    'Carolina Union': {
        heading: 'Carolina Union',
        short: 'Carolina Union',
        blurb: 'Two counters inside the student union, in the middle of campus.',
        order: 5,
    },
    'Food Trucks': {
        heading: 'Food Trucks',
        short: 'Food Trucks',
        blurb:
            'Trucks rotate through campus stops instead of keeping a room, and UNC files their hours under the stop they are parked at that day — which is why a truck shows up as SASB one afternoon and Marsico Hall the next.',
        order: 6,
    },
}

export function buildingMeta(venueGroup: string): BuildingMeta {
    return (
        BUILDINGS[venueGroup] ?? {
            heading: venueGroup,
            short: venueGroup,
            order: 50,
        }
    )
}

export type BuildingGroup<T> = { venueGroup: string; meta: BuildingMeta; items: T[] }

/** The hall upstairs. Everything else filed under `Lenoir Hall` is the food court downstairs. */
const TOP_OF_LENOIR_SLUG = 'top-of-lenoir'

/**
 * UNC files one `venue_group` for the whole of Lenoir Hall, but nobody on campus talks about it
 * that way: upstairs is Top of Lenoir, the all-you-can-eat hall, and the ground floor is Bottom
 * of Lenoir, a food court of separate counters. Grouping them together put Chick-fil-A under the
 * same heading as the dining hall. The split is by slug rather than by `kind`, because the two
 * are genuinely different places rather than two kinds of the same place.
 */
function displayGroup(row: { venue_group: string; slug: string }): string {
    if (row.venue_group !== 'Lenoir Hall') return row.venue_group
    return row.slug === TOP_OF_LENOIR_SLUG ? 'Top of Lenoir' : 'Bottom of Lenoir'
}

/** Groups any location-shaped row by building, biggest and best-known buildings first. */
export function groupByBuilding<T extends { venue_group: string; slug: string }>(
    rows: T[],
): BuildingGroup<T>[] {
    const groups = new Map<string, T[]>()
    for (const row of rows) {
        const key = displayGroup(row)
        const existing = groups.get(key)
        if (existing) existing.push(row)
        else groups.set(key, [row])
    }

    return Array.from(groups.entries())
        .map(([venueGroup, items]) => ({ venueGroup, meta: buildingMeta(venueGroup), items }))
        .sort((a, b) => a.meta.order - b.meta.order || a.venueGroup.localeCompare(b.venueGroup))
}

/** Every building a set of locations spans, in the same order `groupByBuilding` uses. */
export function buildingsOf(locations: Location[]): string[] {
    return groupByBuilding(locations).map((g) => g.venueGroup)
}

/**
 * `open (12PM-5PM)` becomes `Open · 12PM – 5PM`; `late-lunch (3PM-5PM)` becomes
 * `Late Lunch · 3PM – 5PM`. The stored form is the one the old Playwright scraper
 * captured off the rendered page, so it is lowercase-with-parenthetical everywhere.
 */
export function prettyMealPeriod(period: string): string {
    const match = period.match(/^\s*([^()]+?)\s*\((.+)\)\s*$/)
    if (!match) return titleCasePhrase(period)
    return `${titleCasePhrase(match[1])} · ${match[2].replace(/\s*-\s*/g, ' – ')}`
}

export function titleCasePhrase(value: string): string {
    return value
        .replace(/[-_]+/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim()
}

/** A plain-text list that reads like a sentence: "A, B and C". Used in FAQ answers. */
export function sentenceList(values: string[], conjunction = 'and'): string {
    if (values.length === 0) return ''
    if (values.length === 1) return values[0]
    if (values.length === 2) return `${values[0]} ${conjunction} ${values[1]}`
    return `${values.slice(0, -1).join(', ')} ${conjunction} ${values[values.length - 1]}`
}

/** Hours rows for one location on one date, in UNC's own sort order. */
export function periodsFor(hours: LocationHours[], locationId: string, date: string): LocationHours[] {
    return hours
        .filter((h) => h.location_id === locationId && h.service_date === date)
        .sort((a, b) => a.sort_order - b.sort_order || a.opens_at.localeCompare(b.opens_at))
}

/** The dates covered by a hours window, oldest first. */
export function datesIn(hours: LocationHours[]): string[] {
    return Array.from(new Set(hours.map((h) => h.service_date))).sort()
}
