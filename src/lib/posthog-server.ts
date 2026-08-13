import { PostHog } from 'posthog-node'

let client: PostHog | null = null

/**
 * Server-side PostHog client, for events that must be counted even when the
 * visitor has not accepted cookies (the browser SDK starts opted out).
 *
 * Events sent through this client are anonymous: geo-IP resolution is disabled
 * and callers are expected to set `$process_person_profile: false`, so no
 * person profile is created and no new personal data is collected.
 *
 * Returns `null` when no PostHog key is configured, so callers can no-op.
 */
export function getPostHogServer(): PostHog | null {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return null

    if (!client) {
        client = new PostHog(key, {
            host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
            // Serverless: send on the request rather than relying on a background timer.
            flushAt: 1,
            flushInterval: 0,
            disableGeoip: true,
        })
    }

    return client
}
