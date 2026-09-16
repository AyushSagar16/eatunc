import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { HALL_SLUG_BY_LOCATION_SLUG, getLocations } from '@/lib/campus'
import { loadVenue, venueMetadata, VenueView } from './venueView'

/**
 * Today's menu depends on the calendar, so this route can never be a frozen static build.
 * `generateStaticParams` prerenders every venue slug and the nightly sweep rebuilds them
 * through `/api/revalidate`; the day below is the fallback for a night that call fails.
 *
 * These 38 paths were the largest single consumer of the ISR write allowance — 38 × 96
 * regenerations a day, none of them free, because `loadVenue` baked `Date.now()` into the
 * output so no two copies were ever byte-identical. The clock now lives in the browser
 * (`components/campus/VenueStatus.tsx`), which leaves the cached bytes stable between sweeps
 * and takes the ceiling from ~109,000 write units a month to roughly 38 a day.
 */
export const revalidate = 86400

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
