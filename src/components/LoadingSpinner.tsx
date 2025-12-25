export default function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center gap-6">
            <div className="relative w-16 h-16">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800" />

                {/* Spinning Gradient Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-400 dark:border-t-blue-500 dark:border-r-blue-400 animate-spin" />

                {/* Inner Pulse */}
                <div className="absolute inset-4 rounded-full bg-blue-500/10 dark:bg-blue-400/10 animate-pulse backdrop-blur-sm" />

                {/* Center Dot */}
                <div className="absolute inset-[26px] rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
            </div>

            <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-wider uppercase animate-pulse">
                    Loading Menu
                </p>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-[bounce_1s_infinite_0ms]" />
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-[bounce_1s_infinite_200ms]" />
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-[bounce_1s_infinite_400ms]" />
                </div>
            </div>
        </div>
    )
}
