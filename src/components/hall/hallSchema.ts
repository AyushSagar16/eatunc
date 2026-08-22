import { toOpeningHoursSpecification } from '@/lib/seo'
import type { LocationHours } from '@/lib/campus'

/**
 * The one description of each hall as a schema.org entity.
 *
 * The same Restaurant node used to be restated three times — once in StructuredData for the
 * dated menu pages and once inline in each hall landing page — with the copies already
 * drifting (different alternateName lists). Every page now builds its node from here, so the
 * hall is one entity to Google no matter which URL emitted the markup.
 */
export type HallProfile = {
    name: string
    alternateName: string[]
    streetAddress: string
    latitude: number
    longitude: number
    description: string
}

export const HALL_PROFILES: Record<string, HallProfile> = {
    chase: {
        name: 'Chase Dining Hall',
        // "Rams Head Dining Hall" was this building's name until the 2017 renaming, and it is
        // still what a good number of people search for.
        alternateName: ['Chase', 'Rams Head Dining Hall', 'Chase Dining Hall UNC'],
        streetAddress: 'South Campus',
        latitude: 35.9049,
        longitude: -79.0469,
        description:
            "Chase Dining Hall is the all-you-care-to-eat dining hall on UNC Chapel Hill's South Campus, renamed from Rams Head Dining Hall in 2017.",
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
 * A Restaurant node for a hall, without `@context` so it can sit standalone or in an `@graph`.
 * Hours become `openingHoursSpecification` only when rows exist — never a hardcoded guess.
 */
export function hallRestaurantNode(opts: {
    routeSlug: string
    id: string
    url: string
    hours?: LocationHours[]
}): Record<string, unknown> | null {
    const profile = HALL_PROFILES[opts.routeSlug]
    if (!profile) return null

    const openingHours = toOpeningHoursSpecification(opts.hours ?? [])

    return {
        '@type': 'Restaurant',
        '@id': opts.id,
        name: profile.name,
        alternateName: profile.alternateName,
        description: profile.description,
        url: opts.url,
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
    }
}
