import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { HALL_SLUG_BY_LOCATION_SLUG, getLocations } from '@/lib/campus'
import { loadVenue, venueMetadata, VenueView } from './venueView'

/**
 * The status line and today's menu both depend on the calendar, so this route can never be a
 * frozen static build. `generateStaticParams` still prerenders every venue slug; `revalidate`
 * is what keeps them honest afterwards — and the open/closed line can therefore trail the clock
 * by up to fifteen minutes, which is why it names a time rather than counting down to one.
 */
export const revalidate = 900

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
