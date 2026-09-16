import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { HALL_SLUG_BY_LOCATION_SLUG, getLocations } from '@/lib/campus'
import { loadVenue, venueMetadata, VenueView } from './venueView'

/**
 * The status line and today's menu both depend on the calendar, so this route can never be a
 * frozen static build. `generateStaticParams` still prerenders every venue slug; `revalidate`
 * is what keeps them honest afterwards — and the open/closed line can therefore trail the clock
 * by up to an hour, which is why it names a time rather than counting down to one.
 *
 * An hour rather than the fifteen minutes this used to be, because this route is 38 prerendered
 * paths and was the largest single consumer of the ISR write allowance: 38 × 96 regenerations a
 * day, none of them free, because `loadVenue` bakes `Date.now()` into the output so no two
 * copies are ever byte-identical. Lifting the interval is the blunt lever; de-clocking the
 * output and revalidating on demand from the nightly sweep is the one that actually fixes it.
 */
export const revalidate = 3600

interface PageProps {
    params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
    try {
        const locations = await getLocations()
        return Array.from(new Set(locations.map((l) => l.slug)))
            // The halls redirect; prerendering a redirect is pointless.
            .filter((slug) => !HALL_SLUG_BY_LOCATION_SLUG[slug])
            .map((slug) => ({ slug }))
    } catch {
        return []
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    if (HALL_SLUG_BY_LOCATION_SLUG[slug]) {
        return { robots: { index: false, follow: true } }
    }
    const path = `/locations/${slug}`
    return venueMetadata(slug, path, path)
}

export default async function VenuePage({ params }: PageProps) {
    const { slug } = await params

    // Chase and Top of Lenoir are rows in `locations` like everything else, but they own
    // `/chase` and `/lenoir` — richer pages with a hall switcher and the full day. A third URL
    // here would compete with them for "chase dining hall menu".
    const hall = HALL_SLUG_BY_LOCATION_SLUG[slug]
    if (hall) redirect(`/${hall}`)

    const data = await loadVenue(slug)
    if (!data) notFound()

    return <VenueView data={data} />
}
