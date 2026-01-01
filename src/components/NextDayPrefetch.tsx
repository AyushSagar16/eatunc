'use client'

import { useEffect } from 'react'

interface NextDayPrefetchProps {
    currentDate: string
    currentHall: string
}

/**
 * Client component that automatically prefetches the next day's menu
 * when a user views a specific date. This improves navigation performance
 * by warming up the cache before the user clicks "next day".
 */
export default function NextDayPrefetch({ currentDate, currentHall }: NextDayPrefetchProps) {
    useEffect(() => {
        // Calculate next day
        const nextDate = new Date(currentDate)
        nextDate.setDate(nextDate.getDate() + 1)
        const nextDateStr = nextDate.toISOString().split('T')[0]

        // Prefetch next day's menu in the background
        const prefetchNextDay = async () => {
            try {
                await fetch(`/api/prefetch?date=${nextDateStr}&hall=${encodeURIComponent(currentHall)}`)
                // Silently succeed - prefetch is best-effort
            } catch (error) {
                // Silently fail - prefetch is an optimization, not critical
            }
        }

        // Delay prefetch slightly to not interfere with current page load
        const timer = setTimeout(prefetchNextDay, 500)

        return () => clearTimeout(timer)
    }, [currentDate, currentHall])

    // This component renders nothing
    return null
}
