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

/** Same UA test `MenuTutorial` uses client-side; here there is no `navigator`, only the header. */
const IOS_USER_AGENT = /iPhone|iPad|iPod/i

/**
 * A real Mac, or an iPad in desktop-site mode reporting as one — the header alone can't tell
 * those apart (that distinction needs `navigator.maxTouchPoints`, client-side only). Both are
 * Apple hardware, so both get the "open this on your iPhone" page rather than the Android one.
 */
const MAC_USER_AGENT = /Macintosh/i

/**
 * eatunc.com/app -> the App Store on iOS, or a "not yet" page everywhere else, counting the
 * click on the way through either way.
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
    // The one link everyone gets — the branch below is what makes it "dynamic": the same
    // eatunc.com/app URL resolves differently per visitor instead of needing an iOS link and
    // a separate Android one.
    const isIOS = IOS_USER_AGENT.test(userAgent)
    const isMac = !isIOS && MAC_USER_AGENT.test(userAgent)

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
                        destination: isIOS ? 'app_store' : isMac ? 'mac_open_on_iphone' : 'android_coming_soon',
                    },
                })
            } catch (error) {
                console.error('[PostHog] Failed to record app_store_redirect:', error)
            }
        })
    }

    if (servePreview) {
        return new NextResponse(previewHtml(origin, isIOS), {
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

    if (isMac) {
        // A MacBook can't install an iPhone app either, but its owner very likely has an
        // iPhone nearby — worth pointing them at it instead of lumping them in with Android.
        return new NextResponse(openOnIPhoneHtml(origin), {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'X-Robots-Tag': 'noindex',
                'Cache-Control': 'no-store',
            },
        })
    }

    if (!isIOS) {
        // Android and everyone else: no app to send them to yet, so don't send them to
        // Apple's store for one. A real page, not a redirect — there is nowhere better to go.
        return new NextResponse(comingSoonHtml(origin), {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'X-Robots-Tag': 'noindex',
                'Cache-Control': 'no-store',
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
 * the App Store — or the Android page — rather than dead-ending here. The UA that decided
 * `servePreview` is the same one behind `isIOS`, so a misclassified real visitor still lands
 * in the right place even though this markup is shared with actual crawlers.
 */
function previewHtml(origin: string, isIOS: boolean): string {
    const image = `${origin}/app/opengraph-image`
    const destination = isIOS ? APP_STORE_URL : `${origin}/`
    const cta = isIOS ? 'Open in the App Store' : 'Continue to eatunc.com'

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
<a id="store" href="${destination}" style="display:inline-block;padding:.75rem 1.5rem;border-radius:999px;background:#4B9CD3;color:#fff;font-weight:700;text-decoration:none">${cta}</a>
</main>
<!-- The destination is read back off the link rather than interpolated into
     this script, so no value is ever injected into a script sink. replace()
     rather than assign() keeps the back button working. -->
<script>window.location.replace(document.getElementById('store').href)</script>
</body>
</html>`
}

/**
 * What a Mac visitor to eatunc.com/app sees instead of Apple's App Store.
 *
 * A desktop browser can't install an iPhone app no matter where it's pointed, so redirecting
 * to Apple's listing would just strand them on a page with no working "Get" button. The App
 * Store link is still offered, underneath, for anyone who wants to preview the listing anyway.
 */
function openOnIPhoneHtml(origin: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Open this on your iPhone — Eat UNC</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="https://eatunc.com/app">
</head>
<body style="margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#13294B;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;padding:1.5rem;box-sizing:border-box">
<main style="max-width:26rem">
<h1 style="font-size:1.5rem;margin:0 0 .75rem">Grab your phone</h1>
<p style="margin:0 0 1.5rem;color:#c9d9ea;line-height:1.5">Eat UNC is an iPhone app, and this is a Mac. Open eatunc.com/app on your iPhone to install it, or keep using the full site right here.</p>
<a href="${origin}/" style="display:inline-block;padding:.75rem 1.5rem;border-radius:999px;background:#4B9CD3;color:#fff;font-weight:700;text-decoration:none">Continue to eatunc.com</a>
<p style="margin:1.25rem 0 0"><a href="${APP_STORE_URL}" style="color:#8fb8de;font-size:.875rem;text-decoration:underline">View the listing on the App Store</a></p>
</main>
</body>
</html>`
}

/**
 * What a non-iOS visitor to eatunc.com/app sees instead of Apple's App Store.
 *
 * There is no Android build yet, so redirecting there would either 404 or point at the iPhone
 * listing — worse than telling them plainly and sending them back to the site that already has
 * everything the app does.
 */
function comingSoonHtml(origin: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Android app isn't out yet — Eat UNC</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="https://eatunc.com/app">
</head>
<body style="margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#13294B;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;padding:1.5rem;box-sizing:border-box">
<main style="max-width:26rem">
<h1 style="font-size:1.5rem;margin:0 0 .75rem">The Android app is being built</h1>
<p style="margin:0 0 1.5rem;color:#c9d9ea;line-height:1.5">Eat UNC is iPhone-only for now. In the meantime, the website has the same menus, nutrition facts and filters — just open it in your browser.</p>
<a href="${origin}/" style="display:inline-block;padding:.75rem 1.5rem;border-radius:999px;background:#4B9CD3;color:#fff;font-weight:700;text-decoration:none">Continue to eatunc.com</a>
</main>
</body>
</html>`
}
