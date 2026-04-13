'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Check, Minus, LogIn } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { logFood, getLogsForDate } from '@/lib/food-log'
import { MasterFoodItem } from '@/lib/api'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface LogFoodButtonProps {
    item: MasterFoodItem
    mealPeriod: string
    diningHall: string
    variant?: 'modal' | 'card' | 'mini'
    className?: string
}

export default function LogFoodButton({ item, mealPeriod, diningHall, variant = 'modal', className }: LogFoodButtonProps) {
    const { user } = useAuth()
    const [servings, setServings] = useState(1)
    const [showSuccess, setShowSuccess] = useState(false)
    const [logVersion, setLogVersion] = useState(0)

    const today = new Date().toISOString().split('T')[0]

    const todayCount = useMemo(() => {
        if (!user) return 0
        // logVersion is used to trigger recalculation after logging
        void logVersion
        const logs = getLogsForDate(user.id, today)
        return logs.filter(l => l.recipeNumber === item.recipe_number).length
    }, [user, today, item.recipe_number, logVersion])

    const handleLog = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (!user) return

        logFood(user.id, item, mealPeriod, diningHall, servings)
        setShowSuccess(true)
        setServings(1)
        setLogVersion(v => v + 1)

        setTimeout(() => setShowSuccess(false), 2000)
    }

    // Not logged in - show login prompt
    if (!user) {
        if (variant === 'mini') return null

        return (
            <Link
                href="/login"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                    className
                )}
            >
                <LogIn className="w-4 h-4" />
                Sign in to log
            </Link>
        )
    }

    // Mini variant for food cards - just a small + button
    if (variant === 'mini') {
        return (
            <motion.button
                onClick={handleLog}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                    'relative flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                    showSuccess
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#4B9CD3]/10 text-[#4B9CD3] hover:bg-[#4B9CD3]/20 dark:bg-[#4B9CD3]/20 dark:hover:bg-[#4B9CD3]/30',
                    className
                )}
                title="Log this food"
            >
                <AnimatePresence mode="wait">
                    {showSuccess ? (
                        <motion.div
                            key="check"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        >
                            <Check className="w-4 h-4" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="plus"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        >
                            <Plus className="w-4 h-4" />
                        </motion.div>
                    )}
                </AnimatePresence>
                {todayCount > 0 && !showSuccess && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#4B9CD3] text-white text-[9px] font-bold flex items-center justify-center">
                        {todayCount}
                    </span>
                )}
            </motion.button>
        )
    }

    // Card variant - compact button
    if (variant === 'card') {
        return (
            <motion.button
                onClick={handleLog}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                    showSuccess
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#4B9CD3] text-white hover:bg-[#3a8bc2]',
                    className
                )}
            >
                <AnimatePresence mode="wait">
                    {showSuccess ? (
                        <motion.span
                            key="logged"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1"
                        >
                            <Check className="w-3 h-3" /> Logged!
                        </motion.span>
                    ) : (
                        <motion.span
                            key="log"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Log
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        )
    }

    // Modal variant - full size with serving selector
    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {/* Servings selector */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Servings</span>
                <div className="flex items-center gap-2">
                    <motion.button
                        onClick={(e) => {
                            e.stopPropagation()
                            setServings(Math.max(1, servings - 1))
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        disabled={servings <= 1}
                    >
                        <Minus className="w-4 h-4" />
                    </motion.button>
                    <span className="w-8 text-center text-lg font-black text-zinc-900 dark:text-zinc-100">
                        {servings}
                    </span>
                    <motion.button
                        onClick={(e) => {
                            e.stopPropagation()
                            setServings(Math.min(10, servings + 1))
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        disabled={servings >= 10}
                    >
                        <Plus className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            {/* Nutrition for selected servings */}
            {servings > 1 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs text-zinc-500 dark:text-zinc-400 text-center"
                >
                    {((item.calories_kcal ?? 0) * servings).toLocaleString()} kcal &middot;{' '}
                    {((item.protein_g ?? 0) * servings)}g protein &middot;{' '}
                    {((item.carbohydrates_g ?? 0) * servings)}g carbs &middot;{' '}
                    {((item.fat_g ?? 0) * servings)}g fat
                </motion.div>
            )}

            {/* Log button */}
            <motion.button
                onClick={handleLog}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                    'w-full rounded-2xl py-3.5 text-sm font-bold transition-all',
                    showSuccess
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#4B9CD3] text-white hover:bg-[#3a8bc2] shadow-lg shadow-[#4B9CD3]/25'
                )}
            >
                <AnimatePresence mode="wait">
                    {showSuccess ? (
                        <motion.span
                            key="success"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" /> Logged to Today&apos;s Meals!
                        </motion.span>
                    ) : (
                        <motion.span
                            key="log"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Log {servings > 1 ? `${servings} Servings` : 'This Meal'}
                            {todayCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                                    {todayCount} today
                                </span>
                            )}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    )
}
