import { MetadataRoute } from 'next'
import { getAvailableDates } from '@/lib/api'
import { campusToday, getLocations, getBrands, shiftDate } from '@/lib/campus'
import { SITE_URL } from '@/lib/seo'
import { supabase } from '@/lib/supabase'

// Without this the sitemap is prerendered once at build time and frozen. The previous build
// shipped 480 URLs all stamped with one build-time <lastmod>, and kept re-submitting January
// menus through August.
export const revalidate = 3600

/** Menu pages are only worth crawling around the present; see the window note below. */
const PAST_DAYS = 7
const FUTURE_DAYS = 14

/**
 * When the nightly sweep last confirmed this data.
 *
 * `menus` has no updated_at, but `location_hours.last_scraped_at` moves on every run of the
 * 05:00 UTC job, so the newest value is an honest "the site's data is current as of" stamp.
 * A fabricated `new Date()` on every URL — which is what shipped before — is worse than no
 * lastmod at all, because Google learns to distrust the whole file.
 */
async function lastSweptAt(): Promise<Date | undefined> {
    try {
        const { data } = await supabase
            .from('location_hours')
            .select('last_scraped_at')
            .order('last_scraped_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        return data?.last_scraped_at ? new Date(data.last_scraped_at) : undefined
    } catch {
        return undefined
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const today = campusToday()
    const sweptAt = await lastSweptAt()

    const staticRoutes: MetadataRoute.Sitemap = [
        { path: '', priority: 1.0, changeFrequency: 'daily' as const },
        { path: '/chase-menu', priority: 0.9, changeFrequency: 'daily' as const },
        { path: '/lenoir-menu', priority: 0.9, changeFrequency: 'daily' as const },
        { path: '/open-now', priority: 0.9, changeFrequency: 'hourly' as const },
        { path: '/hours', priority: 0.9, changeFrequency: 'daily' as const },
        { path: '/locations', priority: 0.9, changeFrequency: 'weekly' as const },
        { path: '/today', priority: 0.8, changeFrequency: 'daily' as const },
        { path: '/faq', priority: 0.7, changeFrequency: 'weekly' as const },
        { path: '/brands', priority: 0.7, changeFrequency: 'weekly' as const },
        { path: '/unc-dining-app', priority: 0.6, changeFrequency: 'monthly' as const },
        { path: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
        { path: '/feedback', priority: 0.4, changeFrequency: 'monthly' as const },
        { path: '/legal', priority: 0.3, changeFrequency: 'yearly' as const },
        { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
        // The App Store requires the iOS policy to stay reachable at a stable URL.
        { path: '/privacy/ios', priority: 0.3, changeFrequency: 'yearly' as const },
    ].map((route) => ({
        url: `${SITE_URL}${route.path}`,
        lastModified: sweptAt,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }))

    const [dateRoutes, venueRoutes, brandRoutes] = await Promise.all([
        menuDateRoutes(today, sweptAt),
        venueRoutesFor(sweptAt),
        brandRoutesFor(sweptAt),
    ])

    return [...staticRoutes, ...dateRoutes, ...venueRoutes, ...brandRoutes]
}

/**
 * Menu pages within a window around today.
 *
 * Every stored date used to be listed — 236 of them, 229 in the past. Google duly indexed the
 * January pages and started serving `/lenoir/2026-01-08` for "lenoir dining hall menu" in
 * August, spending ~2,300 impressions a quarter on menus nobody can eat. Past dates stay
 * reachable and keep their own canonical; they simply stop being advertised, and
 * `generateMetadata` marks anything older than the window `noindex`.
 */
async function menuDateRoutes(today: string, sweptAt?: Date): Promise<MetadataRoute.Sitemap> {
    try {
        const dates = Array.from(new Set((await getAvailableDates()).map((d) => d.menu_date)))
        const from = shiftDate(today, -PAST_DAYS)
        const to = shiftDate(today, FUTURE_DAYS)

        return dates
            .filter((date) => date >= from && date <= to)
            .flatMap((date) =>
                ['chase', 'lenoir'].map((hall) => ({
                    url: `${SITE_URL}/${hall}/${date}`,
                    lastModified: sweptAt,
                    changeFrequency: 'daily' as const,
                    priority: date === today ? 0.9 : date > today ? 0.7 : 0.4,
                })),
            )
    } catch (error) {
        console.error('[sitemap] menu dates unavailable:', error)
        return []
    }
}

async function venueRoutesFor(sweptAt?: Date): Promise<MetadataRoute.Sitemap> {
    try {
        const locations = await getLocations()
        // Four slugs are shared by two buildings apiece, and both render on one page.
        const slugs = Array.from(new Set(locations.map((l) => l.slug)))
        return slugs
            .filter((slug) => slug !== 'chase' && slug !== 'top-of-lenoir')
            .map((slug) => ({
                url: `${SITE_URL}/locations/${slug}`,
                lastModified: sweptAt,
                changeFrequency: 'daily' as const,
                priority: 0.7,
            }))
    } catch (error) {
        console.error('[sitemap] locations unavailable:', error)
        return []
    }
}

async function brandRoutesFor(sweptAt?: Date): Promise<MetadataRoute.Sitemap> {
    try {
        const brands = await getBrands()
        return brands.map((brand) => ({
            url: `${SITE_URL}/brands/${brand.slug}`,
            lastModified: brand.updated_at ? new Date(brand.updated_at) : sweptAt,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }))
    } catch (error) {
        console.error('[sitemap] brands unavailable:', error)
        return []
    }
}
