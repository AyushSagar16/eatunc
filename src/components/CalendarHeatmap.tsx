'use client'

import React, { useMemo } from 'react'
import { motion } from 'motion/react'

export interface HeatmapDay {
    date: string
    calories: number
    goal: number | null
}

interface CalendarHeatmapProps {
    days: HeatmapDay[]
    selectedDate: string | null
    onSelect: (date: string) => void
    label?: string
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function buildCalendarMonth(days: HeatmapDay[]): { date: string; cell: HeatmapDay | null }[] {
    if (days.length === 0) return []
    const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
    const first = sorted[0].date
    const last = sorted[sorted.length - 1].date
    const map = new Map(sorted.map((d) => [d.date, d]))

    const start = parseISO(first)
    const end = parseISO(last)

    // Pad to start of week (Sunday)
    const pad = start.getUTCDay()
    const allDates: string[] = []
    for (let i = 0; i < pad; i++) {
        const d = new Date(start)
        d.setUTCDate(d.getUTCDate() - (pad - i))
        allDates.push(toISO(d))
    }
    const cur = new Date(start)
    while (cur <= end) {
        allDates.push(toISO(cur))
        cur.setUTCDate(cur.getUTCDate() + 1)
    }
    // Pad to end of week (Saturday)
    while (parseISO(allDates[allDates.length - 1]).getUTCDay() !== 6) {
        const last = parseISO(allDates[allDates.length - 1])
        last.setUTCDate(last.getUTCDate() + 1)
        allDates.push(toISO(last))
    }

    return allDates.map((date) => ({ date, cell: map.get(date) ?? null }))
}

function parseISO(s: string): Date {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d))
}
function toISO(d: Date): string {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
}

function intensityClass(cal: number, goal: number | null): string {
    if (cal === 0) return 'bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-600'
    if (!goal) return 'bg-carolina-200 text-navy-900 dark:bg-carolina-900/40 dark:text-ink-50'
    const pct = cal / goal
    if (pct < 0.25) return 'bg-carolina-100 text-navy-900 dark:bg-carolina-950/60 dark:text-ink-100'
    if (pct < 0.5) return 'bg-carolina-200 text-navy-900 dark:bg-carolina-900/60 dark:text-ink-50'
    if (pct < 0.85) return 'bg-carolina-400 text-white dark:bg-carolina-700/80 dark:text-ink-50'
    if (pct < 1.05) return 'bg-carolina-500 text-white'
    return 'bg-navy-900 text-carolina-300 dark:bg-navy-700 dark:text-carolina-200'
}

export default function CalendarHeatmap({ days, selectedDate, onSelect, label }: CalendarHeatmapProps) {
    const grid = useMemo(() => buildCalendarMonth(days), [days])

    if (grid.length === 0) {
        return (
            <div className="rounded-3xl border border-dashed border-ink-300 px-6 py-10 text-center text-sm text-ink-500 dark:border-ink-700">
                Log a meal to see your calendar fill in.
            </div>
        )
    }

    return (
        <div>
            {label && (
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                    {label}
                </p>
            )}
            <div className="rounded-3xl border border-ink-200 bg-white p-4 shadow-sm dark:border-ink-800 dark:bg-ink-900">
                <div className="mb-2 grid grid-cols-7 gap-1.5 px-1">
                    {DAY_LABELS.map((d, i) => (
                        <span
                            key={i}
                            className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400"
                        >
                            {d}
                        </span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                    {grid.map(({ date, cell }) => {
                        const isSel = date === selectedDate
                        const dayNum = parseInt(date.split('-')[2], 10)
                        const cal = cell?.calories ?? 0
                        const goal = cell?.goal ?? null
                        const cls = cell
                            ? intensityClass(cal, goal)
                            : 'bg-transparent text-ink-300 dark:text-ink-700'
                        return (
                            <motion.button
                                key={date}
                                type="button"
                                onClick={() => cell && onSelect(date)}
                                disabled={!cell}
                                whileHover={cell ? { scale: 1.05 } : undefined}
                                whileTap={cell ? { scale: 0.95 } : undefined}
                                aria-label={`${date}${cell ? `, ${Math.round(cal)} kcal` : ', no log'}`}
                                className={`flex aspect-square items-center justify-center rounded-lg text-xs font-bold tabular-nums transition-colors ${cls} ${
                                    isSel ? 'ring-2 ring-navy-900 dark:ring-carolina-300' : ''
                                } ${!cell ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
                            >
                                {dayNum}
                            </motion.button>
                        )
                    })}
                </div>
                <Legend />
            </div>
        </div>
    )
}

function Legend() {
    return (
        <div className="mt-3 flex items-center justify-end gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            <span>Less</span>
            <span className="h-2.5 w-2.5 rounded-sm bg-carolina-100 dark:bg-carolina-950/60" />
            <span className="h-2.5 w-2.5 rounded-sm bg-carolina-300 dark:bg-carolina-800/70" />
            <span className="h-2.5 w-2.5 rounded-sm bg-carolina-500" />
            <span className="h-2.5 w-2.5 rounded-sm bg-navy-900" />
            <span>More</span>
        </div>
    )
}
