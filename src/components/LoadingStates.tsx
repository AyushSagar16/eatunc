'use client'

import { m } from 'motion/react'
import { cn } from '@/lib/utils'

interface FoodCardSkeletonProps {
    className?: string
}

/**
 * FoodCardSkeleton - Animated skeleton loader for food cards
 * Matches the layout of FoodCard with pulsing animation
 */
function FoodCardSkeleton({ className }: FoodCardSkeletonProps) {
    return (
        <div
            className={cn(
                'flex flex-col overflow-hidden',
                'rounded-2xl border border-zinc-200/80 dark:border-zinc-800',
                'bg-white dark:bg-zinc-900/60',
                'p-5 sm:p-6',
                'h-full min-h-[180px]',
                className
            )}
        >
            <div className="flex flex-col gap-3 flex-1 animate-pulse">
                {/* Badge placeholder */}
                <div className="flex gap-1.5">
                    <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                </div>

                {/* Title placeholder */}
                <div className="space-y-2">
                    <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-5 w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Macros placeholder */}
                <div className="flex gap-2">
                    <div className="h-3 w-8 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-8 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-8 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>

                {/* Calories placeholder */}
                <div className="flex items-baseline gap-2 mt-1">
                    <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-4 w-8 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>
            </div>
        </div>
    )
}

/**
 * FoodGridSkeleton - Grid of skeleton cards for loading state
 */
export function FoodGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <m.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                    <FoodCardSkeleton />
                </m.div>
            ))}
        </div>
    )
}

/**
 * LoadingSpinner - Animated spinner for transitions
 */
function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = {
        sm: 'size-4',
        md: 'size-6',
        lg: 'size-8',
    }

    return (
        <m.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className={cn(sizes[size], 'border-2 border-blue-500 border-t-transparent rounded-full')}
        />
    )
}

/**
 * ContentLoader - Full content loading overlay
 */
export function ContentLoader({ message = 'Loading...' }: { message?: string }) {
    return (
        <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 gap-4"
        >
            <LoadingSpinner size="lg" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{message}</p>
        </m.div>
    )
}
