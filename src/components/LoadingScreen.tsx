'use client'

import { motion, AnimatePresence } from 'motion/react'

interface LoadingScreenProps {
    isLoading: boolean
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#13294B] via-[#1a3a5c] to-[#13294B]"
                >
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <motion.div
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
                    <div className="relative z-10 flex flex-col items-center gap-8">
                        {/* Logo/Icon */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="relative">
                                {/* Pulsing Ring */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.5, 0.2, 0.5],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                    className="absolute inset-0 rounded-full bg-blue-400/30 blur-xl"
                                />

                                {/* Main Circle */}
                                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-2xl">
                                    <svg
                                        className="w-10 h-10 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </motion.div>

                        {/* Loading Text */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                Loading Your Menu
                            </h2>

                            {/* Animated Dots */}
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
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
                                        className="w-2 h-2 rounded-full bg-blue-400"
                                    />
                                ))}
                            </div>
                        </motion.div>

                        {/* Progress Bar */}
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 200 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="h-1 bg-white/10 rounded-full overflow-hidden"
                        >
                            <motion.div
                                animate={{
                                    x: ['-100%', '100%'],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className="h-full w-1/2 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                            />
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
