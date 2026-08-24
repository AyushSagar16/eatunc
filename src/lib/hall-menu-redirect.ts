import { NextResponse, type NextRequest } from 'next/server'

import { getAvailableDates } from '@/lib/api'
import { campusToday } from '@/lib/campus'

/** Resolve a stable hall entry URL to today, or the nearest date for which a menu exists. */
export async function redirectToCurrentHallMenu(request: NextRequest, hall: string) {
    const today = campusToday()
    let target = today

    try {
        const dateData = await getAvailableDates()
        const available = Array.from(new Set((dateData ?? []).map((date) => date.menu_date))).sort()

        if (available.length > 0) {
            target = available.includes(today) ? today : nearest(available, today)
        }
    } catch {
        // A data outage should still land on a real menu page, whose own empty/error state can
        // explain the problem, rather than turning a navigation alias into a 500.
    }

    return NextResponse.redirect(new URL(`/${hall}/${target}`, request.nextUrl.origin), 307)
}

function nearest(dates: string[], today: string): string {
    const todayTime = Date.parse(`${today}T12:00:00Z`)
    return dates.reduce((previous, current) =>
        Math.abs(Date.parse(`${current}T12:00:00Z`) - todayTime) <
        Math.abs(Date.parse(`${previous}T12:00:00Z`) - todayTime)
            ? current
            : previous,
    )
}
