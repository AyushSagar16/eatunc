'use client'

import { useRouter } from 'next/navigation'

import DitherShader from './ui/dither-shader'
import { motion } from 'motion/react'
import Image from 'next/image'

export default function LandingScreen() {
    const router = useRouter()



    const handleSelect = (hall: string) => {
        // Always navigate to today's date in EST (UNC Time)
        // usage of toLocaleDateString ensures we get the correct "dining day"
        const now = new Date()
        const today = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(now) // standard format is YYYY-MM-DD for en-CA

        router.push(`/${hall}/${today}`)
    }

    return (
        <div className="relative min-h-screen-ios-safe flex flex-col items-center" style={{ backgroundColor: '#3a4f5f' }}>
            {/* Dither Background with Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none">
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

            <div className="max-w-7xl w-full px-6 pt-16 pb-8 relative z-10 flex flex-col items-center gap-16 md:gap-24">
                {/* Header content... (lines 48-241) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center space-y-6"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/10 backdrop-blur-md shadow-lg shadow-black/20"
                    >
                        <div className="relative w-48 h-16">
                            <Image
                                src="/eat_unc_text_logo_white_nb.svg"
                                alt="Eat UNC Logo"
                                fill
                                className="object-contain scale-120"
                                unoptimized
                            />
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-5xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl"
                    >
                        Find Your <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200">Fuel</span>
                    </motion.h1>
                </motion.div>

                {/* Selection Cards */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.15,
                                delayChildren: 0.3
                            }
                        }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full max-w-4xl"
                >

                    {/* Chase Card */}
                    <motion.button
                        variants={{
                            hidden: { opacity: 0, y: 30, scale: 0.9 },
                            visible: { opacity: 1, y: 0, scale: 1 }
                        }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => handleSelect('chase')}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative flex flex-col p-5 md:p-10 h-64 md:h-80 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-md text-left overflow-hidden"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent"
                        />

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center text-blue-200"
                                >
                                    <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 1, x: 0 }}
                                    whileHover={{ x: 5 }}
                                    className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                >
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                                        <motion.svg
                                            whileHover={{ x: 3 }}
                                            className="w-4 h-4 md:w-5 md:h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </motion.svg>
                                    </div>
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0.9 }}
                                whileHover={{ opacity: 1 }}
                            >
                                <h2 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2 tracking-tight">Chase</h2>
                                <div className="flex items-center gap-1.5 md:gap-2 text-blue-200/60 font-medium text-sm md:text-lg">
                                    <motion.span
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                        className="w-1.5 h-1.5 rounded-full bg-blue-400"
                                    />
                                    South Campus
                                </div>
                            </motion.div>
                        </div>
                    </motion.button>

                    {/* Lenoir Card */}
                    <motion.button
                        variants={{
                            hidden: { opacity: 0, y: 30, scale: 0.9 },
                            visible: { opacity: 1, y: 0, scale: 1 }
                        }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => handleSelect('lenoir')}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative flex flex-col p-5 md:p-10 h-64 md:h-80 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-md text-left overflow-hidden"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-transparent to-transparent"
                        />

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: -5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-teal-500/20 border border-teal-400/20 flex items-center justify-center text-teal-200"
                                >
                                    <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 1, x: 0 }}
                                    whileHover={{ x: 5 }}
                                    className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                >
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                                        <motion.svg
                                            whileHover={{ x: 3 }}
                                            className="w-4 h-4 md:w-5 md:h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </motion.svg>
                                    </div>
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0.9 }}
                                whileHover={{ opacity: 1 }}
                            >
                                <h2 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2 tracking-tight leading-tight">Top of <br className="md:hidden" />Lenoir</h2>
                                <div className="flex items-center gap-1.5 md:gap-2 text-teal-200/60 font-medium text-sm md:text-lg">
                                    <motion.span
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
                                        className="w-1.5 h-1.5 rounded-full bg-teal-400"
                                    />
                                    North Campus
                                </div>
                            </motion.div>
                        </div>
                    </motion.button>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-zinc-500 font-medium text-sm"
                >
                    Menus are dynamically updated from UNC Dining services.
                </motion.p>
            </div>
        </div>
    )
}

