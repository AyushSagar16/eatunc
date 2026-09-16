import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { HALL_SLUG_BY_LOCATION_SLUG, isValidIsoDate } from '@/lib/campus'
import { loadVenue, venueMetadata, VenueView } from '../venueView'

/**
 * A venue's menu on a specific date — where the date stepper in the menu header lands.
 *
 * Deliberately not prerendered and deliberately `noindex, follow`, with its canonical pointing
 * back at `/locations/<slug>`. Google had indexed the whole back-catalogue of dated hall URLs
 * and was serving a January menu for an August query; there is no reason to repeat that across
 * 38 more venues. The dates stay reachable, they just do not compete.
 *
 * `revalidate` is currently inert here and is kept as a statement of intent. The segment has no
 * `generateStaticParams`, so Next builds it as `ƒ` and Vercel renders it fresh on every request
 * — production answers `x-vercel-cache: MISS` on three consecutive hits to the same date. That
 * means this route spends Active CPU rather than ISR writes, which is the opposite of the two
 * pages above. Adding `generateStaticParams` returning `[]` would flip it onto ISR; whether
 * that is an improvement depends on which Hobby allowance is scarcer that month, and right now
 * it is the writes. Left dynamic on purpose: the stepper that reaches these URLs is a
 * `router.push` rather than an anchor, so no crawler walks the back-catalogue and the traffic
 * is real people asking for one date.
 */
export const revalidate = 3600

interface PageProps {
    params: Promise<{ slug: string; date: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug, date } = await params
    if (!isValidIsoDate(date) || HALL_SLUG_BY_LOCATION_SLUG[slug]) {
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
    if (!isValidIsoDate(date)) notFound()

    const data = await loadVenue(slug, date)
    if (!data) notFound()

    // Brand and hours-only pages do not change by date; keep one canonical public URL.
    if (!data.primary.has_menu) redirect(`/locations/${slug}`)

    return <VenueView data={data} />
}
