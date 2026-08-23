/**
 * The frame every menu page sits in — the two halls and every campus venue.
 *
 * A `<div>` and not a `<main>`: `FoodDisplayLayout` renders its own `<main>` around the food
 * grid, so a `<main>` here would nest one landmark inside another. The hall page still has that
 * bug; this shell must not carry it into the venue pages.
 *
 * No `overflow-hidden` either. An ancestor with `overflow: hidden` becomes the scroll container
 * a `position: sticky` descendant sticks inside, and that container never scrolls — it is what
 * would unpin `FoodDisplayLayout`'s sticky header. The glow cannot overflow horizontally on its
 * own (`w-full max-w-4xl` centred is never wider than the viewport), so nothing needs clipping.
 */
export default function MenuPageShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-transparent relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-500/10 blur-[120px] pointer-events-none -z-10 dark:bg-blue-600/5" />
            {children}
        </div>
    )
}
