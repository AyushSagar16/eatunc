'use client'

import { ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react'

function SkeletonCard() {
    return (
        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/40 p-6 backdrop-blur-md dark:bg-zinc-900/50 dark:border-zinc-800 h-full min-h-[14rem]">
            <div className="flex flex-col gap-4 flex-1">
                {/* Optional Reason Tag Placeholder */}
                <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse opacity-50" />

                {/* Title */}
                <div className="space-y-2">
                    <div className="h-7 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                    <div className="h-7 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                </div>

                <div className="mt-auto flex items-end justify-between gap-4 pt-4">
                    <div className="flex flex-col gap-1">
                        <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function MenuSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white animate-in fade-in duration-300">
            {/* Logo Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
                <div className="flex justify-start">
                    <div className="h-28 md:h-36 w-48 md:w-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                </div>
            </div>

            {/* Sticky Header Skeleton */}
            <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-zinc-200 shadow-sm mt-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left: Dining Hall Name */}
                        <div className="flex items-center gap-4 justify-start flex-1">
                            <div className="h-10 w-32 sm:w-40 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                        </div>

                        {/* Right: Dining Hall Switcher & Date Selector */}
                        <div className="flex flex-row items-center justify-between sm:justify-center gap-3 sm:gap-4">
                            {/* Dining Hall Switcher Button */}
                            <div className="h-[52px] w-36 sm:w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />

                            {/* Date Selector */}
                            <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-zinc-100 rounded-xl border border-zinc-200/50 min-h-[52px] shrink-0">
                                <div className="p-3 min-w-[44px] min-h-[44px] rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                                <div className="px-2 sm:px-4 min-w-[80px] sm:min-w-[120px] h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                                <div className="p-3 min-w-[44px] min-h-[44px] rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Meal Selection and Filtering */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
                {/* Mobile View: Period Dropdown and Sort */}
                <div className="flex sm:hidden flex-row items-stretch gap-3 mb-6 w-full">
                    <div className="flex-1 h-14 bg-blue-500/20 dark:bg-blue-500/10 rounded-2xl animate-pulse" />
                    <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                </div>

                {/* Desktop View: Tabs and Search/Sort */}
                <div className="hidden sm:block">
                    {/* Meal Period Tabs */}
                    <div className="flex justify-center mb-6 w-full">
                        <div className="inline-flex gap-1 p-1 bg-zinc-100 rounded-2xl border border-zinc-200/50">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="h-[50px] w-24 sm:w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Search and Sort Row */}
                    <div className="mb-3 flex gap-3">
                        <div className="flex-1 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                        <div className="w-48 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
                {/* Food Grid - 12 Skeleton Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 12 }).map((_, index) => (
                        <SkeletonCard key={index} />
                    ))}
                </div>
            </main>
        </div>
    )
}
