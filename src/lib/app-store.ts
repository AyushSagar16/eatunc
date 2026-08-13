/**
 * Single source of truth for the Eat UNC iOS app.
 *
 * Nothing should hardcode the App Store URL directly — link to `/app` instead,
 * so every click passes through the tracked redirect in `src/app/app/page.tsx`.
 */
export const APP_STORE_URL = 'https://apps.apple.com/us/app/eat-unc/id6798923281'

/** Apple's numeric ID for the app, used by the Smart App Banner meta tag. */
export const APP_STORE_ID = '6798923281'

/**
 * Build an internal link to the tracked redirect.
 *
 * @param source Where the click came from, recorded as `source` on the
 *               `app_store_redirect` event in PostHog (e.g. 'banner', 'footer').
 */
export function appLink(source: string): string {
    return `/app?src=${encodeURIComponent(source)}`
}
