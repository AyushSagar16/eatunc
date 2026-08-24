import { groupByPeriodAndStation, type OutlineEntry } from './MenuOutline'
import { breadcrumbList, jsonLd, menuSchema, canonical } from '@/lib/seo'
import { HALL_BY_ROUTE_SLUG, type LocationHours } from '@/lib/campus'
import { HALL_PROFILES, hallRestaurantNode } from './hall/hallSchema'

/**
 * Menu markup for a hall on a date, rendered into the server HTML.
 *
 * This was previously two `next/script` tags. `next/script` defaults to `afterInteractive`,
 * which injects on the client — so none of it appeared in the response Googlebot reads, and
 * the site had effectively no structured data at all. A plain inline script tag in a server
 * component is the only form that ships in the HTML.
 *
 * The old markup also hardcoded "07:00–21:00 weekdays" and emitted a `hasMenu` stub with no
 * items. Both now come from the database, so the markup cannot drift from the page.
 */
export default function StructuredData({
    hall,
    date,
    formattedDate,
    entries = [],
    hours = [],
}: {
    hall: string
    date: string
    formattedDate: string
    entries?: OutlineEntry[]
    hours?: LocationHours[]
}) {
    const profile = HALL_PROFILES[hall]
    if (!profile) return null

    const url = canonical(`/${hall}/${date}`)
    const grouped = groupByPeriodAndStation(entries)

    const sections = grouped.flatMap(({ period, stations }) =>
        stations.map((station) => ({
            name: `${period} — ${station.station}`,
            items: station.items.map((item) => ({
                name: item.master_food_items?.food_name ?? '',
                calories_kcal: item.master_food_items?.calories_kcal,
                protein_g: item.master_food_items?.protein_g,
            })),
        })),
    )

    // The @id is the hall's evergreen entity on its landing page, not the dated URL —
    // one physical restaurant, not a new entity per date. Every day's markup then merges
    // into the same stable hall entity instead of declaring a new restaurant for each date.
    const landingPath = HALL_BY_ROUTE_SLUG[hall].landingPath

    const restaurant = {
        '@context': 'https://schema.org',
        ...hallRestaurantNode({
            routeSlug: hall,
            id: `${canonical(landingPath)}#restaurant`,
            url,
            hours,
        }),
        ...(sections.length
            ? {
                  hasMenu: menuSchema({
                      name: `${profile.name} menu for ${formattedDate}`,
                      url,
                      description: `Every item served at ${profile.name} on ${formattedDate}, with calories and protein.`,
                      sections,
                  }),
              }
            : {}),
    }

    const breadcrumbs = breadcrumbList([
        { name: 'Eat UNC', path: '/' },
        { name: profile.name, path: landingPath },
        { name: formattedDate, path: `/${hall}/${date}` },
    ])

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd(restaurant) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }}
            />
        </>
    )
}
