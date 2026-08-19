import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, Clock, ExternalLink, MapPin, Utensils } from 'lucide-react'

import {
    campusToday,
    getBrandsById,
    getHoursForLocations,
    getLocations,
    getLocationsBySlug,
    getVenueMenu,
    locationPath,
    shiftDate,
} from '@/lib/campus'
import type { ExternalBrand, Location, LocationHours } from '@/lib/campus'
import { breadcrumbList, canonical, menuSchema, toOpeningHoursSpecification } from '@/lib/seo'
import type { MenuSectionInput } from '@/lib/seo'
import { compareMealPeriods } from '@/lib/utils'
import { Badge, Breadcrumbs, CampusPage, Card, IconTile, Prose } from '@/components/campus/CampusChrome'
import { JsonLd } from '@/components/campus/JsonLd'
import { PeriodRows, PeriodSummary } from '@/components/campus/HoursList'
import {
    buildingMeta,
    datesIn,
    formatCampusDate,
    formatCampusDateShort,
    kindMeta,
    periodsFor,
    prettyMealPeriod,
    sentenceList,
} from '@/components/campus/campusDisplay'

/**
 * Today's hours and today's menu both depend on the calendar, so this route can never be a
 * frozen static build — `/today` is currently stuck on its August build date for exactly that
 * reason. `generateStaticParams` still prerenders all 38 distinct slugs; `revalidate` is what
 * keeps them honest afterwards.
 */
export const revalidate = 900

const DAYS_AHEAD = 7

type MenuFoodItem = {
    recipe_number: number
    food_name: string | null
    calories_kcal: number | null
    protein_g: number | null
    fat_g: number | null
    carbohydrates_g: number | null
    amount_per_serving: string | null
    dietary_preferences: string | null
    allergens: string | null
}

type MenuStation = { station: string; items: MenuFoodItem[] }
type MenuPeriod = { period: string; stations: MenuStation[] }
type VenueMenuData = { periods: MenuPeriod[]; itemCount: number }

/**
 * `getVenueMenu` returns whatever PostgREST's nested select infers, so the shape is narrowed
 * here rather than asserted. A menu row with a null `master_food_items` is dropped instead of
 * rendered as a blank line — the join can miss when a recipe has not been ingested yet.
 */
function normalizeMenu(raw: unknown): VenueMenuData | null {
    if (!raw || typeof raw !== 'object') return null
    const entries = (raw as { menu_entries?: unknown }).menu_entries
    if (!Array.isArray(entries)) return null

    const byPeriod = new Map<string, Map<string, MenuFoodItem[]>>()
    let itemCount = 0

    for (const rawEntry of entries) {
        if (!rawEntry || typeof rawEntry !== 'object') continue
        const entry = rawEntry as { meal_period?: unknown; meal_station?: unknown; master_food_items?: unknown }
        const period = typeof entry.meal_period === 'string' ? entry.meal_period : ''
        const station = typeof entry.meal_station === 'string' ? entry.meal_station : 'MENU'
        const food = entry.master_food_items
        if (!period || !food || typeof food !== 'object') continue

        const item = food as MenuFoodItem
        if (!item.food_name) continue

        const stations = byPeriod.get(period) ?? new Map<string, MenuFoodItem[]>()
        const items = stations.get(station) ?? []
        items.push(item)
        stations.set(station, items)
        byPeriod.set(period, stations)
        itemCount += 1
    }

    if (itemCount === 0) return null

    const periods: MenuPeriod[] = Array.from(byPeriod.entries())
        .sort((a, b) => compareMealPeriods(a[0], b[0]))
        .map(([period, stations]) => ({
            period,
            stations: Array.from(stations.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([station, items]) => ({
                    station,
                    items: items.sort((a, b) => (a.food_name ?? '').localeCompare(b.food_name ?? '')),
                })),
        }))

    return { periods, itemCount }
}

type VenueData = {
    locations: Location[]
    hours: LocationHours[]
    brands: Map<string, ExternalBrand>
    menus: Map<string, VenueMenuData | null>
    today: string
    upcoming: string[]
}

