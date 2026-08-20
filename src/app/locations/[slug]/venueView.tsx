import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, Store } from 'lucide-react'

import {
    campusToday,
    getBrandBySlug,
    getBrandsById,
    getHoursForLocations,
    getLocationsBySlug,
    getVenueMenu,
    getVenueMenuDates,
    shiftDate,
} from '@/lib/campus'
import type { BrandWithItems, ExternalBrand, Location, LocationHours } from '@/lib/campus'
import type { MasterFoodItem } from '@/lib/api'
import { breadcrumbList, canonical, menuSchema, toOpeningHoursSpecification } from '@/lib/seo'
import type { MenuSectionInput } from '@/lib/seo'
import { compareMealPeriods } from '@/lib/utils'
import MenuContainer from '@/components/MenuContainer'
import MenuOutline from '@/components/MenuOutline'
import { Breadcrumbs } from '@/components/campus/CampusChrome'
import { JsonLd } from '@/components/campus/JsonLd'
import { PeriodSummary } from '@/components/campus/HoursList'
import BrandItemsTable, { BrandCategoryNav } from '@/components/brands/BrandItemsTable'
import NutritionSourceLegend from '@/components/brands/NutritionSourceLegend'
import {
    buildingMeta,
    formatCampusDate,
    formatCampusDateShort,
    formatClock,
    kindMeta,
    periodsFor,
    prettyMealPeriod,
    sentenceList,
} from '@/components/campus/campusDisplay'

/** How far ahead hours are loaded — enough to answer "when does it open again" over a weekend. */
const HOURS_AHEAD = 7

/**
 * One `menu_entries` row shaped exactly as `MenuContainer` wants it.
 *
 * `master_food_items` is the whole row rather than a projection: `getVenueMenu` selects every
 * column the table has, so the venue menu feeds the hall's own container unchanged. That is the
 * point of this page — the filters, sort, search and food modal are the hall components, not
 * copies of them.
 */
export type VenueMenuEntry = {
    meal_period: string
    meal_station: string
    recipe_number: number
    master_food_items: MasterFoodItem | null
}

export type VenueData = {
    slug: string
    /** Every location sharing the slug. Four venues run two buildings and both belong here. */
    locations: Location[]
    /** The one whose menu and hours the page leads with. */
    primary: Location
    hours: LocationHours[]
    today: string
    selectedDate: string
    /** Dates the primary location has a stored menu for, oldest first, for the date stepper. */
    availableDates: string[]
    entries: VenueMenuEntry[]
    brand: BrandWithItems | null
    /**
     * The instant the data was read, so the open/closed line is computed against the same
     * moment as the hours it prints — and so nothing calls the clock during render, which
     * would make the markup unstable across re-renders.
     */
    nowMs: number
}

/**
 * `getVenueMenu` returns whatever PostgREST's nested select infers, so the shape is narrowed
 * here rather than asserted. A row whose `master_food_items` join came back empty is dropped
 * instead of rendered as a blank card — the join can miss when a recipe has not been ingested.
 */
function toEntries(raw: unknown): VenueMenuEntry[] {
    if (!raw || typeof raw !== 'object') return []
    const rows = (raw as { menu_entries?: unknown }).menu_entries
    if (!Array.isArray(rows)) return []

    const entries: VenueMenuEntry[] = []
    for (const row of rows) {
        if (!row || typeof row !== 'object') continue
        const entry = row as {
            meal_period?: unknown
            meal_station?: unknown
            recipe_number?: unknown
            master_food_items?: unknown
        }
        const period = typeof entry.meal_period === 'string' ? entry.meal_period : ''
        const food = entry.master_food_items
        if (!period || !food || typeof food !== 'object') continue

        const item = food as MasterFoodItem
        if (!item.food_name) continue

        entries.push({
            meal_period: period,
            meal_station: typeof entry.meal_station === 'string' ? entry.meal_station : 'MENU',
            recipe_number: typeof entry.recipe_number === 'number' ? entry.recipe_number : item.recipe_number,
            master_food_items: item,
        })
    }
    return entries
}

function isOpenAt(row: LocationHours, atMs: number): boolean {
    const opens = Date.parse(row.opens_at)
    const closes = Date.parse(row.closes_at)
    return !Number.isNaN(opens) && !Number.isNaN(closes) && opens <= atMs && atMs < closes
}

