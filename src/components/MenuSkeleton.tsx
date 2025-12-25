'use client'

export default function MenuSkeleton() {
    return (
        <div className="flex flex-col gap-8 animate-pulse">
            {/* Meal Selector Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-1.5 w-fit">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl mx-0.5" />
                    ))}
                </div>
                <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            </div>

            {/* Healthy Picks Selector Skeleton */}
            <div className="rounded-3xl bg-zinc-100 dark:bg-zinc-900 p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="h-12 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                    <div className="flex-1 h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                </div>
            </div>

            {/* Content Sections Skeletons */}
            {[1, 2].map((section) => (
                <div key={section} className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                        <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-900" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((card) => (
                            <div key={card} className="h-48 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
