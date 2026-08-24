"use client"

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Clock3, ExternalLink } from 'lucide-react'
import FoodDisplayLayout from '@/components/FoodDisplayLayout'
import { HALLS } from '@/lib/campus'

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
            const hallSlug = HALLS.find((hall) => hall.diningHall === selectedHall)?.routeSlug
            if (!hallSlug) return
            router.push(`/${hallSlug}/${nextAvailableDate}`)
        }
    }

    return (
        <div className="relative">
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
                        <div className="px-8 py-12 md:px-12 md:py-16 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center">
                            {/* Clock Icon */}
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-8"
                            >
                                <Clock3 className="w-8 h-8 text-blue-600 dark:text-blue-400" strokeWidth={1.8} />
                            </motion.div>

                            {/* Title */}
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-50 mb-4 text-center tracking-tight"
                            >
                                No menu published for {selectedHall} on {formattedDate}
                            </motion.h2>

                            {/* Description */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-center mb-10 text-sm max-w-[320px]"
                            >
                                UNC hasn&apos;t published itemised menu items for this date. The
                                halls close for university breaks, and some campus venues keep
                                hours without UNC listing their food — so a venue shown as open
                                above may still be serving.
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
                                    <span>Double-check official schedule</span>
                                    <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
                                </a>

                                {nextAvailableDate && (
                                    <button
                                        onClick={handleNavigateToNextDate}
                                        className="text-sm font-bold text-zinc-400 hover:text-blue-600 transition-colors py-2"
                                    >
                                        <span className="inline-flex items-center gap-1.5">
                                            View next available menu
                                            <ArrowRight className="w-4 h-4" />
                                        </span>
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
