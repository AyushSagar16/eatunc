import { groupByPeriodAndStation, type OutlineEntry } from './MenuOutline'
import { breadcrumbList, jsonLd, menuSchema, toOpeningHoursSpecification, canonical } from '@/lib/seo'
import type { LocationHours } from '@/lib/campus'

type HallProfile = {
    name: string
    alternateName: string[]
    streetAddress: string
    latitude: number
    longitude: number
    description: string
}

const HALL_PROFILES: Record<string, HallProfile> = {
    chase: {
        name: 'Chase Dining Hall',
        // "Rams Head Dining Hall" was this building's name until the 2017 renaming, and it is
        // still what a good number of people search for.
        alternateName: ['Chase', 'Rams Head Dining Hall', 'Chase Dining Hall UNC'],
        streetAddress: 'South Campus',
        latitude: 35.9049,
        longitude: -79.0469,
        description:
            "Chase Dining Hall is the all-you-care-to-eat dining hall on UNC Chapel Hill's South Campus, serving breakfast, lunch, late lunch and dinner across multiple stations.",
    },
    lenoir: {
        name: 'Top of Lenoir Dining Hall',
        // "Top of Lenoir" is the upstairs hall; "Bottom of Lenoir" is the downstairs food court
        // and is a different set of venues, so it is deliberately NOT an alternate name here.
        alternateName: ['Top of Lenoir', 'Lenoir Dining Hall', 'Lenoir Hall'],
        streetAddress: 'Lenoir Hall, North Campus',
        latitude: 35.9101,
        longitude: -79.0481,
        description:
            "Top of Lenoir is the all-you-care-to-eat dining hall upstairs in Lenoir Hall on UNC Chapel Hill's North Campus.",
    },
}

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
    const openingHours = toOpeningHoursSpecification(hours)

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

    const restaurant = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        '@id': `${url}#restaurant`,
        name: profile.name,
        alternateName: profile.alternateName,
        description: profile.description,
        url,
        servesCuisine: ['American', 'International', 'Vegetarian', 'Vegan'],
        priceRange: '$$',
        acceptsReservations: false,
        address: {
            '@type': 'PostalAddress',
            streetAddress: profile.streetAddress,
            addressLocality: 'Chapel Hill',
            addressRegion: 'NC',
            postalCode: '27599',
            addressCountry: 'US',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: profile.latitude,
            longitude: profile.longitude,
        },
        parentOrganization: {
            '@type': 'Organization',
            name: 'Carolina Dining Services',
            alternateName: 'CDS',
            url: 'https://dining.unc.edu',
        },
        ...(openingHours.length ? { openingHoursSpecification: openingHours } : {}),
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
        { name: profile.name, path: hall === 'chase' ? '/chase-menu' : '/lenoir-menu' },
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
