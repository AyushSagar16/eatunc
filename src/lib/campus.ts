import { supabase } from './supabase'
import { Database } from '@/lib/database.types'

export type Location = Database['public']['Tables']['locations']['Row']
export type LocationHours = Database['public']['Tables']['location_hours']['Row']
export type ExternalBrand = Database['public']['Tables']['external_brands']['Row']
export type ExternalFoodItem = Database['public']['Tables']['external_food_items']['Row']

export type LocationWithHours = Location & { location_hours: LocationHours[] }

export type BrandWithItems = ExternalBrand & { external_food_items: ExternalFoodItem[] }

/**
 * A venue's identity is `(venue_group, name)`, never name alone — Mediterranean Deli,
 * Bandido's, Zayka Indian Grill and Alpaca Peruvian Chicken each operate in two buildings.
 * Four of the 42 slugs therefore collide, so `/locations/<slug>` resolves to a LIST of
 * locations rather than one. A collision renders both venues on the single page instead of
 * splitting the search intent across two near-identical URLs that would compete with each
 * other for "mediterranean deli unc".
 */
export const CAMPUS_TIMEZONE = 'America/New_York'

/** Today's date in Chapel Hill, as YYYY-MM-DD. The dining day is always local. */
export function campusToday(now: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: CAMPUS_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now)
}

/** The two residential halls already own `/chase` and `/lenoir`; everything else is a venue. */
export const HALL_SLUG_BY_LOCATION_SLUG: Record<string, string> = {
    chase: 'chase',
    'top-of-lenoir': 'lenoir',
}

/** Canonical site path for a location — halls keep their historic short URLs. */
export function locationPath(location: Pick<Location, 'slug'>): string {
    const hall = HALL_SLUG_BY_LOCATION_SLUG[location.slug]
    return hall ? `/${hall}` : `/locations/${location.slug}`
}

/**
 * Supabase caps nested relations at 1000 rows (see `getFullMenuByDateAndHall`). Hours are
 * fetched flat and paginated rather than nested for exactly that reason: 42 venues over a
 * two-week window clears 1000 rows on its own.
 */
async function fetchAllHours(filter: (q: ReturnType<typeof hoursQuery>) => ReturnType<typeof hoursQuery>) {
    const PAGE_SIZE = 1000
    const all: LocationHours[] = []
    let offset = 0

    for (;;) {
        const { data, error } = await filter(hoursQuery()).range(offset, offset + PAGE_SIZE - 1)
        if (error) throw error
        if (!data?.length) break
        all.push(...(data as LocationHours[]))
        if (data.length < PAGE_SIZE) break
        offset += PAGE_SIZE
    }

    return all
}

function hoursQuery() {
    return supabase
        .from('location_hours')
        .select('*')
        .order('service_date', { ascending: true })
        .order('sort_order', { ascending: true })
}

/** Every venue UNC currently lists, ordered so buildings group together. */
export async function getLocations(): Promise<Location[]> {
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('active', true)
        .order('venue_group', { ascending: true })
        .order('name', { ascending: true })

    if (error) throw error
    return data ?? []
}

/** All locations sharing a slug — one row normally, two for the four colliding venues. */
export async function getLocationsBySlug(slug: string): Promise<Location[]> {
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .order('venue_group', { ascending: true })

    if (error) throw error
    return data ?? []
}

/** Service periods for the given locations across a date window, oldest date first. */
export async function getHoursForLocations(
    locationIds: string[],
    fromDate: string,
    toDate: string,
): Promise<LocationHours[]> {
    if (locationIds.length === 0) return []
    return fetchAllHours((q) =>
        q.in('location_id', locationIds).gte('service_date', fromDate).lte('service_date', toDate),
    )
}

/** Every venue's service periods for a single date. Powers `/hours`. */
export async function getHoursForDate(date: string): Promise<LocationHours[]> {
    return fetchAllHours((q) => q.eq('service_date', date))
}

export type OpenPeriod = { location: Location; period: LocationHours; opensAt: number; closesAt: number }

/**
 * What is serving food at this instant, and what opens next.
 *
 * `opens_at` / `closes_at` are timestamptz, so this is a plain instant comparison needing no
 * timezone arithmetic — which also makes overnight periods (Late Night runs past midnight into
 * the next service_date) fall out for free. They are compared as epoch milliseconds rather than
 * as strings because Postgres serialises the offset as `+00:00` while `Date.toISOString()`
 * writes `Z`, so two spellings of the same instant do not compare equal as text.
 */