/**
 * Which of a colliding slug's locations leads the page.
 *
 * Mediterranean Deli, Bandido's, Zayka Indian Grill and Alpaca Peruvian Chicken each run two
 * counters in two buildings, and both belong on one URL — splitting them would put two
 * near-identical pages in competition for "zayka unc". Only one menu can be on screen, so it
 * goes to the counter someone could actually walk to: open now first, then whichever has food
 * published for the day being shown, then whichever is open at all today. Alphabetical order
 * is the last resort and never the reason — Zayka's Beach Cafe counter sorts first and is shut
 * for the week, which is exactly the page nobody wants.
 */
function pickPrimary(
    locations: Location[],
    hours: LocationHours[],
    menuDates: Map<string, string[]>,
    targetDate: string,
    today: string,
    nowMs: number,
): Location {
    if (locations.length === 1) return locations[0]

    const score = (l: Location) =>
        (hours.some((h) => h.location_id === l.id && isOpenAt(h, nowMs)) ? 4 : 0) +
        ((menuDates.get(l.id) ?? []).includes(targetDate) ? 2 : 0) +
        (hours.some((h) => h.location_id === l.id && h.service_date === today) ? 1 : 0)

    return locations.reduce((best, l) => (score(l) > score(best) ? l : best), locations[0])
}

/**
 * The date whose menu to show.
 *
 * An explicit date in the URL is honoured verbatim, closed or not — the same contract
 * `/chase/2026-01-08` has. Without one the page wants today, and falls back to the nearest
 * stored date so a venue between publishing runs still shows food rather than an empty shell.
 */
function resolveDate(requested: string | undefined, today: string, availableDates: string[]): string {
    if (requested) return requested
    if (availableDates.includes(today)) return today
    return availableDates.find((d) => d >= today) ?? availableDates[availableDates.length - 1] ?? today
}

export const loadVenue = cache(async (slug: string, requestedDate?: string): Promise<VenueData | null> => {
    const locations = await getLocationsBySlug(slug)
    if (locations.length === 0) return null

    const today = campusToday()
    const nowMs = Date.now()

    // Yesterday is in the window because a period that opened last night can still be running
    // now; the same reason `getOpenNow` reaches back a day.
    const hours = await getHoursForLocations(
        locations.map((l) => l.id),
        shiftDate(today, -1),
        shiftDate(today, HOURS_AHEAD),
    ).catch(() => [] as LocationHours[])

    // Which dates each counter has food for. One small query per location — a colliding slug
    // has two — and it is what lets the page lead with the counter that is actually serving.
    const menuDates = new Map<string, string[]>(
        await Promise.all(
            locations.map(async (l): Promise<[string, string[]]> => [
                l.id,
                l.has_menu ? (await getVenueMenuDates(l.id).catch(() => [] as string[])).slice().sort() : [],
            ]),
        ),
    )

    const primary = pickPrimary(locations, hours, menuDates, requestedDate ?? today, today, nowMs)

    const availableDates = menuDates.get(primary.id) ?? []
    const selectedDate = resolveDate(requestedDate, today, availableDates)
    const entries = primary.has_menu
        ? toEntries(await getVenueMenu(primary.id, selectedDate).catch(() => null))
        : []

    // Third-party nutrition attaches to the brand, not to this location or this date — Alpaca's
    // two counters share one menu, and Chick-fil-A's is the same every day.
    let brand: BrandWithItems | null = null
    const brandId = locations.map((l) => l.brand_id).find((id): id is string => Boolean(id))
    if (brandId) {
        const brands = await getBrandsById().catch(() => new Map<string, ExternalBrand>())
        const meta = brands.get(brandId)
        if (meta) brand = await getBrandBySlug(meta.slug).catch(() => null)
    }

    return { slug, locations, primary, hours, today, selectedDate, availableDates, entries, brand, nowMs }
})

function venueTitle(locations: Location[]): string {
    const name = locations[0].name
    const buildings = Array.from(new Set(locations.map((l) => buildingMeta(l.venue_group).short)))
    if (buildings.length > 1) {
        return `${name} at UNC — Menu & Hours at ${sentenceList(buildings)}`
    }
    return `${name} — UNC Menu & Hours | ${buildings[0]}`
}

