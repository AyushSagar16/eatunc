'use client'

import Link from 'next/link'
import Image from 'next/image'
import DitherShader from '@/components/ui/dither-shader'
import { motion } from 'motion/react'

export default function NotFound() {
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
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex flex-col items-center p-8 md:p-16 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-md text-center overflow-hidden"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent pointer-events-none"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="space-y-6 relative z-10"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <motion.div
                                className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-white/10"
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Image
                                    src="/unc-food-logo.png"
                                    alt="Eat UNC Logo"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </motion.div>
                            <motion.span
                                className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-sm font-bold tracking-widest uppercase"
                            >
                                404 Error
                            </motion.span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
                            Off the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200">Menu</span>
                        </h1>

                        <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-md mx-auto leading-relaxed">
                            It looks like this page has been cleared from the line. Let's get you back to the dining hall.
                        </p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="pt-4"
                        >
                            <Link href="/">
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 rounded-2xl bg-white text-zinc-950 font-bold text-lg shadow-xl shadow-white/5 hover:shadow-white/10 transition-all duration-300 flex items-center gap-2 mx-auto"
                                >
                                    <span>Head Back Home</span>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </motion.button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-8 text-center"
                >
                    <p className="text-zinc-500 font-medium text-sm">
                        UNC Dining Dashboard • Chapel Hill, NC
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