const loadVenue = cache(async (slug: string): Promise<VenueData | null> => {
    const locations = await getLocationsBySlug(slug)
    if (locations.length === 0) return null

    const today = campusToday()
    const lastDay = shiftDate(today, DAYS_AHEAD)
    const ids = locations.map((l) => l.id)

    const [hours, brands] = await Promise.all([
        getHoursForLocations(ids, today, lastDay).catch(() => [] as LocationHours[]),
        locations.some((l) => l.brand_id)
            ? getBrandsById().catch(() => new Map<string, ExternalBrand>())
            : Promise.resolve(new Map<string, ExternalBrand>()),
    ])

    // The two residential halls run to well past the 1000-row nested-relation cap that
    // `getVenueMenu` does not paginate around, and they already have a full interactive menu
    // at /chase and /lenoir. This page links there instead of printing a truncated menu.
    const menuTargets = locations.filter((l) => l.has_menu && l.kind !== 'dining_hall')
    const menus = new Map<string, VenueMenuData | null>()
    await Promise.all(
        menuTargets.map(async (location) => {
            try {
                menus.set(location.id, normalizeMenu(await getVenueMenu(location.id, today)))
            } catch {
                menus.set(location.id, null)
            }
        }),
    )

    const upcoming: string[] = []
    for (let i = 1; i <= DAYS_AHEAD; i += 1) upcoming.push(shiftDate(today, i))

    return { locations, hours, brands, menus, today, upcoming }
})

export async function generateStaticParams() {
    try {
        const locations = await getLocations()
        return Array.from(new Set(locations.map((l) => l.slug))).map((slug) => ({ slug }))
    } catch {
        return []
    }
}

function venueTitle(locations: Location[]): string {
    const name = locations[0].name
    const buildings = Array.from(new Set(locations.map((l) => buildingMeta(l.venue_group).short)))
    if (buildings.length > 1) {
        return `${name} at UNC — Hours & Menu at ${sentenceList(buildings)}`
    }
    return `${name} — UNC Hours & Menu | ${buildings[0]}`
}

function venueDescription(locations: Location[]): string {
    const name = locations[0].name
    const buildings = Array.from(new Set(locations.map((l) => buildingMeta(l.venue_group).short)))
    const where =
        buildings.length > 1
            ? `has two UNC Chapel Hill locations, in ${sentenceList(buildings)}`
            : `is in ${buildings[0]} at UNC Chapel Hill`

    const hasUncMenu = locations.some((l) => l.has_menu && l.kind !== 'dining_hall')
    const isHall = locations.some((l) => l.kind === 'dining_hall')
    const hasBrand = locations.some((l) => l.brand_id)

    const extra = isHall
        ? "See today's hours, the next seven days of service times, and the full daily menu."
        : hasUncMenu
          ? "See today's hours, the next seven days of service times, and today's published menu with calories and allergens."
          : hasBrand
            ? "See today's hours, the next seven days of service times, and the brand's published nutrition."
            : "See today's hours and the next seven days of service times."

    return `${name} ${where}. ${extra}`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const data = await loadVenue(slug).catch(() => null)
    const path = `/locations/${slug}`

    if (!data) {
        return {
            title: { absolute: 'Campus dining location not found | Eat UNC' },
            alternates: { canonical: canonical(path) },
            robots: { index: false, follow: true },
        }
    }

    const title = venueTitle(data.locations)
    const description = venueDescription(data.locations)

    return {
        title: { absolute: title },
        description,
        alternates: { canonical: canonical(path) },
        openGraph: {
            title,
            description,
            url: canonical(path),
            siteName: 'Eat UNC',
            type: 'website',
        },
        twitter: { card: 'summary_large_image', title, description },
    }
}

