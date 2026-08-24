/**
 * Small shared wrappers over Web Storage.
 *
 * Every caller here has the same two needs: do a thing at most once per browsing session,
 * and survive Safari private mode, where touching storage throws outright. Both were being
 * re-cut per component, comment and all.
 */

/**
 * Claims a one-per-session flag: `true` the first time it is called with a given key in a
 * browsing session, `false` on every later call (including after a reload, since sessionStorage
 * outlives the document).
 *
 * Throws if storage is unavailable — callers decide what an unknown answer should mean for
 * their own surface, which is not the same decision every time.
 */
export function claimSessionFlag(key: string): boolean {
    if (sessionStorage.getItem(key) !== null) return false
    sessionStorage.setItem(key, 'true')
    return true
}

/** Reads a stored number, or `null` when it is absent or not a finite number. */
export function readStoredNumber(key: string): number | null {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
}
