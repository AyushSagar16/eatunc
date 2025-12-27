import { NextRequest, NextResponse } from 'next/server'
import { getFullMenuByDateAndHall, getAvailableDates } from '@/lib/api'

export const runtime = 'edge'
export const fetchCache = 'force-cache' // Always use cache for prefetch

/**
 * Prefetch API route
 * This route is called from the landing page to warm up the cache
 * for menu data before the user navigates to the menu page.
 * 
 * If no date is provided, it intelligently finds the closest available date.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    let date = searchParams.get('date')
    const hall = searchParams.get('hall')

    if (!hall) {
        return NextResponse.json(
            { error: 'Missing hall parameter' },
            { status: 400 }
        )
    }

    try {
        // If no date provided, find the closest available date
        if (!date) {
            const { data: dateData } = await getAvailableDates()
            const availableDates = Array.from(new Set(dateData?.map(d => d.menu_date) || [])).sort()

            if (availableDates.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'No menu dates available'
                })
            }

            // Find closest date to today
            const today = new Date().toISOString().split('T')[0]
            if (availableDates.includes(today)) {
                date = today
            } else {
                // Find closest date
                const todayTime = new Date(today).getTime()
                date = availableDates.reduce((prev, curr) => {
                    const prevDiff = Math.abs(new Date(prev).getTime() - todayTime)
                    const currDiff = Math.abs(new Date(curr).getTime() - todayTime)
                    return currDiff < prevDiff ? curr : prev
                })
            }
        }

        // Fetch the menu data - this will populate the cache
        await getFullMenuByDateAndHall(date, hall)

        return NextResponse.json({
            success: true,
            prefetched: { date, hall }
        })
    } catch (error) {
        // Return success even on error - prefetch is best-effort
        return NextResponse.json({
            success: false,
            error: 'Prefetch failed'
        })
    }
}
