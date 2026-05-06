'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import {
    db,
    getDeviceId,
    getDiningDate,
    sumLogs,
    type LocalMealLog,
} from '@/lib/dexie'
import MealList from '@/components/MealList'
import CalendarHeatmap, { type HeatmapDay } from '@/components/CalendarHeatmap'
import SubNav from '@/components/SubNav'

const RANGE_DAYS = 30

export default function HistoryPage() {
    const [today, setToday] = useState<string>('')
    const [deviceId, setDeviceId] = useState<string>('')
    const [selectedDate, setSelectedDate] = useState<string>('')

    useEffect(() => {
        const td = getDiningDate()
        setToday(td)
        setSelectedDate(td)
        setDeviceId(getDeviceId())
    }, [])

    // All logs in range
    const logsInRange = useLiveQuery(
        async () => {
            if (!today || !deviceId) return []
            const startDate = isoOffset(today, -RANGE_DAYS)
            return db.meal_logs
                .where('device_id')
                .equals(deviceId)
                .filter((l) => l.logged_date >= startDate)
                .toArray()
        },
        [today, deviceId],
        [],
    )

    const goalsInRange = useLiveQuery(
        async () => {
            if (!deviceId) return []
            return db.user_goals.where('device_id').equals(deviceId).toArray()
        },
        [deviceId],
        [],
    )

    const heatmapDays: HeatmapDay[] = useMemo(() => {
        if (!today) return []
        const days: HeatmapDay[] = []
        for (let i = RANGE_DAYS; i >= 0; i--) {
            const date = isoOffset(today, -i)
            const logs = (logsInRange ?? []).filter((l) => l.logged_date === date)
            const cal = logs.reduce((acc, l) => acc + (l.calories_kcal || 0), 0)
            const goal = applicableGoal(date, goalsInRange ?? [])
            days.push({ date, calories: cal, goal: goal?.calorie_goal ?? null })
        }
        return days
    }, [today, logsInRange, goalsInRange])

    const dayLogs = useMemo<LocalMealLog[]>(
        () => (logsInRange ?? []).filter((l) => l.logged_date === selectedDate),
        [logsInRange, selectedDate],
    )
    const dayTotals = useMemo(() => sumLogs(dayLogs), [dayLogs])
    const dayGoal = useMemo(
        () => applicableGoal(selectedDate, goalsInRange ?? []),
        [selectedDate, goalsInRange],
    )

    const isToday = selectedDate === today

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 pb-32 pt-6 sm:px-6 sm:pt-12">
            <header className="flex flex-col items-center gap-4">
                <SubNav />
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                        Last {RANGE_DAYS + 1} days
                    </p>
                    <h1 className="mt-1 font-display text-4xl font-black tracking-tight text-navy-900 dark:text-ink-50 sm:text-5xl">
                        History
                    </h1>
                </div>
            </header>

            <CalendarHeatmap
                days={heatmapDays}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                label="Calorie intensity by day"
            />

            <motion.section
                key={selectedDate}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-3"
            >
                <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-2xl font-black tracking-tight text-navy-900 dark:text-ink-50">
                        {selectedDate ? formatLong(selectedDate) : ''}
                    </h2>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                        {isToday ? 'Today' : ''}
                    </span>
                </div>
                {dayLogs.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                        <DayTotal label="kcal" value={dayTotals.calories} target={dayGoal?.calorie_goal ?? null} accent="kcal" />
                        <DayTotal label="P" value={dayTotals.protein} target={dayGoal?.protein_goal_g ?? null} suffix="g" accent="protein" />
                        <DayTotal label="F" value={dayTotals.fat} target={dayGoal?.fat_goal_g ?? null} suffix="g" accent="fat" />
                        <DayTotal label="C" value={dayTotals.carbs} target={dayGoal?.carb_goal_g ?? null} suffix="g" accent="carbs" />
                    </div>
                )}

                <MealList logs={dayLogs} emptyHall="chase" emptyDate={selectedDate} />

                {selectedDate && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Link
                            href={`/chase/${selectedDate}`}
                            className="inline-flex items-center gap-1 rounded-full border border-ink-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-700 transition-colors hover:border-carolina-500 hover:text-carolina-700 dark:border-ink-700 dark:text-ink-200 dark:hover:border-carolina-400 dark:hover:text-carolina-300"
                        >
                            Browse Chase <ArrowRight className="h-3 w-3" />
                        </Link>
                        <Link
                            href={`/lenoir/${selectedDate}`}
                            className="inline-flex items-center gap-1 rounded-full border border-ink-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-700 transition-colors hover:border-carolina-500 hover:text-carolina-700 dark:border-ink-700 dark:text-ink-200 dark:hover:border-carolina-400 dark:hover:text-carolina-300"
                        >
                            Browse Lenoir <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                )}
            </motion.section>
        </main>
    )
}

interface DayTotalProps {
    label: string
    value: number
    target: number | null
    suffix?: string
    accent: 'kcal' | 'protein' | 'fat' | 'carbs'
}

function DayTotal({ label, value, target, suffix = '', accent }: DayTotalProps) {
    const dot = {
        kcal: 'bg-carolina-500',
        protein: 'bg-[oklch(0.74_0.135_55)]',
        fat: 'bg-[oklch(0.65_0.180_350)]',
        carbs: 'bg-[oklch(0.72_0.105_145)]',
    }[accent]
    return (
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-ink-200 bg-white py-2 text-center shadow-sm dark:border-ink-800 dark:bg-ink-900">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
                {label}
            </span>
            <span className="font-display text-lg font-black tabular-nums text-navy-900 dark:text-ink-50">
                {Math.round(value)}{suffix}
            </span>
            {target ? (
                <span className="text-[9px] font-medium tabular-nums text-ink-500">
                    of {target}{suffix}
                </span>
            ) : null}
        </div>
    )
}

function isoOffset(base: string, offset: number): string {
    const [y, m, d] = base.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + offset)
    const yy = dt.getUTCFullYear()
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(dt.getUTCDate()).padStart(2, '0')
    return `${yy}-${mm}-${dd}`
}

function formatLong(date: string): string {
    const [y, m, d] = date.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).format(dt)
}

function applicableGoal(
    date: string,
    goals: { effective_from: string; calorie_goal: number | null; protein_goal_g: number | null; fat_goal_g: number | null; carb_goal_g: number | null }[],
) {
    if (goals.length === 0) return null
    const cutoff = `${date}T23:59:59.999Z`
    const eligible = goals.filter((g) => g.effective_from <= cutoff)
    if (eligible.length === 0) return null
    return [...eligible].sort((a, b) => b.effective_from.localeCompare(a.effective_from))[0]
}
