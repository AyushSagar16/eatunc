'use client'

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
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Sticky Header Skeleton */}
            <div className="sticky top-0 z-[60] w-full bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 shadow-sm py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-4 items-center">
                    {/* Date/Period/Hall selectors mockup */}
                    <div className="h-10 w-full lg:w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                    <div className="h-10 w-full lg:flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                    <div className="h-10 w-full lg:w-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl lg:ml-auto animate-pulse" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex flex-col gap-8">
                {/* Filter Pills Skeleton */}
                <div className="flex gap-2 overflow-hidden">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
                    ))}
                </div>

                {/* Top Picks Section Skeleton */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                        </div>
                        <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((card) => (
                            <SkeletonCard key={card} />
                        ))}
                    </div>
                </div>

                {/* Other Stations Skeleton */}
                {[1, 2].map((section) => (
                    <div key={section} className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((card) => (
                                <SkeletonCard key={card} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