/**
 * A description that differs venue to venue.
 *
 * The obvious shape — one sentence with the name swapped in — is exactly what makes
 * dining.unc.edu beatable: every page on that site carries the identical meta description,
 * so none of them says anything. These lean on facts that actually differ per venue: the
 * building, what kind of operation it is, and how many items carry nutrition.
 *
 * Deliberately no opening times, even though they are loaded here. A description is cached in
 * the index for weeks, and "open until 3:00 pm" would keep being shown on days when it is
 * false. Hours belong on the page, where they are current.
 */
function venueDescription(data: VenueData): string {
    const { locations, entries, brand } = data
    const name = locations[0].name
    const buildings = Array.from(new Set(locations.map((l) => buildingMeta(l.venue_group).short)))
    const isTruck = locations.some((l) => l.venue_group === 'Food Trucks')

    const where = isTruck
        ? 'parks on the UNC Chapel Hill campus'
        : buildings.length > 1
          ? `serves two UNC Chapel Hill locations, in ${sentenceList(buildings)}`
          : `is in ${buildings[0]} at UNC Chapel Hill`

    let extra: string
    if (entries.length > 0) {
        extra = `Today's menu — ${entries.length} items with calories, protein and allergens — searchable, sortable and filterable by diet.`
    } else if (brand) {
        extra = `Nutrition for ${brand.external_food_items.length} ${brand.name} items — calories, protein, fat, carbs and allergens, each marked as published by the operator or estimated by us.`
    } else {
        extra = 'Service times for today and the week ahead.'
    }

    if (isTruck) {
        extra = `Part of the campus food truck rotation, so where it parks moves. ${extra}`
    }

    return `${name} ${where}. ${extra}`
}

/**
 * Metadata for both the undated and dated venue routes.
 *
 * `canonicalPath` differs from `path` only on a dated URL, which points its canonical at the
 * venue's own page — the ranking signal belongs on one URL, not on one per stored date.
 */
export async function venueMetadata(
    slug: string,
    path: string,
    canonicalPath: string,
    requestedDate?: string,
): Promise<Metadata> {
    const data = await loadVenue(slug, requestedDate).catch(() => null)

    if (!data) {
        return {
            title: { absolute: 'Campus dining location not found | Eat UNC' },
            alternates: { canonical: canonical(path) },
            robots: { index: false, follow: true },
        }
    }

    const title = requestedDate
        ? `${data.locations[0].name} menu — ${formatCampusDate(requestedDate)} | UNC`
        : venueTitle(data.locations)
    const description = venueDescription(data)

    return {
        title: { absolute: title },
        description,
        alternates: { canonical: canonical(canonicalPath) },
        openGraph: { title, description, url: canonical(path), siteName: 'Eat UNC', type: 'website' },
        twitter: { card: 'summary_large_image', title, description },
        ...(requestedDate ? { robots: { index: false, follow: true } } : {}),
    }
}

