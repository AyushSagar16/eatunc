import { MetadataRoute } from 'next'
import { getAvailableDates } from '@/lib/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://eatunc.com'

    // Static routes - only include actual static pages
    // Note: /chase and /lenoir are NOT included because they redirect to /chase/{date} and /lenoir/{date}
    const routes = [
        { path: '', priority: 1.0, changeFrequency: 'daily' as const },
        // SEO landing pages for dining hall queries
        { path: '/chase-menu', priority: 0.9, changeFrequency: 'daily' as const },
        { path: '/lenoir-menu', priority: 0.9, changeFrequency: 'daily' as const },
        { path: '/today', priority: 0.8, changeFrequency: 'daily' as const },
        { path: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
        { path: '/feedback', priority: 0.5, changeFrequency: 'monthly' as const },
        { path: '/legal', priority: 0.3, changeFrequency: 'yearly' as const },
        // App Store requires the iOS policy to live at a stable, reachable URL.
        { path: '/privacy/ios', priority: 0.3, changeFrequency: 'yearly' as const },
    ].map((route) => ({
        url: `${baseUrl}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }))

    // Dynamic routes for dates
    let hallRoutes: MetadataRoute.Sitemap = []
    try {
        const availableDatesData = await getAvailableDates()
        const uniqueDates = Array.from(new Set(availableDatesData.map(d => d.menu_date)))

        // Get today's date for priority calculation
        const today = new Date().toISOString().split('T')[0]

        hallRoutes = uniqueDates.flatMap(date => {
            // Today and future dates get higher priority
            const isCurrentOrFuture = date >= today
            const priority = isCurrentOrFuture ? 0.8 : 0.4

            return [
                {
                    url: `${baseUrl}/chase/${date}`,
                    lastModified: new Date(),
                    changeFrequency: 'daily' as const,
                    priority,
                },
                {
                    url: `${baseUrl}/lenoir/${date}`,
                    lastModified: new Date(),
                    changeFrequency: 'daily' as const,
                    priority,
                }
            ]
        })
    } catch (error) {
        console.error('Error fetching dates for sitemap:', error)
    }

    return [...routes, ...hallRoutes]
}
