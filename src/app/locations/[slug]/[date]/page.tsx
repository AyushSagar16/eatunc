import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { HALL_SLUG_BY_LOCATION_SLUG } from '@/lib/campus'
import { loadVenue, venueMetadata, VenueView } from '../venueView'

/**
 * A venue's menu on a specific date — where the date stepper in the menu header lands.
 *
 * Deliberately not prerendered and deliberately `noindex, follow`, with its canonical pointing
 * back at `/locations/<slug>`. Google had indexed the whole back-catalogue of dated hall URLs
 * and was serving a January menu for an August query; there is no reason to repeat that across
 * 38 more venues. The dates stay reachable, they just do not compete.
 */
export const revalidate = 900

interface PageProps {
    params: Promise<{ slug: string; date: string }>
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug, date } = await params
    if (!ISO_DATE.test(date) || HALL_SLUG_BY_LOCATION_SLUG[slug]) {
        return { robots: { index: false, follow: true } }
    }
    return venueMetadata(slug, `/locations/${slug}/${date}`, `/locations/${slug}`, date)
}

export default async function VenueDatePage({ params }: PageProps) {
    const { slug, date } = await params

    const hall = HALL_SLUG_BY_LOCATION_SLUG[slug]
    if (hall) redirect(`/${hall}/${date}`)

    // Validated before any fetching so notFound() sets a real 404 rather than arriving after
    // the response has started streaming.
    if (!ISO_DATE.test(date)) notFound()

    const data = await loadVenue(slug, date)
    if (!data) notFound()

    return <VenueView data={data} />
}