/** Where a venue physically sits, said the way a student would say it. */
function roomPhrase(location: Location): string {
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

function menuSections(entries: VenueMenuEntry[]): MenuSectionInput[] {
    const byGroup = new Map<string, VenueMenuEntry[]>()
    for (const entry of entries) {
        const key = `${prettyMealPeriod(entry.meal_period)} · ${entry.meal_station}`
        const bucket = byGroup.get(key)
        if (bucket) bucket.push(entry)
        else byGroup.set(key, [entry])
    }

    // A JSON-LD blob heavier than the page itself is a mobile payload problem, and 56% of
    // this site's impressions are mobile.
    return Array.from(byGroup.entries())
        .slice(0, 24)
        .map(([name, rows]) => ({
            name,
            items: rows.map((row) => ({
                name: row.master_food_items?.food_name ?? '',
                calories_kcal: row.master_food_items?.calories_kcal,
                protein_g: row.master_food_items?.protein_g,
                fat_g: row.master_food_items?.fat_g,
                carbohydrates_g: row.master_food_items?.carbohydrates_g,
                amount_per_serving: row.master_food_items?.amount_per_serving,
                dietary_preferences: row.master_food_items?.dietary_preferences,
                allergens: row.master_food_items?.allergens,
            })),
        }))
}

/**
 * Whether the doors are open, in the app's own words.
 *
 * Never a guess: the times printed are `opens_label` / `closes_label`, the strings UNC itself
 * publishes, so this line can never contradict the hours below it. The instants come from the
 * timestamptz columns, which makes an overnight period fall out for free.
 */
function venueStatus(hours: LocationHours[], locationId: string, today: string, nowMs: number): string {
    const rows = hours.filter((h) => h.location_id === locationId)
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

function StatusLine({
    location,
    hours,
    today,
    nowMs,
    showBuilding,
}: {
    location: Location
    hours: LocationHours[]
    today: string
    nowMs: number
    showBuilding: boolean
}) {
    const status = venueStatus(hours, location.id, today, nowMs)
    const isOpen = status.startsWith('Open')

    return (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <span
                className={`font-semibold ${isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}
            >
                {status}
            </span>
            {showBuilding && (
                <span className="text-zinc-500 dark:text-zinc-400">
                    {buildingMeta(location.venue_group).short}
                </span>
            )}
            <span className="text-zinc-400 dark:text-zinc-500">
                <PeriodSummary rows={periodsFor(hours, location.id, today)} empty="No hours today" />
            </span>
        </div>
    )
}

/**
 * The bar above the menu: breadcrumbs, whether the place is open, and today's hours.
 *
 * This is all that survives of the old venue page. It used to open with three paragraphs of
 * prose, two hours cards and a seven-day table before showing any food at all — and on a
 * venue with a UNC-published menu, showed none. A person on this page wants to know what is
 * being served and whether they can still get it; everything else is a click away at /hours.
 */
function VenueStatusBar({ data }: { data: VenueData }) {
    const { locations, primary, hours, today, nowMs } = data
    const others = locations.filter((l) => l.id !== primary.id)

    return (
        <div className="space-y-1.5">
            <StatusLine
                location={primary}
                hours={hours}
                today={today}
                nowMs={nowMs}
                showBuilding={locations.length > 1}
            />
            {others.map((other) => (
                <StatusLine
                    key={other.id}
                    location={other}
                    hours={hours}
                    today={today}
                    nowMs={nowMs}
                    showBuilding
                />
            ))}
        </div>
    )
}

function BrandLink({ brand }: { brand: BrandWithItems }) {
    return (
        <div className="flex flex-wrap gap-3">
            <Link
                href={`/brands/${brand.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#4B9CD3] hover:bg-[#3a8bc2] text-white font-semibold transition-colors"
            >
                <Store className="w-4 h-4" aria-hidden="true" />
                Full {brand.name} nutrition
            </Link>
            {brand.source_url && (
                <a
                    href={brand.source_url}
                    rel="nofollow noopener"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:border-[#4B9CD3]/50 transition-colors"
                >
                    Source
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
            )}
        </div>
    )
}

export function VenueView({ data }: { data: VenueData }) {
    const { locations, primary, hours, selectedDate, availableDates, entries, brand } = data
    const multi = locations.length > 1
    const menuTitle = multi ? `${primary.name} · ${buildingMeta(primary.venue_group).short}` : primary.name

    const crumbs = [
        { name: 'Eat UNC', path: '/' },
        { name: 'Campus Dining Locations', path: '/locations' },
        { name: primary.name, path: `/locations/${data.slug}` },
    ]

    const restaurantNodes = locations.map((location) => {
        const openingHours = toOpeningHoursSpecification(hours.filter((h) => h.location_id === location.id))
        const sameAs = [location.menu_url, location.external_url, brand?.source_url].filter(
            (url): url is string => Boolean(url),
        )
        const isPrimary = location.id === primary.id

        return {
            '@context': 'https://schema.org',
            '@type': schemaType(location.kind),
            '@id': `${canonical(`/locations/${data.slug}`)}#${anchorId(location.venue_group)}`,
            name: location.display_label,
            alternateName: location.name,
            url: canonical(`/locations/${data.slug}`),
            description: `${location.name} is ${roomPhrase(location)} at UNC Chapel Hill.`,
            address: {
                '@type': 'PostalAddress',
                streetAddress: location.venue_group,
                addressLocality: 'Chapel Hill',
                addressRegion: 'NC',
                postalCode: '27599',
                addressCountry: 'US',
            },
            containedInPlace: { '@type': 'Place', name: location.venue_group },
            parentOrganization: {
                '@type': 'Organization',
                name: 'UNC Chapel Hill Dining Services',
                url: 'https://dining.unc.edu',
            },
            ...(openingHours.length ? { openingHoursSpecification: openingHours } : {}),
            ...(sameAs.length ? { sameAs } : {}),
            ...(isPrimary && entries.length > 0
                ? {
                      hasMenu: menuSchema({
                          name: `${location.display_label} menu for ${formatCampusDate(selectedDate)}`,
                          url: canonical(`/locations/${data.slug}`),
                          description: `Menu published by UNC Dining for ${location.display_label} on ${selectedDate}.`,
                          sections: menuSections(entries),
                      }),
                  }
                : {}),
            ...(isPrimary && entries.length === 0 && brand && brand.external_food_items.length > 0
                ? {
                      hasMenu: menuSchema({
                          name: `${brand.name} menu at ${location.display_label}`,
                          url: canonical(`/brands/${brand.slug}`),
                          sections: [
                              {
                                  name: brand.name,
                                  items: brand.external_food_items.map((item) => ({
                                      name: item.item_name,
                                      calories_kcal: item.calories_kcal,
                                      protein_g: item.protein_g,
                                      fat_g: item.fat_g,
                                      carbohydrates_g: item.carbohydrates_g,
                                      amount_per_serving: item.serving_description,
                                      dietary_preferences: item.dietary_preferences,
                                      allergens: item.allergens,
                                  })),
                              },
                          ],
                      }),
                  }
                : {}),
        }
    })

    const availablePeriods = Array.from(new Set(entries.map((e) => e.meal_period)))
    availablePeriods.sort(compareMealPeriods)

    const header = (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-3">
            <Breadcrumbs crumbs={crumbs} />
            <VenueStatusBar data={data} />
        </div>
    )

    const structuredData = (
        <>
            <JsonLd data={breadcrumbList(crumbs)} />
            {restaurantNodes.map((node) => (
                <JsonLd key={node['@id']} data={node} />
            ))}
        </>
    )

    // Shape one: a UNC-published daily menu. The hall container, unchanged — its own `<h1>`,
    // meal-period tabs, search, sort, the three filter families and the food modal. Rendered
    // even when the venue is shut: the menu is the reason someone is here.
    if (primary.has_menu) {
        return (
            <div className="min-h-screen">
                {structuredData}
                {header}
                <MenuContainer
                    key={`${selectedDate}-${primary.id}`}
                    allEntries={entries}
                    availablePeriods={availablePeriods}
                    availableDates={availableDates}
                    selectedDate={selectedDate}
                    selectedHall={menuTitle}
                    dateBasePath={`/locations/${data.slug}`}
                    switchLink={{ label: 'All venues', href: '/locations' }}
                />
                <MenuOutline
                    entries={entries}
                    hallName={menuTitle}
                    formattedDate={formatCampusDate(selectedDate)}
                />
                {brand && (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
                        <BrandLink brand={brand} />
                    </section>
                )}
            </div>
        )
    }

    // Shape two: a third-party brand. There is no per-date UNC menu to show and inventing one
    // would be a lie, so the brand's own nutrition set is rendered here and /brands/<slug>
    // stays the page that owns it.
    if (brand) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
                {structuredData}
                {header}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-4 mb-3">
                        {primary.name}
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl mb-6">
                        {primary.name} serves a brand menu rather than a UNC-published daily one, so it
                        does not change day to day and its nutrition is the same at every campus counter
                        that carries it.
                    </p>
                    <div className="mb-8">
                        <BrandLink brand={brand} />
                    </div>

                    {brand.external_food_items.length > 0 ? (
                        <>
                            <div className="mb-6">
                                <NutritionSourceLegend />
                            </div>
                            <div className="mb-6">
                                <BrandCategoryNav items={brand.external_food_items} />
                            </div>
                            <BrandItemsTable items={brand.external_food_items} />
                        </>
                    ) : (
                        <p className="text-zinc-600 dark:text-zinc-300">
                            We do not have nutrition on file for {brand.name} yet.
                        </p>
                    )}
                </div>
            </main>
        )
    }

    // Shape three: neither. Say so in one line rather than padding the page out.
    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
            {structuredData}
            {header}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-4 mb-3">
                    {primary.name}
                </h1>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl mb-6">
                    {kindMeta(primary.kind).description} Neither UNC nor the operator publishes a menu we
                    can show for {primary.name}, so this page carries its hours and nothing it cannot
                    stand behind.
                </p>
                <Link
                    href="/locations"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#4B9CD3] hover:bg-[#3a8bc2] text-white font-semibold transition-colors"
                >
                    All campus dining locations
                </Link>
            </div>
        </main>
    )
}
