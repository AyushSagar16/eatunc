import {
    campusToday,
    getHoursForLocations,
    getLocations,
    getMenuPreview,
    getOpenNow,
    locationPath,
    HALL_SLUG_BY_LOCATION_SLUG,
    type Location,
    type LocationHours,
    type MenuPreviewItem,
    type OpenPeriod,
} from './campus'
import { normalizeMealPeriod } from './utils'

/** One of the two all-you-care-to-eat halls, with live status. */
export type HallStatus = {
    /** Site route slug: 'chase' | 'lenoir'. */
    slug: string
    /** Display name, e.g. "Chase" / "Top of Lenoir". */
    name: string
    /** e.g. "South Campus" / "North Campus". */
    campus: string
    /** 'blue' for Chase, 'teal' for Lenoir. */
    accent: 'blue' | 'teal'
    /** Serving right now. */
    isOpen: boolean
    /** Period name if open now, e.g. "Lunch" — null when closed. */
    currentPeriod: string | null
    /** Epoch ms the current period ends — null when closed. */
    closesAt: number | null
    /** Next period name when closed, e.g. "Dinner" — null when open or nothing left today. */
    nextPeriod: string | null
    /** Epoch ms the next period starts — null when open or nothing left. */
    opensAt: number | null
    /** Every service period today, in order. Labels come straight from the DB. */
    todayHours: { period: string; opens: string; closes: string }[]
    /** A handful of dish names from the period serving now (or next). Possibly empty. */
    highlights: string[]
    /** Total dishes on today's menu across all periods. 0 when no menu is published. */
    itemCount: number
}

/** A non-hall campus venue that is serving right now. */
export type OpenVenue = {
    /** location_hours row id — unique per venue+period, safe as a React key. */
    id: string
    name: string
    /** venue_group, e.g. "Student Union". */
    building: string
    /** Canonical site path from locationPath(). */
    href: string
    /** Period label, e.g. "Open" or "Lunch". */
    period: string
    /** Epoch ms this period ends. */
    closesAt: number
}

/** A venue that is not open yet but opens next. */
export type NextVenue = {
    id: string
    name: string
    href: string
    opensAt: number
}

export type HomeSnapshot = {
    /** YYYY-MM-DD in America/New_York. */
    today: string
    /** Always length 2: Chase then Top of Lenoir, in that order. */
    halls: HallStatus[]
    /** Non-hall venues open right now, soonest to close first. */
    openVenues: OpenVenue[]
    /** Non-hall venues opening next, soonest first. At most 4. */
    nextVenues: NextVenue[]
    /** Count of active campus locations, for copy like "42 places to eat". */
    totalLocations: number
}

/**
 * Static per-hall metadata that has no home in the DB — the schema has no notion of "campus"
 * or a brand accent colour, and there are only ever two of these, so it is not worth a table.
 * Order here is the order the bento grid renders in.
 */
const HALL_CONFIGS: { locationSlug: string; name: string; campus: string; accent: 'blue' | 'teal' }[] = [
    { locationSlug: 'chase', name: 'Chase', campus: 'South Campus', accent: 'blue' },
    { locationSlug: 'top-of-lenoir', name: 'Top of Lenoir', campus: 'North Campus', accent: 'teal' },
]

function isHallLocation(location: Pick<Location, 'slug'>): boolean {
    return location.slug in HALL_SLUG_BY_LOCATION_SLUG
}

/**
 * Up to 5 distinct dish names, preferring the period serving now (or next).
 *
 * `menu_entries.meal_period` is stored UPPERCASE with its time-range suffix baked in
 * ("LUNCH (11AM-2PM)"), while `preferredPeriod` is `location_hours.period_name`, UNC's clean
 * label ("Lunch"). `normalizeMealPeriod` is what collapses both to the same base word — a
 * plain string match here would silently never hit and every hall would fall back to "any
 * item" on every request.
 */
function pickHighlights(menu: MenuPreviewItem[], preferredPeriod: string | null): string[] {
    const seen = new Set<string>()
    const highlights: string[] = []

    /**
     * Taken one per station in rotation rather than off the front of the list.
     *
     * Entries arrive grouped by station, so reading them in order describes whichever station
     * sorts first and nothing else — the same slice-the-flat-list mistake that had every meal
     * period on `/today` reading "Blueberry Bagel · Cheddar Jalapeno Bagel · ...".
     */
    function addFrom(items: MenuPreviewItem[]) {
        const byStation = new Map<string, MenuPreviewItem[]>()
        for (const item of items) {
            byStation.set(item.station, [...(byStation.get(item.station) ?? []), item])
        }
        const stations = [...byStation.values()]

        for (let round = 0; highlights.length < 5; round++) {
            let advanced = false
            for (const station of stations) {
                if (highlights.length >= 5) return
                const name = station[round]?.name.trim()
                if (!name) continue
                advanced = true
                const key = name.toLowerCase()
                if (seen.has(key)) continue
                seen.add(key)
                highlights.push(name)
            }
            if (!advanced) return
        }
    }

    if (preferredPeriod) {
        const wanted = normalizeMealPeriod(preferredPeriod)
        addFrom(menu.filter((item) => normalizeMealPeriod(item.period) === wanted))
    }
    addFrom(menu)

    return highlights
}

