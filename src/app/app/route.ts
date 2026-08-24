import { NextResponse, after, type NextRequest } from 'next/server'
import { APP_STORE_URL } from '@/lib/app-store'
import { IOS_UA_PATTERN } from '@/lib/platform'
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
 * A real Mac, or an iPad in desktop-site mode reporting as one — the header alone can't tell
 * those apart (that distinction needs `navigator.maxTouchPoints`, client-side only). Both are
 * Apple hardware, so both get the "open this on your iPhone" page rather than the Android one.
 */
const MAC_USER_AGENT = /Macintosh/i

/**
 * Set on the link inside the preview HTML so that a real browser mistaken for a crawler comes
 * back here and gets the page its device actually warrants, rather than being bounced somewhere
 * generic. It is what lets the preview markup name the same destination the redirect would have
 * chosen without knowing which of the three that is.
 */
const FORCE_PAGE_PARAM = 'view'
const FORCE_PAGE_VALUE = 'page'

/**
 * How long each dead-end page waits before continuing to the site on its own, counted as
 * foreground time only — the same way `AppDownloadPrompt` counts its five seconds.
 *
 * Neither visitor can install anything here, so both pages are notices rather than
 * destinations, and making someone click past a notice they have already read is a toll for
 * nothing. Android waits a beat less because its page has nothing else on it: the Mac page
 * offers the App Store listing underneath, which is worth a moment to notice.
 */
const MAC_REDIRECT_MS = 5000
const ANDROID_REDIRECT_MS = 4000

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
    const isIOS = IOS_UA_PATTERN.test(userAgent)
    const isMac = !isIOS && MAC_USER_AGENT.test(userAgent)

    // Every current browser sends `Sec-Fetch-Dest: document` when navigating;
    // preview fetchers send no Sec-Fetch headers at all. This catches crawlers
    // missing from the list above — notably iMessage, which does not always
    // identify itself as Applebot. Misfiring is harmless: the preview HTML
    // redirects on its own, so a browser that lands on it still reaches Apple.
    const isBrowserNavigation = request.headers.get('sec-fetch-dest') === 'document'
    // A second visit sent here by the preview page's own link: it has already been counted and
    // has already proven it is a browser, so neither the preview nor the analytics apply again.
    const isPreviewFollowThrough = searchParams.get(FORCE_PAGE_PARAM) === FORCE_PAGE_VALUE
    const servePreview = !isPreviewFollowThrough && (isKnownBot || !isBrowserNavigation)

    const posthog = getPostHogServer()
    if (posthog && !isKnownBot && !isPreviewFollowThrough) {
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
        // Previews are cacheable; the pages below are not, because which one a visitor gets
        // depends on their user agent.
        return htmlResponse(previewHtml(origin, isIOS), 'public, max-age=300')
    }

    if (isMac) {
        // A MacBook can't install an iPhone app either, but its owner very likely has an
        // iPhone nearby — worth pointing them at it instead of lumping them in with Android.
        return htmlResponse(openOnIPhoneHtml(origin), 'no-store')
    }

    if (!isIOS) {
        // Android and everyone else: no app to send them to yet, so don't send them to
        // Apple's store for one. A real page, not a redirect — there is nowhere better to go.
        return htmlResponse(comingSoonHtml(origin), 'no-store')
    }

    return NextResponse.redirect(APP_STORE_URL, {
        status: 307,
        headers: {
            'X-Robots-Tag': 'noindex',
            'Cache-Control': 'no-store',
        },
    })
}

/** Every response from this route is HTML that must stay out of search results. */
function htmlResponse(html: string, cacheControl: string): NextResponse {
    return new NextResponse(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Robots-Tag': 'noindex',
            'Cache-Control': cacheControl,
        },
    })
}

interface PageOptions {
    /** Absolute origin, so the logo resolves for a crawler rendering this markup off-site. */
    origin: string
    title: string
    heading: string
    /** Extra `<head>` markup — the preview page's Open Graph block, and nothing else so far. */
    head?: string
    /** Omitted by the preview page, which is a card first and a page only if someone lands on it. */
    body?: string
    cta: { href: string; label: string; id?: string }
    /** Markup after the call to action: a secondary link, or the preview page's redirect script. */
    footer?: string
}

/**
 * The one document all three responses here are cut from — same Carolina-navy centered card,
 * same typography, same `<head>` boilerplate. Only the words and the destination differ.
 */
