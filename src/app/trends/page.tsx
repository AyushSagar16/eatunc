'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    BarChart,
    Bar,
    CartesianGrid,
    Legend,
} from 'recharts'
import { motion } from 'motion/react'
import { Flame, TrendingUp, MapPin, Sparkles } from 'lucide-react'
import { db, getDeviceId, getDiningDate } from '@/lib/dexie'
import {
    dailyTotals,
    fillMissingDays,
    applicableGoal,
    computeStreaks,
    hallSplit,
    topFoods,
    averagePerMeal,
} from '@/lib/insights'
import SubNav from '@/components/SubNav'

export default function TrendsPage() {
    const [today, setToday] = useState<string>('')
    const [deviceId, setDeviceId] = useState<string>('')
    const [range, setRange] = useState<7 | 14 | 30>(7)

    useEffect(() => {
        setToday(getDiningDate())
        setDeviceId(getDeviceId())
    }, [])

    const logsInRange = useLiveQuery(
        async () => {
            if (!today || !deviceId) return []
            const start = isoOffset(today, -(range - 1))
            return db.meal_logs
                .where('device_id')
                .equals(deviceId)
                .filter((l) => l.logged_date >= start && l.logged_date <= today)
                .toArray()
        },
        [today, deviceId, range],
        [],
    )

    const goalsAll = useLiveQuery(
        async () => {
            if (!deviceId) return []
            return db.user_goals.where('device_id').equals(deviceId).toArray()
        },
        [deviceId],
        [],
    )

    const data = useMemo(() => {
        if (!today) return []
        const start = isoOffset(today, -(range - 1))
        const totals = dailyTotals(logsInRange ?? [])
        const filled = fillMissingDays(totals, start, today)
        return filled.map((d) => {
            const g = applicableGoal(d.date, goalsAll ?? [])
            return {
                ...d,
                date: shortDay(d.date),
                rawDate: d.date,
                goal: g?.calorie_goal ?? null,
            }
        })
    }, [logsInRange, goalsAll, today, range])

    const streaks = useMemo(
        () => computeStreaks(dailyTotals(logsInRange ?? []), goalsAll ?? []),
        [logsInRange, goalsAll],
    )

    const split = useMemo(() => hallSplit(logsInRange ?? []), [logsInRange])
    const top = useMemo(() => topFoods(logsInRange ?? [], 5), [logsInRange])

    const lunchAvg = useMemo(
        () => averagePerMeal(logsInRange ?? [], 'lunch'),
        [logsInRange],
    )
    const dinnerAvg = useMemo(
        () => averagePerMeal(logsInRange ?? [], 'dinner'),
        [logsInRange],
    )

    const hasData = (logsInRange ?? []).length > 0

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 pb-32 pt-6 sm:px-6 sm:pt-12">
            <header className="flex flex-col items-center gap-4">
                <SubNav />
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                        Last {range} days
                    </p>
                    <h1 className="mt-1 font-display text-4xl font-black tracking-tight text-navy-900 dark:text-ink-50 sm:text-5xl">
                        Trends
                    </h1>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-ink-200 bg-white p-1 shadow-sm dark:border-ink-800 dark:bg-ink-900">
                    {[7, 14, 30].map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRange(r as 7 | 14 | 30)}
                            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                                range === r
                                    ? 'bg-navy-900 text-white dark:bg-carolina-500 dark:text-navy-900'
                                    : 'text-ink-600 hover:text-navy-900 dark:text-ink-300 dark:hover:text-ink-50'
                            }`}
                        >
                            {r}d
                        </button>
                    ))}
                </div>
            </header>

            {!hasData && (
                <div className="rounded-3xl border border-dashed border-ink-300 px-6 py-12 text-center text-sm text-ink-500 dark:border-ink-700">
                    Once you have a few days of logs, trends and insights will appear here.
                </div>
            )}

            {/* Calories line chart */}
            <ChartCard title="Calories per day" subtitle="vs your daily target">
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="2 4" stroke="var(--color-ink-200)" />
                        <XAxis
                            dataKey="date"
                            stroke="var(--color-ink-500)"
                            tick={{ fontSize: 10, fontWeight: 600 }}
                        />
                        <YAxis
                            stroke="var(--color-ink-500)"
                            tick={{ fontSize: 10, fontWeight: 600 }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--color-popover)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 12,
                                fontSize: 12,
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="calories"
                            stroke="var(--color-carolina-500)"
                            strokeWidth={3}
                            dot={{ r: 4, fill: 'var(--color-carolina-500)' }}
                            activeDot={{ r: 6 }}
                            isAnimationActive
                        />
                        {data.some((d) => d.goal) && (
                            <ReferenceLine
                                y={data.find((d) => d.goal)?.goal ?? 0}
                                stroke="var(--color-navy-900)"
                                strokeDasharray="4 4"
                                label={{
                                    value: 'goal',
                                    fill: 'var(--color-navy-900)',
                                    fontSize: 10,
                                    fontWeight: 600,
                                    position: 'right',
                                }}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Macro composition */}
            <ChartCard title="Macros per day" subtitle="grams of protein, fat, carbs">
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="2 4" stroke="var(--color-ink-200)" />
                        <XAxis
                            dataKey="date"
                            stroke="var(--color-ink-500)"
                            tick={{ fontSize: 10, fontWeight: 600 }}
                        />
                        <YAxis
                            stroke="var(--color-ink-500)"
                            tick={{ fontSize: 10, fontWeight: 600 }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--color-popover)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 12,
                                fontSize: 12,
                            }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: 10, fontWeight: 600 }}
                            iconType="circle"
                        />
                        <Bar dataKey="protein" stackId="m" fill="oklch(0.74 0.135 55)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="fat" stackId="m" fill="oklch(0.65 0.180 350)" />
                        <Bar dataKey="carbs" stackId="m" fill="oklch(0.72 0.105 145)" radius={[0, 0, 4, 4]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Insights */}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {streaks.map((s) => (
                    <InsightCard key={s.name} icon={Flame} title={`${s.days}d ${s.name}`} body={s.description} accent="carolina" />
                ))}
                {(split.chase + split.lenoir + split.custom) > 0 && (
                    <InsightCard
                        icon={MapPin}
                        title="Hall split"
                        body={`Chase ${pct(split.chase, split.chase + split.lenoir + split.custom)}% · Lenoir ${pct(split.lenoir, split.chase + split.lenoir + split.custom)}% · Custom ${pct(split.custom, split.chase + split.lenoir + split.custom)}%`}
                        accent="navy"
                    />
                )}
                {lunchAvg > 0 && (
                    <InsightCard
                        icon={TrendingUp}
                        title={`Avg lunch · ${Math.round(lunchAvg)} kcal`}
                        body="Across the days you logged lunch."
                        accent="carolina"
                    />
                )}
                {dinnerAvg > 0 && (
                    <InsightCard
                        icon={TrendingUp}
                        title={`Avg dinner · ${Math.round(dinnerAvg)} kcal`}
                        body="Across the days you logged dinner."
                        accent="navy"
                    />
                )}
            </section>

            {/* Top foods */}
            {top.length > 0 && (
                <section className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900">
                    <header className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-carolina-500" />
                        <h3 className="font-display text-base font-black tracking-tight text-navy-900 dark:text-ink-50">
                            Most logged
                        </h3>
                    </header>
                    <ol className="flex flex-col gap-2">
                        {top.map((t, idx) => (
                            <li
                                key={t.name}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 dark:border-ink-800 dark:bg-ink-900/40"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold text-white tabular-nums dark:bg-carolina-500 dark:text-navy-900">
                                        {idx + 1}
                                    </span>
                                    <span className="truncate text-sm font-semibold text-navy-900 dark:text-ink-50">
                                        {t.name}
                                    </span>
                                </div>
                                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">
                                    {t.count}× · {Math.round(t.totalCalories)} kcal
                                </span>
                            </li>
                        ))}
                    </ol>
                </section>
            )}
        </main>
    )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-ink-200 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900"
        >
            <header className="mb-4">
                <h3 className="font-display text-base font-black tracking-tight text-navy-900 dark:text-ink-50">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                        {subtitle}
                    </p>
                )}
            </header>
            {children}
        </motion.section>
    )
}

function InsightCard({
    icon: Icon,
    title,
    body,
    accent,
}: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    body: string
    accent: 'carolina' | 'navy'
}) {
    const tones =
        accent === 'carolina'
            ? 'border-carolina-200 bg-gradient-to-br from-carolina-50 to-white dark:border-carolina-900/40 dark:from-carolina-950/30 dark:to-ink-900'
            : 'border-navy-200 bg-gradient-to-br from-navy-50 to-white dark:border-navy-800 dark:from-navy-900/40 dark:to-ink-900'
    return (
        <article className={`flex flex-col gap-2 rounded-3xl border p-5 ${tones}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-navy-900 shadow-sm dark:bg-ink-900 dark:text-carolina-300">
                <Icon className="h-4 w-4" />
            </div>
            <h4 className="font-display text-base font-black tracking-tight text-navy-900 dark:text-ink-50">
                {title}
            </h4>
            <p className="text-xs font-medium text-ink-600 dark:text-ink-300">{body}</p>
        </article>
    )
}

function pct(part: number, total: number): number {
    if (total === 0) return 0
    return Math.round((part / total) * 100)
}

function shortDay(date: string): string {
    const [y, m, d] = date.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        month: 'numeric',
        day: 'numeric',
    }).format(dt)
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