export async function getOpenNow(now: Date = new Date()): Promise<{
    open: OpenPeriod[]
    openingSoon: OpenPeriod[]
    locations: Location[]
}> {
    const nowMs = now.getTime()
    const today = campusToday(now)
    // A Late Night period that began yesterday can still be open now, and tomorrow's
    // breakfast is the "opening next" answer after the last venue closes.
    const yesterday = shiftDate(today, -1)
    const tomorrow = shiftDate(today, 1)

    const [locations, hours] = await Promise.all([
        getLocations(),
        fetchAllHours((q) => q.gte('service_date', yesterday).lte('service_date', tomorrow)),
    ])

    const byId = new Map(locations.map((l) => [l.id, l]))

    const open: OpenPeriod[] = []
    const openingSoon: OpenPeriod[] = []

    for (const period of hours) {
        const location = byId.get(period.location_id)
        if (!location) continue

        const opensAt = Date.parse(period.opens_at)
        const closesAt = Date.parse(period.closes_at)
        if (Number.isNaN(opensAt) || Number.isNaN(closesAt)) continue

        if (opensAt <= nowMs && nowMs < closesAt) {
            open.push({ location, period, opensAt, closesAt })
        } else if (opensAt > nowMs) {
            openingSoon.push({ location, period, opensAt, closesAt })
        }
    }

    open.sort((a, b) => a.closesAt - b.closesAt)
    openingSoon.sort((a, b) => a.opensAt - b.opensAt)

    // One "next opening" per venue, and only venues that are not already open.
    const openIds = new Set(open.map((o) => o.location.id))
    const seen = new Set<string>()
    const nextPerLocation = openingSoon.filter(({ location }) => {
        if (openIds.has(location.id) || seen.has(location.id)) return false
        seen.add(location.id)
        return true
    })

    return { open, openingSoon: nextPerLocation, locations }
}

/** YYYY-MM-DD arithmetic that does not go through a local-timezone Date. */
export function shiftDate(date: string, days: number): string {
    const [y, m, d] = date.split('-').map(Number)
    const t = Date.UTC(y, m - 1, d) + days * 86_400_000
    const shifted = new Date(t)
    return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(
        shifted.getUTCDate(),
    ).padStart(2, '0')}`
}

/** A third-party brand and its full published/estimated nutrition set. */
export async function getBrandBySlug(slug: string): Promise<BrandWithItems | null> {
    const { data, error } = await supabase
        .from('external_brands')
        .select('*, external_food_items (*)')
        .eq('slug', slug)
        .maybeSingle()

    if (error) throw error
    if (!data) return null

    const brand = data as BrandWithItems
    brand.external_food_items.sort(
        (a, b) => a.category.localeCompare(b.category) || a.item_name.localeCompare(b.item_name),
    )
    return brand
}

export async function getBrands(): Promise<ExternalBrand[]> {
    const { data, error } = await supabase.from('external_brands').select('*').order('name')
    if (error) throw error
    return data ?? []
}

/** Brands keyed by id, for stitching a location to the nutrition its brand publishes. */
export async function getBrandsById(): Promise<Map<string, ExternalBrand>> {
    const brands = await getBrands()
    return new Map(brands.map((b) => [b.id, b]))
}

/**
 * The UNC-published menu for a venue on a date. Venues are joined on `location_id` rather
 * than on `dining_hall`, whose value is the `display_label` and therefore changes the moment
 * a second building opens a venue with the same name.
 */
export async function getVenueMenu(locationId: string, date: string) {
    const { data, error } = await supabase
        .from('menus')
        .select(
            `
            id,
            menu_date,
            dining_hall,
            menu_entries (
                meal_period,
                meal_station,
                recipe_number,
                master_food_items (
                    recipe_number,
                    food_name,
                    calories_kcal,
                    protein_g,
                    fat_g,
                    carbohydrates_g,
                    amount_per_serving,
                    dietary_preferences,
                    allergens
                )
            )
        `,
        )
        .eq('location_id', locationId)
        .eq('menu_date', date)
        .maybeSingle()

    if (error) throw error
    return data
}

/** Dates a venue has a stored menu for, newest first. */
export async function getVenueMenuDates(locationId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('menus')
        .select('menu_date')
        .eq('location_id', locationId)
        .order('menu_date', { ascending: false })

    if (error) throw error
    return Array.from(new Set((data ?? []).map((r) => r.menu_date)))
}
