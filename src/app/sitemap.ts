import { MetadataRoute } from 'next'
import { getAvailableDates } from '@/lib/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://eatunc.com'

    // Static routes
    const routes = [
        '',
        '/about',
        '/legal',
        '/chase',
        '/lenoir',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // Dynamic routes for dates
    let hallRoutes: MetadataRoute.Sitemap = []
    try {
        const availableDatesData = await getAvailableDates()
        const uniqueDates = Array.from(new Set(availableDatesData.map(d => d.menu_date)))

        hallRoutes = uniqueDates.flatMap(date => [
            {
                url: `${baseUrl}/chase/${date}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.5,
            },
            {
                url: `${baseUrl}/lenoir/${date}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.5,
            }
        ])
    } catch (error) {
        console.error('Error fetching dates for sitemap:', error)
    }

    return [...routes, ...hallRoutes]
}