/** Where a venue physically sits, said the way a student would say it. */
function roomPhrase(location: Location): string {
    if (location.slug === 'top-of-lenoir') return 'upstairs in Lenoir Hall'
    if (location.slug === 'chase') return 'in Chase Hall on South Campus'

    switch (location.venue_group) {
        case 'Lenoir Hall':
            return 'on the ground floor of Lenoir Hall — the food court students call Bottom of Lenoir'
        case 'Brinkhous-Bullitt Building: The Beach Cafe':
            return 'in The Beach Cafe, the food court inside the Brinkhous-Bullitt Building'
        case 'Chase Hall':
            return 'in Chase Hall on South Campus'
        case 'Food Trucks':
            return 'in the food truck rotation, parking at a campus stop rather than keeping a room'
        case 'Carolina Union':
            return 'in the Carolina Union'
        default:
            return `in ${location.venue_group}`
    }
}

function schemaType(kind: string): string {
    return kind === 'retail' ? 'FoodEstablishment' : 'Restaurant'
}

function anchorId(venueGroup: string): string {
    return venueGroup.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function menuSections(menu: VenueMenuData): MenuSectionInput[] {
    const sections: MenuSectionInput[] = []
    for (const period of menu.periods) {
        for (const station of period.stations) {
            sections.push({
                name: `${prettyMealPeriod(period.period)} · ${station.station}`,
                items: station.items.map((item) => ({
                    name: item.food_name ?? '',
                    calories_kcal: item.calories_kcal,
                    protein_g: item.protein_g,
                    fat_g: item.fat_g,
                    carbohydrates_g: item.carbohydrates_g,
                    amount_per_serving: item.amount_per_serving,
                    dietary_preferences: item.dietary_preferences,
                    allergens: item.allergens,
                })),
            })
        }
    }
    // A JSON-LD blob heavier than the page itself is a mobile payload problem, and 56% of
    // this site's impressions are mobile.
    return sections.slice(0, 24)
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const data = await loadVenue(slug)
    if (!data) notFound()

    const { locations, hours, brands, menus, today, upcoming } = data
    const path = `/locations/${slug}`
    const primary = locations[0]
    const multi = locations.length > 1
    const kind = kindMeta(primary.kind)

    const crumbs = [
        { name: 'Eat UNC', path: '/' },
        { name: 'Campus Dining Locations', path: '/locations' },
        { name: primary.name, path },
    ]

    const restaurantNodes = locations.map((location) => {
        const own = hours.filter((h) => h.location_id === location.id)
        const menu = menus.get(location.id) ?? null
        const brand = location.brand_id ? brands.get(location.brand_id) : undefined
        const sameAs = [location.menu_url, location.external_url, brand?.source_url].filter(
            (url): url is string => Boolean(url),
        )
        const openingHours = toOpeningHoursSpecification(own)

        return {
            '@context': 'https://schema.org',
            '@type': schemaType(location.kind),
            '@id': `${canonical(path)}#${anchorId(location.venue_group)}`,
            name: location.display_label,
            alternateName: location.name,
            url: canonical(path),
            description: `${location.name} is ${roomPhrase(location)} at UNC Chapel Hill.`,
            address: {
                '@type': 'PostalAddress',
                streetAddress: location.venue_group,
                addressLocality: 'Chapel Hill',
                addressRegion: 'NC',
                postalCode: '27599',
                addressCountry: 'US',
            },
            containedInPlace: {
                '@type': 'Place',
                name: location.venue_group,
            },
            parentOrganization: {
                '@type': 'Organization',
                name: 'UNC Chapel Hill Dining Services',
                url: 'https://dining.unc.edu',
            },
            ...(openingHours.length ? { openingHoursSpecification: openingHours } : {}),
            ...(sameAs.length ? { sameAs } : {}),
            ...(menu
                ? {
                      hasMenu: menuSchema({
                          name: `${location.display_label} menu for ${formatCampusDate(today)}`,
                          url: canonical(path),
                          description: `Menu published by UNC Dining for ${location.display_label} on ${today}.`,
                          sections: menuSections(menu),
                      }),
                  }
                : {}),
        }
    })

    return (
        <CampusPage>
            <JsonLd data={breadcrumbList(crumbs)} />
            {restaurantNodes.map((node) => (
                <JsonLd key={node['@id']} data={node} />
            ))}

            <Breadcrumbs crumbs={crumbs} />

            <header className="mb-8">
                <div className="flex items-start gap-4">
                    <IconTile className="w-12 h-12 bg-[#4B9CD3]/10 text-[#2c6f9e] dark:text-[#7cc0ec]">
                        <Utensils className="w-6 h-6" />
                    </IconTile>
                    <div className="min-w-0">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {primary.name}
                        </h1>
                        <p className="mt-2 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                            <MapPin className="w-4 h-4 shrink-0" />
                            {multi
                                ? `${locations.length} locations at UNC Chapel Hill`
                                : buildingMeta(primary.venue_group).heading}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            <Badge className={kind.badgeClass}>{kind.label}</Badge>
                        </div>
                    </div>
                </div>
            </header>

            <section className="mb-10">
                <Prose>
                    <p>
                        {primary.name} is {roomPhrase(primary)}
                        {multi ? ', and in one other campus building' : ''}. {kind.description}
                    </p>
                    {multi && (
                        <p>
                            There are {locations.length} {primary.name} counters on campus, in{' '}
                            {sentenceList(locations.map((l) => buildingMeta(l.venue_group).short))}. UNC lists them
                            separately because they keep different hours, and both are on this page — a venue&apos;s
                            identity on campus is the pair of its name and its building, never the name alone.
                        </p>
                    )}
                    <p>
                        Hours are published by UNC one date at a time rather than as a repeating weekly pattern. Every
                        time below is printed exactly as UNC filed it. Where a day is blank, no hours have been
                        published for it, which normally means the venue is closed that day — during breaks that can
                        run for weeks.
                    </p>
                </Prose>
            </section>

            {locations.map((location) => {
                const todayRows = periodsFor(hours, location.id, today)
                const menu = menus.get(location.id) ?? null
                const brand = location.brand_id ? brands.get(location.brand_id) : undefined
                const upcomingDays = upcoming.map((date) => ({
                    date,
                    rows: periodsFor(hours, location.id, date),
                }))
                const hasAnyUpcoming = upcomingDays.some((d) => d.rows.length > 0)

                return (
                    <section key={location.id} className="mb-12" aria-labelledby={`venue-${location.id}`}>
                        {multi && (
                            <h2
                                id={`venue-${location.id}`}
                                className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4"
                            >
                                {primary.name} in {buildingMeta(location.venue_group).short}
                            </h2>
                        )}

                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <Card className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <IconTile className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <Clock className="w-5 h-5" />
                                    </IconTile>
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                        {multi ? `${buildingMeta(location.venue_group).short} hours today` : 'Hours today'}
                                    </h3>
                                </div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                                    {formatCampusDate(today)}
                                </p>
                                <PeriodRows
                                    rows={todayRows}
                                    empty={`UNC has published no hours for ${location.name} on ${formatCampusDate(today)}.`}
                                />
                            </Card>

                            <Card className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <IconTile className="bg-[#4B9CD3]/10 text-[#2c6f9e] dark:text-[#7cc0ec]">
                                        <CalendarDays className="w-5 h-5" />
                                    </IconTile>
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                        The next 7 days
                                    </h3>
                                </div>
                                {hasAnyUpcoming ? (
                                    <ul className="space-y-2">
                                        {upcomingDays.map(({ date, rows }) => (
                                            <li
                                                key={date}
                                                className="flex items-baseline justify-between gap-4 text-sm border-b border-zinc-100 dark:border-zinc-800 last:border-0 pb-2 last:pb-0"
                                            >
                                                <span className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                                    {formatCampusDateShort(date)}
                                                </span>
                                                <span className="text-right">
                                                    <PeriodSummary rows={rows} empty="No hours published" />
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        UNC has published no hours for {location.name} over the next seven days.
                                    </p>
                                )}
                            </Card>
                        </div>

                        {location.kind === 'dining_hall' && (
                            <Card className="p-5 mb-6">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                                    Today&apos;s {location.name} menu
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                                    {location.name} publishes several hundred items a day across every meal period, so
                                    the full menu lives on its own page, where you can search it, sort by protein or
                                    calories and filter for allergens.
                                </p>
                                <Link
                                    href={locationPath(location)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#4B9CD3] hover:bg-[#3a8bc2] text-white font-semibold transition-colors"
                                >
                                    Open the {location.name} menu
                                </Link>
                            </Card>
                        )}

                        {location.has_menu && location.kind !== 'dining_hall' && (
                            <Card className="p-5 mb-6">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                                    {location.name} menu for {formatCampusDate(today)}
                                </h3>
                                {menu ? (
                                    <>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
                                            {menu.itemCount} items published by UNC Dining, with calories and allergens
                                            as UNC filed them.
                                        </p>
                                        <div className="space-y-6">
                                            {menu.periods.map((period) => (
                                                <div key={period.period}>
                                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-[#2c6f9e] dark:text-[#7cc0ec] mb-3">
                                                        {prettyMealPeriod(period.period)}
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {period.stations.map((station) => (
                                                            <div key={station.station}>
                                                                <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                                                                    {station.station}
                                                                </h5>
                                                                <ul className="space-y-1">
                                                                    {station.items.map((item) => (
                                                                        <li
                                                                            key={`${station.station}-${item.recipe_number}`}
                                                                            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
                                                                        >
                                                                            <span className="text-zinc-900 dark:text-zinc-100">
                                                                                {item.food_name}
                                                                            </span>
                                                                            {item.amount_per_serving && (
                                                                                <span className="text-zinc-400 dark:text-zinc-500 text-xs">
                                                                                    {item.amount_per_serving}
                                                                                </span>
                                                                            )}
                                                                            {item.calories_kcal != null && (
                                                                                <span className="text-zinc-500 dark:text-zinc-400 text-xs tabular-nums">
                                                                                    {item.calories_kcal} cal
                                                                                </span>
                                                                            )}
                                                                            {item.protein_g != null && (
                                                                                <span className="text-zinc-500 dark:text-zinc-400 text-xs tabular-nums">
                                                                                    {item.protein_g}g protein
                                                                                </span>
                                                                            )}
                                                                            {item.allergens && (
                                                                                <span className="text-amber-700 dark:text-amber-400 text-xs">
                                                                                    Contains {item.allergens}
                                                                                </span>
                                                                            )}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                        UNC has not published a menu for {location.name} on{' '}
                                        {formatCampusDate(today)}. Menus normally appear the night before a service
                                        day, and nothing is published for days the venue is closed.
                                    </p>
                                )}
                            </Card>
                        )}

                        {brand && (
                            <Card className="p-5">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                                    {brand.name} nutrition
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
                                    {location.name} serves a brand menu rather than a UNC-published daily one, so its
                                    nutrition is attached to the brand and is the same at every campus counter that
                                    carries it. {brand.coverage_note}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href={`/brands/${brand.slug}`}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#4B9CD3] hover:bg-[#3a8bc2] text-white font-semibold transition-colors"
                                    >
                                        See the full {brand.name} nutrition list
                                    </Link>
                                    {brand.source_url && (
                                        <a
                                            href={brand.source_url}
                                            rel="nofollow noopener"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:border-[#4B9CD3]/50 transition-colors"
                                        >
                                            Source
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </Card>
                        )}
                    </section>
                )
            })}

            <nav aria-label="Related pages" className="grid sm:grid-cols-3 gap-3">
                <Link
                    href="/locations"
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                >
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50">All campus locations</div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Every venue, building by building.</p>
                </Link>
                <Link
                    href="/hours"
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                >
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50">UNC dining hours today</div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Today and tomorrow, all of campus.</p>
                </Link>
                <Link
                    href="/open-now"
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                >
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50">What&apos;s open right now</div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Live, to the minute.</p>
                </Link>
            </nav>
        </CampusPage>
    )
}
