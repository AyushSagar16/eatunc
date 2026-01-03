"use client"

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import FoodDisplayLayout from '@/components/FoodDisplayLayout'
import BackButton from '@/components/BackButton'

interface NoMenuAvailableProps {
    selectedDate: string
    selectedHall: string
    availableDates: string[]
    nextAvailableDate?: string
}

export default function NoMenuAvailable({
    selectedDate,
    selectedHall,
    availableDates,
    nextAvailableDate
}: NoMenuAvailableProps) {
    const router = useRouter()

    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    })

    const handleNavigateToNextDate = () => {
        if (nextAvailableDate) {
            const hallSlug = selectedHall === 'Chase' ? 'chase' : 'lenoir'
            router.push(`/${hallSlug}/${nextAvailableDate}`)
        }
    }

    return (
        <div className="relative">
            {/* Prominent Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
                <div className="flex flex-col gap-6">
                    <BackButton />
                    <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800">
                            <Image
                                src="/unc-food-logo.png"
                                alt="UNC Food Logo"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 opacity-80">
                                Eat UNC
                            </p>
                            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                                {selectedHall}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <FoodDisplayLayout
                diningHall={selectedHall}
                selectedDate={selectedDate}
                availableDates={availableDates}
                selectedPeriod=""
                availablePeriods={[]}
                onPeriodChange={() => { }}
            >
                <div className="flex items-center justify-center px-4 py-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-xl w-full"
                    >
                        <div className="px-8 py-12 md:px-12 md:py-16 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center">
                            {/* Clock Icon */}
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-10"
                            >
                                <svg
                                    className="w-10 h-10 text-blue-600 dark:text-blue-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.8}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </motion.div>

                            {/* Title */}
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-50 mb-4 text-center tracking-tight"
                            >
                                {selectedHall} isn't open on {formattedDate}
                            </motion.h2>

                            {/* Description */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-center mb-10 text-sm max-w-[320px]"
                            >
                                We couldn't find any menu items for this date. It looks like the dining hall might be closed.
                            </motion.p>

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-col items-center gap-4 w-full"
                            >
                                <a
                                    href="https://dining.unc.edu/menu-hours/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25"
                                >
                                    <span>Double Check Official Schedule</span>
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                </a>

                                {nextAvailableDate && (
                                    <button
                                        onClick={handleNavigateToNextDate}
                                        className="text-sm font-bold text-zinc-400 hover:text-blue-600 transition-colors py-2"
                                    >
                                        View Next Available Menu →
                                    </button>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </FoodDisplayLayout>
        </div>
    )
}
