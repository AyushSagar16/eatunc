'use client'

import { m, AnimatePresence } from 'motion/react'
import Image from 'next/image'

interface LoadingScreenProps {
    isLoading: boolean
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
    return (
        <AnimatePresence>
            {isLoading && (
                <m.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#13294B] via-[#1a3a5c] to-[#13294B]"
                >
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <m.div
                            animate={{
                                backgroundPosition: ['0% 0%', '100% 100%'],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                repeatType: 'reverse',
                            }}
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(75, 156, 211, 0.3) 0%, transparent 50%),
                                                 radial-gradient(circle at 80% 80%, rgba(75, 156, 211, 0.3) 0%, transparent 50%),
                                                 radial-gradient(circle at 40% 20%, rgba(75, 156, 211, 0.2) 0%, transparent 50%)`,
                                backgroundSize: '200% 200%',
                            }}
                        />
                    </div>

                    {/* Loading Content */}
                    <div className="relative z-10 flex flex-col items-center gap-6">
                        {/* EatUNC Logo with Pulsing Animation */}
                        <m.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: 1
                            }}
                            transition={{
                                scale: {
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                },
                                opacity: {
                                    duration: 0.5
                                }
                            }}
                            className="relative"
                        >
                            {/* Pulsing Glow Effect */}
                            <m.div
                                animate={{
                                    scale: [1, 1.15, 1],
                                    opacity: [0.4, 0.1, 0.4],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className="absolute inset-0 rounded-3xl bg-white/20 blur-2xl"
                            />

                            {/* Logo Image */}
                            <Image
                                src="/eat_unc_logo_white_nb.svg"
                                alt="EatUNC Logo"
                                width={256}
                                height={256}
                                unoptimized
                                className="relative size-56 md:w-64 md:h-64 object-contain drop-shadow-2xl"
                            />
                        </m.div>

                        {/* Loading Text */}
                        <m.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                Loading the Menu
                            </h2>

                            {/* Animated Dots */}
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <m.div
                                        key={i}
                                        animate={{
                                            scale: [1, 1.3, 1],
                                            opacity: [0.3, 1, 0.3],
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                        }}
                                        className="size-2 rounded-full bg-blue-400"
                                    />
                                ))}
                            </div>
                        </m.div>
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    )
}
