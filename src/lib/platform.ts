/**
 * The iOS half of a user agent string. Exported because `/app` has to make the same call
 * server-side, where there is no `navigator` — only the header — and two copies of this
 * pattern would be two answers to "is this an iPhone" that could drift apart.
 */
export const IOS_UA_PATTERN = /iPhone|iPad|iPod/i

/** True for iPhone, iPad and iPod, including iPadOS 13+, which reports as "Macintosh" in its
 *  user agent and is only distinguishable from real macOS by its touch support. */
export function isIOSDevice(): boolean {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent
    if (IOS_UA_PATTERN.test(ua)) return true
    return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
}