function htmlPage({ origin, title, heading, head = '', body, cta, footer = '' }: PageOptions): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="https://eatunc.com/app">${head}
</head>
<body style="margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#13294B;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;padding:1.5rem;box-sizing:border-box">
<main style="max-width:26rem">
<img src="${origin}/eat_unc_wordmark_white.png" alt="Eat UNC" width="837" height="221" style="display:block;width:9.5rem;height:auto;margin:0 auto 1.75rem">
<h1 style="font-size:1.5rem;margin:0 0 ${body ? '.75rem' : '1rem'}">${heading}</h1>
${body ? `<p style="margin:0 0 1.5rem;color:#c9d9ea;line-height:1.5">${body}</p>` : ''}
<a${cta.id ? ` id="${cta.id}"` : ''} href="${cta.href}" style="display:inline-block;padding:.75rem 1.5rem;border-radius:999px;background:#4B9CD3;color:#fff;font-weight:700;text-decoration:none">${cta.label}</a>
${footer}</main>
</body>
</html>`
}

/**
 * The card a shared eatunc.com/app link renders as.
 *
 * `twitter:card` is `summary`, not `summary_large_image`, and the image is
 * square — together those give the compact thumbnail card rather than a
 * full-width banner.
 *
 * It also redirects, so a real browser misclassified as a bot doesn't dead-end here. Its link
 * resolves to the same destination the redirect path would have picked for that visitor: the
 * App Store on iOS, and otherwise this route again with the preview check off, which then picks
 * between the Mac and Android pages using the same user agent. That second hop exists because
 * those two can only be told apart on a request that isn't being served preview markup.
 */
function previewHtml(origin: string, isIOS: boolean): string {
    const image = `${origin}/app/opengraph-image`
    // Not the homepage: a non-iOS visitor who lands here is owed the same Mac or Android page
    // the redirect path would have given them, so the link points back at this route with the
    // preview check switched off. Only iOS can be resolved to a final destination from here,
    // because only iOS has one that isn't device-dependent.
    const destination = isIOS
        ? APP_STORE_URL
        : `${origin}/app?${FORCE_PAGE_PARAM}=${FORCE_PAGE_VALUE}`
    const cta = isIOS ? 'Open in the App Store' : 'Continue'

    return htmlPage({
        origin,
        title: TITLE,
        heading: TITLE,
        head: `
<meta name="description" content="${DESCRIPTION}">
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
<meta name="apple-itunes-app" content="app-id=6798923281">`,
        cta: { href: destination, label: cta, id: 'store' },
        // The destination is read back off the link rather than interpolated into this script,
        // so no value is ever injected into a script sink. replace() rather than assign() keeps
        // the back button working.
        footer: `<script>window.location.replace(document.getElementById('store').href)</script>
`,
    })
}

/**
 * What a Mac visitor to eatunc.com/app sees instead of Apple's App Store.
 *
 * A desktop browser can't install an iPhone app no matter where it's pointed, so redirecting
 * to Apple's listing would just strand them on a page with no working "Get" button. The App
 * Store link is still offered, underneath, for anyone who wants to preview the listing anyway.
 */
function openOnIPhoneHtml(origin: string): string {
    return htmlPage({
        origin,
        title: 'Open this on your iPhone — Eat UNC',
        heading: 'Grab your phone',
        body: 'Eat UNC is an iPhone app, and this is a Mac. Open eatunc.com/app on your iPhone to install it, or keep using the full site right here.',
        cta: { href: `${origin}/`, label: 'Continue to eatunc.com', id: 'continue' },
        footer: `<p style="margin:1.25rem 0 0"><a href="${APP_STORE_URL}" style="color:#8fb8de;font-size:.875rem;text-decoration:underline">View the listing on the App Store</a></p>
${countdown(MAC_REDIRECT_MS)}`,
    })
}

/** The visible count plus the script that drives it, for a page whose CTA carries `id="continue"`. */
function countdown(durationMs: number): string {
    return `<p id="countdown" hidden style="margin:1.25rem 0 0;color:#8fb8de;font-size:.8125rem">Continuing in <span id="count">${durationMs / 1000}</span>s</p>
${countdownScript(durationMs)}`
}

/**
 * The countdown behind a dead-end page's automatic continue.
 *
 * Three things it deliberately does. It measures foreground time, not wall clock: the browser
 * stops firing `requestAnimationFrame` in a hidden tab, so a page opened in a background tab is
 * still sitting there whenever it is finally looked at. It cancels outright on the first click,
 * tap or keypress, because someone reaching for a link on the page must not have it navigate
 * out from under their cursor. And it starts hidden and is revealed by this script, so a
 * visitor without JavaScript is never promised a redirect that cannot happen.
 *
 * The destination is read back off the link rather than interpolated in, so no value is ever
 * injected into a script sink — the same rule the preview page's redirect follows.
 */
function countdownScript(durationMs: number): string {
    return `<script>
(function () {
  var link = document.getElementById('continue')
  var label = document.getElementById('countdown')
  var out = document.getElementById('count')
  if (!link || !label || !out || !window.requestAnimationFrame) return

  var remaining = ${durationMs}
  var last = null
  var cancelled = false
  label.hidden = false

  function cancel() {
    cancelled = true
    label.hidden = true
  }
  document.addEventListener('pointerdown', cancel, { once: true })
  document.addEventListener('keydown', cancel, { once: true })
  // rAF does not run while hidden, so time away is never counted; the stale timestamp it
  // leaves behind is what this drops.
  document.addEventListener('visibilitychange', function () { last = null })

  function tick(now) {
    if (cancelled) return
    if (last !== null) remaining -= now - last
    last = now
    if (remaining <= 0) {
      window.location.replace(link.href)
      return
    }
    out.textContent = Math.ceil(remaining / 1000)
    window.requestAnimationFrame(tick)
  }
  window.requestAnimationFrame(tick)
})()
</script>
`
}

/**
 * What a non-iOS visitor to eatunc.com/app sees instead of Apple's App Store.
 *
 * There is no Android build yet, so redirecting there would either 404 or point at the iPhone
 * listing — worse than telling them plainly and sending them back to the site that already has
 * everything the app does.
 */
function comingSoonHtml(origin: string): string {
    return htmlPage({
        origin,
        title: "The Android app isn't out yet — Eat UNC",
        heading: 'The Android app is being built',
        body: 'Eat UNC is iPhone-only for now. In the meantime, the website has the same menus, nutrition facts and filters — just open it in your browser.',
        cta: { href: `${origin}/`, label: 'Continue to eatunc.com', id: 'continue' },
        footer: countdown(ANDROID_REDIRECT_MS),
    })
}
