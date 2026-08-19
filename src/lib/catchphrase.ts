/**
 * The line under the wordmark on the homepage.
 *
 * Ported from the iOS app's `Catchphrase.swift`, including its reasoning: the phrases are short
 * (two to four words) because this sits above the thing people actually came for, and they are
 * all meal-neutral. "Let's find lunch" tested well in the app and was cut — a phrase that names
 * a meal is wrong at every other hour of the day, and this is picked at random rather than from
 * the clock. Nothing here claims to know what time it is or what is open; the cards underneath
 * do that.
 */
export const CATCHPHRASES = [
    'What are you craving?',
    "See what's cooking.",
    'Feeling hungry?',
    "What's good today?",
    'What sounds good?',
    'Time to eat.',
    'Pick your spot.',
    "Let's find something.",
] as const

export type Catchphrase = (typeof CATCHPHRASES)[number]

/**
 * Picked on the server, once per request, and passed down as a prop.
 *
 * Deliberately not picked in the browser. Choosing on the client means either rendering a
 * placeholder and swapping it after hydration — a visible flash on the largest text on the page,
 * and a layout shift that Core Web Vitals counts — or a hydration mismatch, which React resolves
 * by throwing the server's HTML away. The page is already `force-dynamic`, so the server draws a
 * new phrase on every load anyway, which is exactly the behaviour the app has.
 *
 * The app additionally refuses to repeat the previous phrase, because a repeat is the one outcome
 * that makes a random line look broken rather than varied. It can do that because it has a device
 * to remember on; a stateless server request has nothing to compare against, so this is a plain
 * uniform pick and roughly one load in eight repeats.
 */
export function pickCatchphrase(): Catchphrase {
    return CATCHPHRASES[Math.floor(Math.random() * CATCHPHRASES.length)]
}
