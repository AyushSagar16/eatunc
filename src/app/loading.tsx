import MenuSkeleton from "@/components/MenuSkeleton";

export default function Loading() {
    return (
        <main className="min-h-screen bg-transparent py-1 px-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-500/10 blur-[120px] pointer-events-none -z-10 dark:bg-blue-600/5" />

            <div className="relative">
                <MenuSkeleton />
            </div>
        </main>
    );
}
