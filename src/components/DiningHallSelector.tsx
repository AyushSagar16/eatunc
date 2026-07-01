'use client'

import { motion } from 'motion/react'

interface DiningHallSelectorProps {
    halls: string[]
    selectedHall: string
    onHallChange: (hall: string) => void
}

export default function DiningHallSelector({ halls, selectedHall, onHallChange }: DiningHallSelectorProps) {
    const getHallLabel = (hall: string) => {
        if (hall === 'Top of Lenoir') return 'Lenoir'
        return hall
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl shadow-border transition-[box-shadow] duration-150 ease-out hover:shadow-border-hover w-fit">
                {halls.map((hall) => {
                    const isActive = hall === selectedHall
                    return (
                        <motion.button
                            key={hall}
                            onClick={() => onHallChange(hall)}
                            whileTap={{ scale: 0.96 }}
                            className={`
                                relative px-6 py-2 rounded-xl text-sm font-bold transition-colors duration-150 ease-out
                                ${isActive
                                    ? 'text-zinc-900 dark:text-zinc-50'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="diningHallActivePill"
                                    transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                                    className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-border"
                                />
                            )}
                            <span className="relative z-10">{getHallLabel(hall)}</span>
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}
