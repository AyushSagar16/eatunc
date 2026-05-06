'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Plus, Sparkles, ArrowRight, Settings2 } from 'lucide-react'
import {
    db,
    getDeviceId,
    getDiningDate,
    sumLogs,
    getLogsForDate,
    getActiveGoal,
} from '@/lib/dexie'
import ProgressRings from '@/components/ProgressRings'
import MealList from '@/components/MealList'
import CustomItemSheet from '@/components/CustomItemSheet'
import OnboardingWizard from '@/components/OnboardingWizard'
import SubNav from '@/components/SubNav'
import { Button } from '@/components/ui/button'

const DAY_MS = 24 * 60 * 60 * 1000

function isoDateOffset(base: string, offsetDays: number): string {
    const [y, m, d] = base.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + offsetDays)
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

function greeting(date: Date): string {
    const h = parseInt(
        new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            hour: 'numeric',
            hour12: false,
        }).format(date),
        10,
    )
    if (h < 5) return 'Late night, friend'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    if (h < 21) return 'Good evening'
    return 'Late night, friend'
}

export default function LogPage() {
    const [today, setToday] = useState<string>('')
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [showCustom, setShowCustom] = useState(false)
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [deviceId, setDeviceId] = useState<string>('')

    useEffect(() => {
        const td = getDiningDate()
        setToday(td)
        setSelectedDate(td)
        setDeviceId(getDeviceId())
    }, [])

    const logs = useLiveQuery(
        async () => {
            if (!selectedDate || !deviceId) return []
            return getLogsForDate(selectedDate, null, deviceId)
        },
        [selectedDate, deviceId],
        [],
    )

    const goal = useLiveQuery(
        async () => {
            if (!selectedDate || !deviceId) return null
            const g = await getActiveGoal(selectedDate, null, deviceId)
            return g ?? null
        },
        [selectedDate, deviceId],
        null,
    )

    const totals = useMemo(() => sumLogs(logs ?? []), [logs])

    const isToday = selectedDate === today
    const isFuture = selectedDate > today

    const remaining = goal?.calorie_goal ? goal.calorie_goal - totals.calories : null

    const callout = useMemo(() => {
        if (!goal?.calorie_goal) return 'Set a goal to see your day shape up.'
        if (logs && logs.length === 0) return 'Empty plate. Browse a hall to start logging.'
        if (remaining != null && remaining > 0) return `${Math.round(remaining)} kcal to your goal.`
        if (remaining != null && remaining <= 0) return `${Math.abs(Math.round(remaining))} kcal over your goal.`
        return ''
    }, [goal, logs, remaining])

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 pb-32 pt-6 sm:px-6 sm:pt-12">
            <div className="flex justify-center">
                <SubNav />
            </div>
            <header className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                    {selectedDate && (isToday ? greeting(new Date()) : 'Reviewing')}
                </p>
                <h1 className="font-display text-4xl font-black tracking-tight text-navy-900 dark:text-ink-50 sm:text-5xl">
                    {selectedDate ? formatLong(selectedDate) : ' '}
                </h1>
            </header>

            {/* Date nav */}
            {selectedDate && (
                <div className="flex items-center justify-between gap-3 rounded-full border border-ink-200 bg-white px-2 py-1 shadow-sm dark:border-ink-800 dark:bg-ink-900">
                    <button
                        type="button"
                        aria-label="Previous day"
                        onClick={() => setSelectedDate(isoDateOffset(selectedDate, -1))}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                        {isToday ? 'Today' : isFuture ? 'Upcoming' : 'Past day'}
                    </span>
                    <button
                        type="button"
                        aria-label="Next day"
                        disabled={isToday}
                        onClick={() => setSelectedDate(isoDateOffset(selectedDate, 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 enabled:hover:bg-ink-100 disabled:opacity-30 dark:text-ink-200 dark:enabled:hover:bg-ink-800"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Hero rings */}
            <motion.section
                key={selectedDate}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-3xl border border-ink-200 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8"
            >
                <div
                    className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-carolina-500/10 blur-3xl"
                    aria-hidden="true"
                />
                <div className="relative flex flex-col items-center gap-4">
                    <ProgressRings
                        size="lg"
                        values={{
                            calories: totals.calories,
                            protein: totals.protein,
                            fat: totals.fat,
                            carbs: totals.carbs,
                        }}
                        goal={
                            goal
                                ? {
                                    calorie_goal: goal.calorie_goal,
                                    protein_goal_g: goal.protein_goal_g,
                                    fat_goal_g: goal.fat_goal_g,
                                    carb_goal_g: goal.carb_goal_g,
                                }
                                : null
                        }
                    />
                    {callout && (
                        <p className="max-w-md text-center text-sm font-medium text-ink-600 dark:text-ink-300">
                            {callout}
                        </p>
                    )}
                    {!goal && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowOnboarding(true)}
                            className="border-carolina-300 text-carolina-700 hover:border-carolina-500 hover:bg-carolina-50 hover:text-carolina-900 dark:border-carolina-700 dark:text-carolina-300 dark:hover:bg-carolina-950/40"
                        >
                            <Settings2 className="h-4 w-4" />
                            Set daily goals
                        </Button>
                    )}
                </div>
            </motion.section>

            {/* Quick add row */}
            {today && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <QuickLink
                        href={`/chase/${today}`}
                        title="Chase"
                        sub="Browse menu"
                        accent="carolina"
                    />
                    <QuickLink
                        href={`/lenoir/${today}`}
                        title="Top of Lenoir"
                        sub="Browse menu"
                        accent="navy"
                    />
                    <button
                        type="button"
                        onClick={() => setShowCustom(true)}
                        className="flex flex-col items-start gap-1 rounded-2xl border border-dashed border-ink-300 bg-white px-4 py-4 text-left transition-colors hover:border-carolina-500 hover:bg-carolina-50/40 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-carolina-400 dark:hover:bg-carolina-950/30"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-carolina-100 text-carolina-700 dark:bg-carolina-900/40 dark:text-carolina-300">
                            <Plus className="h-4 w-4" />
                        </span>
                        <span className="font-display text-base font-black text-navy-900 dark:text-ink-50">
                            Custom
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                            Off-campus
                        </span>
                    </button>
                </div>
            )}

            {/* Logged items grouped by period */}
            <section className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-2xl font-black tracking-tight text-navy-900 dark:text-ink-50">
                        Today&apos;s plate
                    </h2>
                    {logs && logs.length > 0 && (
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                            {logs.length} item{logs.length === 1 ? '' : 's'}
                        </p>
                    )}
                </div>
                <MealList
                    logs={logs ?? []}
                    emptyHall="chase"
                    emptyDate={selectedDate}
                    showAddCustom={() => setShowCustom(true)}
                />
            </section>

            <CustomItemSheet open={showCustom} onOpenChange={setShowCustom} />
            <OnboardingWizard open={showOnboarding} onOpenChange={setShowOnboarding} />
        </main>
    )
}

interface QuickLinkProps {
    href: string
    title: string
    sub: string
    accent: 'carolina' | 'navy'
}

function QuickLink({ href, title, sub, accent }: QuickLinkProps) {
    const tones =
        accent === 'carolina'
            ? 'border-carolina-200 bg-carolina-50 text-navy-900 hover:border-carolina-500 dark:border-carolina-900/40 dark:bg-carolina-950/30 dark:text-ink-50'
            : 'border-navy-200 bg-navy-50 text-navy-900 hover:border-navy-500 dark:border-navy-800 dark:bg-navy-900/30 dark:text-ink-50'
    return (
        <Link
            href={href}
            className={`flex flex-col items-start gap-1 rounded-2xl border px-4 py-4 transition-colors ${tones}`}
        >
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${accent === 'carolina' ? 'bg-carolina-500 text-white' : 'bg-navy-900 text-white'}`}>
                <ArrowRight className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-black tracking-tight">
                {title}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                {sub}
            </span>
        </Link>
    )
}
