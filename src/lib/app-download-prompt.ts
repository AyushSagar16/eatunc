import { claimSessionFlag, readStoredNumber } from './browser-storage'

const LAST_SEEN_KEY = 'eatunc_last_seen_at'
const SESSION_STAMPED_KEY = 'eatunc_app_prompt_session_stamped'

/** How long a visitor can be away before they count as lapsed again. */
const GAP_MS = 5 * 24 * 60 * 60 * 1000

/**
 * Decided once by `stampVisit`, then read by every surface on the page (the popup itself, the
 * top install banner, cookie consent) so they all agree for this document's lifetime. It has to
 * be frozen rather than recomputed: stamping is what makes a visit "seen", so a second
 * computation would find this very visit already recorded and flip the answer.
 */
let eligible = false

/** Guards `stampVisit` so only the first call this page load touches storage. */
let stamped = false

/**
 * Records this visit and freezes the answer to "should the app download prompt show?".
 *
 * Called once per page load from `OnboardingProvider`, above every reader, so that
 * `isAppDownloadPromptEligible` below is a plain read with no hidden write behind it. Extra
 * calls are no-ops.
 *
 * The `LAST_SEEN_KEY` stamp itself only moves once per browser session, so a user who refreshes
 * mid-visit can't reset their own gap, and a daily visitor keeps pushing their five-day clock
 * forward every session rather than only the sessions where the prompt actually showed.
 */
export function stampVisit(): void {
    if (stamped) return
    stamped = true

    try {
        const last = readStoredNumber(LAST_SEEN_KEY)
        const isNewVisitor = localStorage.getItem(LAST_SEEN_KEY) === null
        const isLapsedVisitor = last !== null && Date.now() - last >= GAP_MS

        if (claimSessionFlag(SESSION_STAMPED_KEY)) {
            localStorage.setItem(LAST_SEEN_KEY, String(Date.now()))
        }

        eligible = isNewVisitor || isLapsedVisitor
    } catch {
        // Safari private mode throws on storage access, which leaves no way to tell a first
        // visit from a hundredth. Stay quiet rather than showing the prompt on every page load
        // forever — an unpromptable minority beats an unshakeable popup.
        eligible = false
    }
}

/**
 * Whether a brand-new visitor, or one who hasn't been back in five-plus days, should see the
 * app download prompt this page load. A pure read of what `stampVisit` already decided; `false`
 * before it runs, which is also the correct server-render answer.
 */
export function isAppDownloadPromptEligible(): boolean {
    return eligible
}
