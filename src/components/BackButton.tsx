'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

export default function BackButton() {
    return (
        <Link
            href="/"
            className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-sm font-medium"
        >
            <motion.div
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-2"
            >
                <motion.svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    whileHover={{ x: -3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </motion.svg>
                <span className="relative">Back to Main</span>
            </motion.div>
        </Link>
    )
}
