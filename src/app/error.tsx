'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import DitherShader from '@/components/ui/dither-shader'
import { m } from 'motion/react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-zinc-950">
            {/* Dither Background with Overlay */}
            <div className="absolute inset-0 z-0">
                <DitherShader
                    src="/old-well-optimized.jpg"
                    ditherMode="bayer"
                    colorMode="duotone"
                    primaryColor="#13294B" // UNC Navy
                    secondaryColor="#4B9CD3" // UNC Blue
                    threshold={0.7}
                    pixelRatio={1}
                    className="opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-zinc-950/40" />
            </div>

            <div className="max-w-2xl w-full px-6 relative z-10">
                <m.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex flex-col items-center p-8 md:p-16 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-md text-center overflow-hidden"
                >
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent pointer-events-none"
                    />

                    <m.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="space-y-6 relative z-10"
                    >
                        <m.span
                            className="inline-block px-4 py-1.5 rounded-full bg-red-500/10 border border-red-400/20 text-red-300 text-sm font-bold tracking-widest uppercase"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            System Error
                        </m.span>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
                            Kitchen's <span className="text-red-200">Overwhelmed</span>
                        </h1>

                        <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-sm mx-auto leading-relaxed">
                            Something went wrong while preparing this page. Let's try to reload the recipe.
                        </p>

                        <m.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                        >
                            <m.button
                                onClick={() => reset()}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-zinc-950 font-bold text-lg shadow-xl shadow-white/5 hover:shadow-white/10 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Try Again</span>
                            </m.button>

                            <Link href="/" className="w-full sm:w-auto">
                                <m.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <span>Go Home</span>
                                </m.button>
                            </Link>
                        </m.div>
                    </m.div>
                </m.div>

                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-8 text-center"
                >
                    <p className="text-zinc-500 font-medium text-sm">
                        UNC Dining Dashboard • Chapel Hill, NC
                    </p>
                </m.div>
            </div>
        </div>
    )
}
