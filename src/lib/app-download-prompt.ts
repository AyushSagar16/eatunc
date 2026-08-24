const LAST_SEEN_KEY = 'eatunc_last_seen_at'
const SESSION_STAMPED_KEY = 'eatunc_app_prompt_session_stamped'

/** How long a visitor can be away before they count as lapsed again. */
const GAP_MS = 5 * 24 * 60 * 60 * 1000

/**
 * Computed once per page load and memoised, then shared by every reader on the page
 * (the popup itself, the top install banner, cookie consent) so they all agree on the
 * same answer for this document's lifetime — the check below stamps `LAST_SEEN_KEY`,
 * so recomputing it would see this visit as "already seen" and flip the answer.
 */
let eligible: boolean | null = null

/**
 * Whether a brand-new visitor, or one who hasn't been back in five-plus days, should see
 * the app download prompt this page load.
 *
 * The stamp only happens once per browser session (the sessionStorage guard), so a user
 * who refreshes mid-visit can't reset their own gap, and a daily visitor keeps pushing
 * their five-day clock forward with every session rather than only the sessions where
 * the prompt actually showed.
 */
export function checkAppDownloadPromptEligible(): boolean {
    if (eligible !== null) return eligible

    try {
        const raw = localStorage.getItem(LAST_SEEN_KEY)
        const last = raw === null ? null : Number(raw)
        const isNewVisitor = raw === null
        const isLapsedVisitor = last !== null && Number.isFinite(last) && Date.now() - last >= GAP_MS

        if (sessionStorage.getItem(SESSION_STAMPED_KEY) === null) {
            sessionStorage.setItem(SESSION_STAMPED_KEY, 'true')
            localStorage.setItem(LAST_SEEN_KEY, String(Date.now()))
        }

        eligible = isNewVisitor || isLapsedVisitor
    } catch {
        // Safari private mode throws on storage access. Stay quiet rather than showing
        // the prompt on every single page load forever.
        eligible = false
    }

    return eligible
}
