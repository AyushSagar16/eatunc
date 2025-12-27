'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import DitherShader from './ui/dither-shader'

export default function LandingScreen() {
    const router = useRouter()

    // Prefetch menus for both halls in the background
    useEffect(() => {
        const prefetchMenus = async () => {
            // Don't pass a date - let the API route find the closest available date
            // This ensures we only prefetch if there's actually menu data available
            try {
                await Promise.all([
                    fetch(`/api/prefetch?hall=Chase`),
                    fetch(`/api/prefetch?hall=Top of Lenoir`)
                ])
            } catch (error) {
                // Silently fail - prefetch is an optimization, not critical
                console.log('Prefetch skipped:', error)
            }
        }

        // Small delay to not block initial page render
        const timer = setTimeout(prefetchMenus, 100)
        return () => clearTimeout(timer)
    }, [])

    const handleSelect = (hall: string) => {
        router.push(`/?hall=${hall}`)
    }

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-zinc-950">
            {/* Dither Background with Overlay */}
            <div className="absolute inset-0 z-0">
                <DitherShader
                    src="/old-well.jpg"
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

            <div className="max-w-7xl w-full px-6 relative z-10 flex flex-col items-center gap-16">

                {/* Header */}
                <div className="text-center space-y-6 animate-in fade-in slide-in-from-top-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-blue-200/80 text-xs font-medium tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Eat UNC
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
                        Find Your <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200">Fuel</span>
                    </h1>
                </div>

                {/* Selection Cards */}
                <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-4xl">

                    {/* Chase Card */}
                    <button
                        onClick={() => handleSelect('chase')}
                        className="group relative flex flex-col p-5 md:p-10 h-56 md:h-80 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-md text-left hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center text-blue-200">
                                    <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>

                                <div className="opacity-100 md:opacity-0 group-hover:opacity-100 transform translate-x-0 md:translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 tracking-tight">Chase</h2>
                                <div className="flex items-center gap-1.5 md:gap-2 text-blue-200/60 font-medium text-xs md:text-base">
                                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                                    South Campus
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Lenoir Card */}
                    <button
                        onClick={() => handleSelect('lenoir')}
                        className="group relative flex flex-col p-5 md:p-10 h-56 md:h-80 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-md text-left hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-teal-500/20 border border-teal-400/20 flex items-center justify-center text-teal-200">
                                    <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>

                                <div className="opacity-100 md:opacity-0 group-hover:opacity-100 transform translate-x-0 md:translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 tracking-tight leading-tight">Top of <br className="md:hidden" />Lenoir</h2>
                                <div className="flex items-center gap-1.5 md:gap-2 text-teal-200/60 font-medium text-xs md:text-base">
                                    <span className="w-1 h-1 rounded-full bg-teal-400" />
                                    North Campus
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                <p className="text-zinc-500 font-medium text-sm animate-in fade-in duration-1000 delay-500">
                    Menus are dynamically updated from UNC Dining services.
                </p>
            </div>
        </div>
    )
}
