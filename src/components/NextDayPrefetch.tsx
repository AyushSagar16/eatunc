'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
    const router = useRouter()

    useEffect(() => {
        // Calculate next day
        const nextDate = new Date(currentDate)
        nextDate.setDate(nextDate.getDate() + 1)
        const nextDateStr = nextDate.toISOString().split('T')[0]

        // Convert hall name to slug
        const hallSlug = currentHall === 'Chase' ? 'chase' : 'lenoir'

        // Prefetch next day's menu in the background
        const prefetchNextDay = () => {
            router.prefetch(`/${hallSlug}/${nextDateStr}`)
        }

        // Delay prefetch slightly to not interfere with current page load
        const timer = setTimeout(prefetchNextDay, 500)

        return () => clearTimeout(timer)
    }, [currentDate, currentHall, router])

    // This component renders nothing
    return null
}
