'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Minus, Trash2, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import type { LocalMealLog } from '@/lib/dexie'
import { updateLogServings, deleteLog } from '@/lib/actions/logMeal'

interface MealListProps {
    logs: LocalMealLog[]
    emptyHall?: string
    emptyDate?: string
    showAddCustom?: () => void
}

const PERIOD_ORDER = [
    'continental',
    'breakfast',
    'brunch',
    'lite-lunch',
    'lunch',
    'late-lunch',
    'dinner',
    'late-dinner',
    'late-night',
]

const PERIOD_LABELS: Record<string, string> = {
    breakfast: 'Breakfast',
    brunch: 'Brunch',
    lunch: 'Lunch',
    'lite-lunch': 'Lite Lunch',
    'late-lunch': 'Late Lunch',
    dinner: 'Dinner',
    'late-dinner': 'Late Dinner',
    'late-night': 'Late Night',
    continental: 'Continental',
}

function formatLogTime(iso: string): string {
    try {
        const d = new Date(iso)
        return new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric',
            minute: '2-digit',
        }).format(d)
    } catch {
        return ''
    }
}

export default function MealList({ logs, emptyHall, emptyDate, showAddCustom }: MealListProps) {
    const grouped = groupByPeriod(logs)
    const periodKeys = Object.keys(grouped).sort((a, b) => {
        const ai = PERIOD_ORDER.indexOf(a)
        const bi = PERIOD_ORDER.indexOf(b)
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-ink-300 px-6 py-12 text-center dark:border-ink-700">
                <p className="font-display text-lg font-bold text-navy-900 dark:text-ink-50">
                    Nothing logged yet
                </p>
                <p className="max-w-sm text-sm text-ink-500">
                    Browse a dining hall and tap <span className="font-semibold text-carolina-700 dark:text-carolina-300">+</span> on any food card to add it to your plate.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {emptyHall && emptyDate && (
                        <a
                            href={`/${emptyHall}/${emptyDate}`}
                            className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-navy-800 dark:bg-carolina-500 dark:text-navy-900 dark:hover:bg-carolina-400"
                        >
                            Browse menu →
                        </a>
                    )}
                    {showAddCustom && (
                        <button
                            type="button"
                            onClick={showAddCustom}
                            className="inline-flex items-center gap-1 rounded-full border border-ink-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-700 transition-colors hover:border-carolina-500 hover:text-carolina-700 dark:border-ink-700 dark:text-ink-200 dark:hover:border-carolina-400 dark:hover:text-carolina-300"
                        >
                            <Plus className="h-3 w-3" /> Custom item
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {periodKeys.map((period) => (
                <PeriodGroup key={period} period={period} logs={grouped[period]} />
            ))}
        </div>
    )
}

function PeriodGroup({ period, logs }: { period: string; logs: LocalMealLog[] }) {
    const totalKcal = logs.reduce((acc, l) => acc + (l.calories_kcal || 0), 0)
    const totalProtein = logs.reduce((acc, l) => acc + (l.protein_g || 0), 0)

    return (
        <section>
            <header className="mb-3 flex items-baseline gap-3">
                <h3 className="font-display text-base font-black uppercase tracking-[0.16em] text-navy-900 dark:text-ink-50">
                    {PERIOD_LABELS[period] ?? period}
                </h3>
                <div className="h-px flex-1 bg-ink-200 dark:bg-ink-800" />
                <p className="text-xs font-semibold tabular-nums text-ink-500">
                    {Math.round(totalKcal)} kcal · {Math.round(totalProtein)}g P
                </p>
            </header>
            <ul className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <LogRow key={log.id} log={log} />
                    ))}
                </AnimatePresence>
            </ul>
        </section>
    )
}

function LogRow({ log }: { log: LocalMealLog }) {
    const [busy, setBusy] = useState(false)
    const [showActions, setShowActions] = useState(false)

    const handleServings = async (next: number) => {
        const safe = Math.max(0.25, next)
        if (safe === log.servings) return
        setBusy(true)
        try {
            await updateLogServings(log.id, safe)
        } catch (err) {
            toast.error('Could not update', { description: err instanceof Error ? err.message : '' })
        } finally {
            setBusy(false)
        }
    }

    const handleDelete = async () => {
        setBusy(true)
        try {
            await deleteLog(log.id)
            toast.success('Removed from log')
        } catch (err) {
            toast.error('Could not delete', { description: err instanceof Error ? err.message : '' })
        } finally {
            setBusy(false)
        }
    }

    return (
        <motion.li
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 24 }}
            className="rounded-2xl border border-ink-200 bg-white p-3 shadow-sm dark:border-ink-800 dark:bg-ink-900"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-navy-900 dark:text-ink-50">
                        {log.food_name}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-500">
                        {log.source === 'custom' ? 'Custom' : log.dining_hall ?? 'Menu'}
                        <span className="mx-1.5 text-ink-300">·</span>
                        {formatLogTime(log.logged_at)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-display text-base font-black tabular-nums text-navy-900 dark:text-ink-50">
                        {Math.round(log.calories_kcal)}
                        <span className="ml-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-500">kcal</span>
                    </span>
                    <button
                        type="button"
                        aria-label="Toggle actions"
                        onClick={() => setShowActions((s) => !s)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showActions && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink-100 pt-3 dark:border-ink-800">
                            <div className="flex items-center gap-1 rounded-full bg-ink-100 p-0.5 dark:bg-ink-800">
                                <button
                                    type="button"
                                    aria-label="Decrease servings"
                                    disabled={busy}
                                    onClick={() => handleServings(log.servings - 0.5)}
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-ink-700 hover:bg-white hover:text-navy-900 disabled:opacity-50 dark:text-ink-200 dark:hover:bg-ink-700 dark:hover:text-ink-50"
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-navy-900 dark:text-ink-50">
                                    {log.servings % 1 === 0 ? log.servings : log.servings.toFixed(1)}×
                                </span>
                                <button
                                    type="button"
                                    aria-label="Increase servings"
                                    disabled={busy}
                                    onClick={() => handleServings(log.servings + 0.5)}
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-ink-700 hover:bg-white hover:text-navy-900 disabled:opacity-50 dark:text-ink-200 dark:hover:bg-ink-700 dark:hover:text-ink-50"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <button
                                type="button"
                                aria-label="Delete log"
                                disabled={busy}
                                onClick={handleDelete}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.li>
    )
}

function groupByPeriod(logs: LocalMealLog[]): Record<string, LocalMealLog[]> {
    const out: Record<string, LocalMealLog[]> = {}
    for (const log of logs) {
        const key = log.meal_period || 'untagged'
        if (!out[key]) out[key] = []
        out[key].push(log)
    }
    for (const k of Object.keys(out)) {
        out[k].sort((a, b) => a.logged_at.localeCompare(b.logged_at))
    }
    return out
}
