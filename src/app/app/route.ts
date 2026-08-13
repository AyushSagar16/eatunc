import { NextResponse, after, type NextRequest } from 'next/server'
import { APP_STORE_URL } from '@/lib/app-store'
import { getPostHogServer } from '@/lib/posthog-server'

// Every hit must be counted, so this can never be cached.
export const dynamic = 'force-dynamic'

/**
 * Crawlers that fetch a URL to build a link preview.
 *
 * These get HTML with Open Graph tags instead of the redirect. Without this they
 * would follow the 307 to Apple and render Apple's App Store card, so a shared
 * eatunc.com/app link would not look like ours.
 */
const PREVIEW_BOTS =
    /facebookexternalhit|facebot|twitterbot|slackbot|slack-imgproxy|discordbot|whatsapp|telegrambot|linkedinbot|applebot|redditbot|pinterest|skypeuripreview|iframely|embedly|vkshare|quora link preview|bitlybot|tumblr|flipboard|mastodon|bluesky|cardyb|groupme|googlebot|bingbot|duckduckbot|yandexbot|baiduspider|signal|snapchat|threads|nuzzel|outbrain|showyoubot|w3c_validator/i

const TITLE = 'Download the Eat UNC app today'
const DESCRIPTION =
    'UNC dining menus, filters, and nutrition facts for Chase and Top of Lenoir — free on iPhone.'

/**
 * eatunc.com/app -> the App Store, counting the click on the way through.
 *
 * This is a route handler rather than a page because a page that calls
 * `redirect()` after an await streams a soft, client-side redirect (HTTP 200)
 * instead of a real one. A route handler returns a true 307 with no HTML.
 *
 * The count is captured server-side rather than with posthog-js because the
 * browser SDK starts opted out until cookie consent, which would undercount,
 * and because there is no page here for a client event to fire from.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = request.nextUrl
    const source = searchParams.get('src') ?? 'direct'
    const userAgent = request.headers.get('user-agent') ?? ''
    const isKnownBot = PREVIEW_BOTS.test(userAgent)

    // Every current browser sends `Sec-Fetch-Dest: document` when navigating;
    // preview fetchers send no Sec-Fetch headers at all. This catches crawlers
    // missing from the list above — notably iMessage, which does not always
    // identify itself as Applebot. Misfiring is harmless: the preview HTML
    // redirects on its own, so a browser that lands on it still reaches Apple.
    const isBrowserNavigation = request.headers.get('sec-fetch-dest') === 'document'
    const servePreview = isKnownBot || !isBrowserNavigation

    const posthog = getPostHogServer()
    if (posthog && !isKnownBot) {
        // Recorded after the response is sent, so analytics never adds latency
        // between the tap and the App Store.
        after(async () => {
            try {
                await posthog.captureImmediate({
                    // Anonymous event: a throwaway ID paired with a disabled person
                    // profile, so this counts visits without tracking individuals.
                    distinctId: crypto.randomUUID(),
                    event: 'app_store_redirect',
                    properties: {
                        $process_person_profile: false,
                        source,
                        referrer: request.headers.get('referer') ?? '$direct',
                        $current_url: 'https://eatunc.com/app',
                        // Pass campaign params through so links can be attributed.
                        utm_source: searchParams.get('utm_source') ?? undefined,
                        utm_medium: searchParams.get('utm_medium') ?? undefined,
                        utm_campaign: searchParams.get('utm_campaign') ?? undefined,
                    },
                })
            } catch (error) {
                console.error('[PostHog] Failed to record app_store_redirect:', error)
            }
        })
    }

    if (servePreview) {
        return new NextResponse(previewHtml(origin), {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                // Previews are unaffected by this; it only keeps a redirect hop
                // out of search results.
                'X-Robots-Tag': 'noindex',
                'Cache-Control': 'public, max-age=300',
            },
        })
    }

    return NextResponse.redirect(APP_STORE_URL, {
        status: 307,
        headers: {
            'X-Robots-Tag': 'noindex',
            'Cache-Control': 'no-store',
        },
    })
}

/**
 * The card a shared eatunc.com/app link renders as.
 *
 * `twitter:card` is `summary`, not `summary_large_image`, and the image is
 * square — together those give the compact thumbnail card rather than a
 * full-width banner.
 *
 * It also redirects, so that a real browser misclassified as a bot still reaches
 * the App Store rather than dead-ending here.
 */
function previewHtml(origin: string): string {
    const image = `${origin}/app/opengraph-image`

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${TITLE}</title>
<meta name="description" content="${DESCRIPTION}">
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Eat UNC">
<meta property="og:url" content="https://eatunc.com/app">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${DESCRIPTION}">
<meta property="og:image" content="${image}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="800">
<meta property="og:image:height" content="800">
<meta property="og:image:alt" content="Eat UNC — now on iPhone">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${TITLE}">
<meta name="twitter:description" content="${DESCRIPTION}">
<meta name="twitter:image" content="${image}">
<meta name="apple-itunes-app" content="app-id=6798923281">
<link rel="canonical" href="https://eatunc.com/app">
</head>
<body style="margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#13294B;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center">
<main>
<h1 style="font-size:1.5rem;margin:0 0 1rem">${TITLE}</h1>
<a id="store" href="${APP_STORE_URL}" style="display:inline-block;padding:.75rem 1.5rem;border-radius:999px;background:#4B9CD3;color:#fff;font-weight:700;text-decoration:none">Open in the App Store</a>
</main>
<!-- The destination is read back off the link rather than interpolated into
     this script, so no value is ever injected into a script sink. replace()
     rather than assign() keeps the back button working. -->
<script>window.location.replace(document.getElementById('store').href)</script>
</body>
</html>`
}
