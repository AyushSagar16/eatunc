/** True for iPhone, iPad and iPod, including iPadOS 13+, which reports as "Macintosh" in its
 *  user agent and is only distinguishable from real macOS by its touch support. */
export function isIOSDevice(): boolean {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent
    if (/iPhone|iPad|iPod/.test(ua)) return true
    return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
}

/** True for Safari itself. Chrome, Firefox and Edge all include "Safari" in their user agent
 *  string too (on every platform, not just iOS), so a plain substring test over-matches. */
export function isSafariBrowser(): boolean {
    if (typeof navigator === 'undefined') return false
    return /^((?!chrome|android|crios|fxios|edgios|edg\/).)*safari/i.test(navigator.userAgent)
}

/** True for a real Mac — the mirror image of the iPadOS carve-out in `isIOSDevice`: iPadOS 13+
 *  reports "Macintosh" too, so a Mac is only a Mac once touch support rules out an iPad. */
export function isMacOSDevice(): boolean {
    if (typeof navigator === 'undefined') return false
    return /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints <= 1
}
