import MenuSkeleton from "@/components/MenuSkeleton";

export default function Loading() {
    return (
        <main className="min-h-screen bg-transparent py-12 px-6 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-500/10 blur-[120px] pointer-events-none -z-10 dark:bg-blue-600/5" />

            <div className="max-w-7xl mx-auto relative">
                <header className="mb-12 relative animate-pulse">
                    <div className="h-16 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl mb-4" />
                    <div className="h-6 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-8" />
                    <div className="h-12 w-full max-w-md bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                </header>

                <MenuSkeleton />
            </div>
        </main>
    );
}
