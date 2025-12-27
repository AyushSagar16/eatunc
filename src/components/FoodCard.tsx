'use client'

import { useState } from 'react'
import { MasterFoodItem } from '@/lib/api'
import FoodModal from './FoodModal'
import { motion } from 'motion/react'

interface FoodCardProps {
    item: MasterFoodItem
    station: string
    reason?: string
    mealPeriod: string
    onClick: () => void
}

export default function FoodCard({ item, station, reason, mealPeriod, onClick }: FoodCardProps) {
    const {
        food_name,
        calories_kcal,
    } = item

    return (
        <motion.div
            onClick={onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{
                scale: 1.02,
                y: -4,
                boxShadow: "0 20px 60px rgba(59, 130, 246, 0.15)"
            }}
            whileTap={{ scale: 0.98 }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 25
            }}
            className="group relative flex flex-col cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white/40 p-6 backdrop-blur-md dark:bg-zinc-900/50 dark:border-zinc-800 h-full"
        >
            <motion.div
                className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl"
                whileHover={{ scale: 1.5, opacity: 0.3 }}
                initial={{ opacity: 0.1 }}
                transition={{ duration: 0.3 }}
            />

            <div className="flex flex-col gap-4 flex-1">
                {reason && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="w-fit px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                    >
                        <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-tighter">
                            {reason}
                        </span>
                    </motion.div>
                )}
                <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug flex-1">
                    {food_name || 'Unknown Item'}
                </h3>

                <div className="flex items-end justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-bold">Calories</span>
                        <motion.span
                            className="text-2xl font-black text-blue-600 dark:text-blue-400"
                            whileHover={{ scale: 1.05 }}
                        >
                            {calories_kcal ?? 0}
                            <span className="ml-1 text-sm font-normal text-zinc-400">kcal</span>
                        </motion.span>
                    </div>


                </div>
            </div>
        </motion.div>
    )
}
