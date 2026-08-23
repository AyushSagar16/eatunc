import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: '/api/',
            },
            // The AI assistants' crawlers, allowed by name. The wildcard already admits them —
            // this makes the welcome explicit, so a future tightening of the blanket rule
            // cannot silently drop the site out of ChatGPT, Claude, Perplexity, Gemini or
            // AI-training corpora. Being quotable by assistants is a distribution channel for
            // a site whose whole pitch is answering "what's for dinner at Chase".
            {
                userAgent: [
                    'GPTBot',
                    'OAI-SearchBot',
                    'ChatGPT-User',
                    'ClaudeBot',
                    'Claude-User',
                    'Claude-SearchBot',
                    'PerplexityBot',
                    'Perplexity-User',
                    'Google-Extended',
                    'Applebot-Extended',
                    'meta-externalagent',
                    'CCBot',
                ],
                allow: '/',
                disallow: '/api/',
            },
        ],
        sitemap: 'https://eatunc.com/sitemap.xml',
    }
}