function buildHallStatus(
    config: (typeof HALL_CONFIGS)[number],
    locationId: string | undefined,
    hours: LocationHours[],
    menu: MenuPreviewItem[],
    openNow: { open: OpenPeriod[]; openingSoon: OpenPeriod[] },
): HallStatus {
    const slug = HALL_SLUG_BY_LOCATION_SLUG[config.locationSlug] ?? config.locationSlug

    const openPeriod = locationId ? openNow.open.find((entry) => entry.location.id === locationId) : undefined
    const nextPeriod = locationId ? openNow.openingSoon.find((entry) => entry.location.id === locationId) : undefined

    const currentPeriod = openPeriod?.period.period_name ?? null
    const nextPeriodName = nextPeriod?.period.period_name ?? null

    return {
        slug,
        name: config.name,
        campus: config.campus,
        accent: config.accent,
        isOpen: Boolean(openPeriod),
        currentPeriod,
        closesAt: openPeriod?.closesAt ?? null,
        nextPeriod: nextPeriodName,
        opensAt: nextPeriod?.opensAt ?? null,
        todayHours: locationId
            ? hours
                  .filter((row) => row.location_id === locationId)
                  .map((row) => ({ period: row.period_name, opens: row.opens_label, closes: row.closes_label }))
            : [],
        highlights: pickHighlights(menu, currentPeriod ?? nextPeriodName),
        // A floor, not the true total: getMenuPreview caps its nested query at (by default)
        // 60 menu_entries rows, and a hall day comfortably runs past that.
        itemCount: menu.length,
    }
}

/**
 * Everything the redesigned homepage needs in one call: live status for the two halls plus
 * what else on campus is open right now.
 *
 * Every remote piece fails independently — this page carries 60% of the site's search
 * impressions, so a Supabase hiccup must degrade to empty sections, never a 500. `halls` is
 * always length 2 with correct identity even when every fetch below fails.
 */
export async function getHomeSnapshot(now: Date = new Date()): Promise<HomeSnapshot> {
    const today = campusToday(now)

    const [openNowResult, locationsResult, chaseMenuResult, lenoirMenuResult] = await Promise.allSettled([
        getOpenNow(now),
        getLocations(),
        getMenuPreview('Chase', today),
        getMenuPreview('Top of Lenoir', today),
    ])

    const openNow =
        openNowResult.status === 'fulfilled' ? openNowResult.value : { open: [], openingSoon: [], locations: [] }
    const locations = locationsResult.status === 'fulfilled' ? locationsResult.value : []
    const menuByHall: Record<string, MenuPreviewItem[]> = {
        chase: chaseMenuResult.status === 'fulfilled' ? chaseMenuResult.value : [],
        'top-of-lenoir': lenoirMenuResult.status === 'fulfilled' ? lenoirMenuResult.value : [],
    }

    const hallLocationIds = HALL_CONFIGS.map(
        (config) => locations.find((location) => location.slug === config.locationSlug)?.id,
    )
    const knownHallIds = hallLocationIds.filter((id): id is string => Boolean(id))

    let hours: LocationHours[] = []
    if (knownHallIds.length > 0) {
        try {
            hours = await getHoursForLocations(knownHallIds, today, today)
        } catch {
            hours = []
        }
    }

    const halls = HALL_CONFIGS.map((config, i) =>
        buildHallStatus(config, hallLocationIds[i], hours, menuByHall[config.locationSlug], openNow),
    )

    const openVenues: OpenVenue[] = openNow.open
        .filter((entry) => !isHallLocation(entry.location))
        .map((entry) => ({
            id: entry.period.id,
            name: entry.location.name,
            building: entry.location.venue_group,
            href: locationPath(entry.location),
            period: entry.period.period_name,
            closesAt: entry.closesAt,
        }))

    const nextVenues: NextVenue[] = openNow.openingSoon
        .filter((entry) => !isHallLocation(entry.location))
        .slice(0, 4)
        .map((entry) => ({
            id: entry.period.id,
            name: entry.location.name,
            href: locationPath(entry.location),
            opensAt: entry.opensAt,
        }))

    return {
        today,
        halls,
        openVenues,
        nextVenues,
        totalLocations: locations.length,
    }
}
