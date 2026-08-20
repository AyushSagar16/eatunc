import { NextResponse, type NextRequest } from 'next/server'
import { getAvailableDates } from '@/lib/api'
import { campusToday } from '@/lib/campus'

// The redirect target depends on which dates currently have a menu, so it cannot be cached.
export const dynamic = 'force-dynamic'

const HALL_SLUGS = new Set(['chase', 'lenoir'])

/**
 * /chase -> /chase/<today, or the nearest date that has a menu>.
 *
 * This is a route handler rather than a page for the same reason `/app` is: a page that calls
 * `redirect()` after an await streams a soft client-side redirect inside an HTTP 200 body.
 * Verified against production — `/chase` answered 200 with `NEXT_REDIRECT` in the markup and
 * `curl -L` followed zero hops, so Google saw a thin 200 page that self-canonicalised to the
 * homepage instead of a redirect to the menu.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ hall: string }> }) {
    const { hall } = await context.params

    if (!HALL_SLUGS.has(hall)) {
        return new NextResponse('Not Found', { status: 404 })
    }

    const today = campusToday()
    let target = today

    try {
        const dateData = await getAvailableDates()
        const available = Array.from(
            new Set((dateData ?? []).map((d) => d.menu_date)),
        ).sort()

        // `getAvailableDates` spans both halls, so a hall closed for a break can resolve to a
        // date only the other hall serves. That is fine: the menu page explains the closure and
        // offers the next open date, which is a better answer than a bare 404.
        if (available.length > 0) {
            target = available.includes(today) ? today : nearest(available, today)
        }
    } catch {
        // A Supabase outage should still land the visitor on a real menu URL rather than a 500.
    }

    return NextResponse.redirect(new URL(`/${hall}/${target}`, request.nextUrl.origin), 307)
}

function nearest(dates: string[], today: string): string {
    const todayTime = Date.parse(`${today}T12:00:00Z`)
    return dates.reduce((prev, curr) =>
        Math.abs(Date.parse(`${curr}T12:00:00Z`) - todayTime) <
        Math.abs(Date.parse(`${prev}T12:00:00Z`) - todayTime)
            ? curr
            : prev,
    )
}
