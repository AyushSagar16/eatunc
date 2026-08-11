'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/providers/AuthProvider'
import { cn } from '@/lib/utils'
import {
    getDailyNutritionSummary,
    getWeeklySummaries,
    removeLogEntry,
    updateLogServings,
    clearAllLogs,
    type FoodLogEntry,
    type DailyNutritionSummary,
} from '@/lib/food-log'
import { motion, AnimatePresence } from 'motion/react'
import {
    CalendarDays,
    Flame,
    Beef,
    Wheat,
    Droplets,
    Trash2,
    Settings,
    TrendingUp,
    LogOut,
    Plus,
    Minus,
    UtensilsCrossed,
    ArrowLeft,
    AlertTriangle,
    Check,
    X,
    Clock,
    MapPin,
    ChevronRight,
    Sparkles,
    Target,
    Save,
    User,
} from 'lucide-react'

const CAROLINA_BLUE = '#4B9CD3'

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    })
}

function getTodayStr(): string {
    return new Date().toISOString().split('T')[0]
}

// --- Circular Progress Ring ---
function ProgressRing({
    value,
    max,
    color,
    label,
    unit,
    icon: Icon,
    delay = 0,
}: {
    value: number
    max: number
    color: string
    label: string
    unit: string
    icon: React.ComponentType<{ className?: string }>
    delay?: number
}) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    const radius = 54
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (pct / 100) * circumference

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-3"
        >
            <div className="relative w-32 h-32 sm:w-36 sm:h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        className="text-zinc-800/40"
                        strokeWidth="8"
                    />
                    <motion.circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.2, delay: delay + 0.3, ease: [0.22, 1, 0.36, 1] }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-5 h-5 mb-1" style={{ color }}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-white tabular-nums">
                        {Math.round(pct)}%
                    </span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
                <p className="text-sm text-zinc-300 tabular-nums mt-0.5">
                    <span className="font-semibold text-white">{value.toLocaleString()}</span>
                    <span className="text-zinc-500"> / {max.toLocaleString()} {unit}</span>
                </p>
            </div>
        </motion.div>
    )
}

// --- Food Log Entry Row ---
function FoodLogRow({
    entry,
    index,
    onDelete,
    onUpdateServings,
}: {
    entry: FoodLogEntry
    index: number
    onDelete: (id: string) => void
    onUpdateServings: (id: string, servings: number) => void
}) {
    const [isDeleting, setIsDeleting] = useState(false)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            className={cn(
                'group relative flex items-center gap-4 p-4 rounded-2xl',
                'bg-zinc-900/60 border border-zinc-800/60',
                'hover:bg-zinc-800/70 hover:border-zinc-700/60 transition-colors duration-200'
            )}
        >
            {/* Meal indicator bar */}
            <div
                className="w-1 h-12 rounded-full flex-shrink-0"
                style={{ backgroundColor: CAROLINA_BLUE }}
            />
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate text-sm sm:text-base">{entry.foodName}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(entry.loggedAt)}
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                        <UtensilsCrossed className="w-3 h-3" />
                        {entry.mealPeriod}
                    </span>
                    <span className="hidden sm:flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {entry.diningHall}
                    </span>
                </div>
            </div>

            {/* Nutrition quick facts */}
            <div className="hidden md:flex items-center gap-4 text-xs text-zinc-400 tabular-nums">
                <span>{((entry.caloriesKcal ?? 0) * entry.servings).toLocaleString()} cal</span>
                <span>{((entry.proteinG ?? 0) * entry.servings).toFixed(0)}g P</span>
            </div>

            {/* Servings adjuster */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                    onClick={() => entry.servings > 1 && onUpdateServings(entry.id, entry.servings - 1)}
                    disabled={entry.servings <= 1}
                    className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center',
                        'bg-zinc-800 border border-zinc-700 text-zinc-400',
                        'hover:bg-zinc-700 hover:text-white transition-colors',
                        'disabled:opacity-30 disabled:cursor-not-allowed'
                    )}
                >
                    <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-white tabular-nums">
                    {entry.servings}
                </span>
                <button
                    onClick={() => onUpdateServings(entry.id, entry.servings + 1)}
                    className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center',
                        'bg-zinc-800 border border-zinc-700 text-zinc-400',
                        'hover:bg-zinc-700 hover:text-white transition-colors'
                    )}
                >
                    <Plus className="w-3 h-3" />
                </button>
            </div>

            {/* Delete */}
            {isDeleting ? (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => { onDelete(entry.id); setIsDeleting(false) }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setIsDeleting(false)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsDeleting(true)}
                    className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                        'text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors'
                    )}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </motion.div>
    )
}

// --- Weekly Bar ---
function WeeklyBar({
    summary,
    maxCalories,
    isToday,
    dayLabel,
    index,
    goal,
}: {
    summary: DailyNutritionSummary
    maxCalories: number
    isToday: boolean
    dayLabel: string
    index: number
    goal: number
}) {
    const pct = maxCalories > 0 ? (summary.totalCalories / maxCalories) * 100 : 0
    const goalPct = maxCalories > 0 ? (goal / maxCalories) * 100 : 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            className="flex flex-col items-center gap-2 flex-1"
        >
            <span className="text-xs tabular-nums text-zinc-400 font-medium">
                {summary.totalCalories > 0 ? summary.totalCalories.toLocaleString() : '—'}
            </span>
            <div className="relative w-full h-32 sm:h-40 bg-zinc-900/60 rounded-xl overflow-hidden border border-zinc-800/40">
                {/* Goal line */}
                {goal > 0 && (
                    <div
                        className="absolute w-full border-t border-dashed border-zinc-600/50 z-10"
                        style={{ bottom: `${Math.min(goalPct, 100)}%` }}
                    />
                )}
                <motion.div
                    className="absolute bottom-0 w-full rounded-t-lg"
                    style={{
                        background: isToday
                            ? `linear-gradient(to top, ${CAROLINA_BLUE}, ${CAROLINA_BLUE}dd)`
                            : 'linear-gradient(to top, rgba(75, 156, 211, 0.3), rgba(75, 156, 211, 0.15))',
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                />
            </div>
            <span
                className={cn(
                    'text-xs font-bold uppercase tracking-wider',
                    isToday ? 'text-white' : 'text-zinc-500'
                )}
            >
                {dayLabel}
            </span>
        </motion.div>
    )
}

// ============================================================================
// MAIN DASHBOARD
// ============================================================================
export default function DashboardPage() {
    const router = useRouter()
    const { user, isLoading, signOut, updateProfile } = useAuth()

    const [refreshKey, setRefreshKey] = useState(0)

    // Goals editing
    const [editingGoals, setEditingGoals] = useState(false)
    const [goalCalories, setGoalCalories] = useState<number | null>(null)
    const [goalProtein, setGoalProtein] = useState<number | null>(null)
    const [goalCarbs, setGoalCarbs] = useState<number | null>(null)
    const [goalFat, setGoalFat] = useState<number | null>(null)
    const [editDisplayName, setEditDisplayName] = useState<string | null>(null)
    const [goalsSaved, setGoalsSaved] = useState(false)

    // Clear data
    const [confirmClear, setConfirmClear] = useState(false)

    // Derive goal values: use local edits if set, otherwise fall back to user profile
    const displayName = editDisplayName ?? user?.displayName ?? ''
    const currentGoalCalories = goalCalories ?? user?.calorieGoal ?? 2000
    const currentGoalProtein = goalProtein ?? user?.proteinGoal ?? 150
    const currentGoalCarbs = goalCarbs ?? user?.carbsGoal ?? 250
    const currentGoalFat = goalFat ?? user?.fatGoal ?? 65

    // Redirect
    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login')
        }
    }, [user, isLoading, router])

    // Compute data from food log (re-derived on refreshKey change)
    const todaySummary = useMemo(() => {
        if (!user) return null
        return getDailyNutritionSummary(user.id, getTodayStr())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, refreshKey])

    const weeklySummaries = useMemo(() => {
        if (!user) return []
        return getWeeklySummaries(user.id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, refreshKey])

    // Listen for food log events
    useEffect(() => {
        const handler = () => setRefreshKey(k => k + 1)
        window.addEventListener('foodLogUpdated', handler)
        return () => window.removeEventListener('foodLogUpdated', handler)
    }, [])

    const handleDelete = useCallback((id: string) => {
        removeLogEntry(id)
    }, [])

    const handleUpdateServings = useCallback((id: string, servings: number) => {
        updateLogServings(id, servings)
    }, [])

    const handleSaveGoals = useCallback(() => {
        updateProfile({
            displayName,
            calorieGoal: currentGoalCalories,
            proteinGoal: currentGoalProtein,
            carbsGoal: currentGoalCarbs,
            fatGoal: currentGoalFat,
        })
        // Reset local overrides so they re-derive from user
        setGoalCalories(null)
        setGoalProtein(null)
        setGoalCarbs(null)
        setGoalFat(null)
        setEditDisplayName(null)
        setGoalsSaved(true)
        setEditingGoals(false)
        setTimeout(() => setGoalsSaved(false), 2000)
    }, [displayName, currentGoalCalories, currentGoalProtein, currentGoalCarbs, currentGoalFat, updateProfile])

    const handleClearAll = useCallback(() => {
        if (!user) return
        clearAllLogs(user.id)
        setConfirmClear(false)
    }, [user])

    const weeklyAvg = useMemo(() => {
        const daysWithData = weeklySummaries.filter(s => s.totalCalories > 0)
        if (daysWithData.length === 0) return 0
        return Math.round(daysWithData.reduce((sum, s) => sum + s.totalCalories, 0) / daysWithData.length)
    }, [weeklySummaries])

    const weeklyMax = useMemo(() => {
        const maxFromData = Math.max(...weeklySummaries.map(s => s.totalCalories), 0)
        return Math.max(maxFromData, user?.calorieGoal ?? 2000) * 1.15
    }, [weeklySummaries, user?.calorieGoal])

    const dayLabels = useMemo(() => {
        return weeklySummaries.map(s => {
            const d = new Date(s.date + 'T12:00:00')
            return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)
        })
    }, [weeklySummaries])

    const todayStr = getTodayStr()

    // Loading / redirecting
    if (isLoading || !user) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-zinc-700 border-t-[#4B9CD3] rounded-full"
                />
            </div>
        )
    }

    const entries = todaySummary?.entries ?? []

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Atmospheric background */}
            <div className="fixed inset-0 pointer-events-none">
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-[0.07]"
                    style={{
                        background: `radial-gradient(ellipse, ${CAROLINA_BLUE}, transparent 70%)`,
                    }}
                />
                <div
                    className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.04]"
                    style={{
                        background: `radial-gradient(ellipse, ${CAROLINA_BLUE}, transparent 70%)`,
                    }}
                />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                {/* HEADER */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10"
                >
                    <div>
                        <Link
                            href="/today"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-[#4B9CD3] transition-colors mb-3"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Dining Menus
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            <span className="text-white">Hey, </span>
                            <span style={{ color: CAROLINA_BLUE }}>{user.displayName}</span>
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">{formatDate(new Date())}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/today"
                            className={cn(
                                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
                                'bg-[#4B9CD3]/10 text-[#4B9CD3] border border-[#4B9CD3]/20',
                                'hover:bg-[#4B9CD3]/20 transition-colors'
                            )}
                        >
                            <UtensilsCrossed className="w-4 h-4" />
                            <span className="hidden sm:inline">Log Food</span>
                        </Link>
                        <button
                            onClick={signOut}
                            className={cn(
                                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
                                'bg-zinc-900 text-zinc-400 border border-zinc-800',
                                'hover:bg-zinc-800 hover:text-white transition-colors'
                            )}
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </motion.header>

                {/* SECTION 1: TODAY'S SUMMARY */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={cn(
                        'rounded-3xl p-6 sm:p-8 mb-8',
                        'bg-gradient-to-br from-zinc-900/80 to-zinc-900/40',
                        'border border-zinc-800/60 backdrop-blur-sm'
                    )}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${CAROLINA_BLUE}20` }}>
                            <Sparkles className="w-5 h-5" style={{ color: CAROLINA_BLUE }} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Today&apos;s Nutrition</h2>
                            <p className="text-xs text-zinc-500">{entries.length} item{entries.length !== 1 ? 's' : ''} logged</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
                        <ProgressRing
                            value={todaySummary?.totalCalories ?? 0}
                            max={currentGoalCalories}
                            color={CAROLINA_BLUE}
                            label="Calories"
                            unit="kcal"
                            icon={Flame}
                            delay={0.15}
                        />
                        <ProgressRing
                            value={Math.round(todaySummary?.totalProtein ?? 0)}
                            max={currentGoalProtein}
                            color="#10b981"
                            label="Protein"
                            unit="g"
                            icon={Beef}
                            delay={0.25}
                        />
                        <ProgressRing
                            value={Math.round(todaySummary?.totalCarbs ?? 0)}
                            max={currentGoalCarbs}
                            color="#f59e0b"
                            label="Carbs"
                            unit="g"
                            icon={Wheat}
                            delay={0.35}
                        />
                        <ProgressRing
                            value={Math.round(todaySummary?.totalFat ?? 0)}
                            max={currentGoalFat}
                            color="#f43f5e"
                            label="Fat"
                            unit="g"
                            icon={Droplets}
                            delay={0.45}
                        />
                    </div>
                </motion.section>

                {/* TWO-COLUMN LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
                    {/* SECTION 2: TODAY'S FOOD LOG */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-3"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800/80">
                                <CalendarDays className="w-4 h-4 text-zinc-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Today&apos;s Food Log</h2>
                        </div>

                        <div className="space-y-2">
                            <AnimatePresence mode="popLayout">
                                {entries.length === 0 ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={cn(
                                            'flex flex-col items-center justify-center py-16 rounded-2xl',
                                            'bg-zinc-900/40 border border-zinc-800/40 border-dashed'
                                        )}
                                    >
                                        <UtensilsCrossed className="w-10 h-10 text-zinc-700 mb-4" />
                                        <p className="text-zinc-500 text-sm font-medium mb-1">No meals logged yet today</p>
                                        <p className="text-zinc-600 text-xs mb-4">Visit a dining hall menu to start logging!</p>
                                        <Link
                                            href="/today"
                                            className={cn(
                                                'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold',
                                                'bg-[#4B9CD3]/10 text-[#4B9CD3] border border-[#4B9CD3]/20',
                                                'hover:bg-[#4B9CD3]/20 transition-colors'
                                            )}
                                        >
                                            Browse Menus
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </motion.div>
                                ) : (
                                    entries.map((entry, i) => (
                                        <FoodLogRow
                                            key={entry.id}
                                            entry={entry}
                                            index={i}
                                            onDelete={handleDelete}
                                            onUpdateServings={handleUpdateServings}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.section>

                    {/* SECTION 3: WEEKLY OVERVIEW */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="lg:col-span-2"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800/80">
                                <TrendingUp className="w-4 h-4 text-zinc-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Weekly Overview</h2>
                        </div>

                        <div
                            className={cn(
                                'rounded-2xl p-5 sm:p-6',
                                'bg-zinc-900/60 border border-zinc-800/60'
                            )}
                        >
                            <div className="flex items-baseline justify-between mb-5">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Avg. Daily</p>
                                    <p className="text-2xl font-bold text-white tabular-nums">{weeklyAvg.toLocaleString()}<span className="text-sm text-zinc-500 ml-1">kcal</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Goal</p>
                                    <p className="text-sm font-semibold text-zinc-400 tabular-nums">{currentGoalCalories.toLocaleString()} kcal</p>
                                </div>
                            </div>

                            <div className="flex gap-1.5 sm:gap-2">
                                {weeklySummaries.map((summary, i) => (
                                    <WeeklyBar
                                        key={summary.date}
                                        summary={summary}
                                        maxCalories={weeklyMax}
                                        isToday={summary.date === todayStr}
                                        dayLabel={dayLabels[i]}
                                        index={i}
                                        goal={currentGoalCalories}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.section>
                </div>

                {/* SECTION 4: GOALS & SETTINGS */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mb-16"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800/80">
                            <Settings className="w-4 h-4 text-zinc-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Goals & Settings</h2>
                        {goalsSaved && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full"
                            >
                                <Check className="w-3 h-3" /> Saved
                            </motion.span>
                        )}
                    </div>

                    <div
                        className={cn(
                            'rounded-2xl p-5 sm:p-6',
                            'bg-zinc-900/60 border border-zinc-800/60'
                        )}
                    >
                        {!editingGoals ? (
                            <div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                                    <div className="sm:col-span-1">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Name</p>
                                        <p className="text-sm font-semibold text-white">{user.displayName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Calories</p>
                                        <p className="text-sm font-semibold text-white tabular-nums">{user.calorieGoal.toLocaleString()} <span className="text-zinc-500 font-normal">kcal</span></p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Protein</p>
                                        <p className="text-sm font-semibold text-white tabular-nums">{user.proteinGoal}g</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Carbs</p>
                                        <p className="text-sm font-semibold text-white tabular-nums">{user.carbsGoal}g</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Fat</p>
                                        <p className="text-sm font-semibold text-white tabular-nums">{user.fatGoal}g</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setEditingGoals(true)}
                                        className={cn(
                                            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
                                            'bg-zinc-800 text-zinc-300 border border-zinc-700',
                                            'hover:bg-zinc-700 hover:text-white transition-colors'
                                        )}
                                    >
                                        <Target className="w-4 h-4" />
                                        Edit Goals
                                    </button>
                                    {!confirmClear ? (
                                        <button
                                            onClick={() => setConfirmClear(true)}
                                            className={cn(
                                                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
                                                'bg-red-950/30 text-red-400 border border-red-900/30',
                                                'hover:bg-red-950/50 transition-colors'
                                            )}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Clear All Data
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-red-400 flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                Are you sure?
                                            </span>
                                            <button
                                                onClick={handleClearAll}
                                                className="px-3 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition-colors"
                                            >
                                                Yes, Delete
                                            </button>
                                            <button
                                                onClick={() => setConfirmClear(false)}
                                                className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                                    <div className="sm:col-span-2 lg:col-span-1">
                                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5 block">
                                            <User className="w-3 h-3 inline mr-1" />
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={e => setEditDisplayName(e.target.value)}
                                            className={cn(
                                                'w-full px-3 py-2.5 rounded-xl text-sm font-semibold',
                                                'bg-zinc-800 text-white border border-zinc-700',
                                                'focus:outline-none focus:border-[#4B9CD3] focus:ring-1 focus:ring-[#4B9CD3]/30',
                                                'transition-colors'
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5 block">
                                            <Flame className="w-3 h-3 inline mr-1" />
                                            Calories
                                        </label>
                                        <input
                                            type="number"
                                            value={currentGoalCalories}
                                            onChange={e => setGoalCalories(Number(e.target.value))}
                                            className={cn(
                                                'w-full px-3 py-2.5 rounded-xl text-sm font-semibold tabular-nums',
                                                'bg-zinc-800 text-white border border-zinc-700',
                                                'focus:outline-none focus:border-[#4B9CD3] focus:ring-1 focus:ring-[#4B9CD3]/30',
                                                'transition-colors'
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5 block">
                                            <Beef className="w-3 h-3 inline mr-1" />
                                            Protein (g)
                                        </label>
                                        <input
                                            type="number"
                                            value={currentGoalProtein}
                                            onChange={e => setGoalProtein(Number(e.target.value))}
                                            className={cn(
                                                'w-full px-3 py-2.5 rounded-xl text-sm font-semibold tabular-nums',
                                                'bg-zinc-800 text-white border border-zinc-700',
                                                'focus:outline-none focus:border-[#4B9CD3] focus:ring-1 focus:ring-[#4B9CD3]/30',
                                                'transition-colors'
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5 block">
                                            <Wheat className="w-3 h-3 inline mr-1" />
                                            Carbs (g)
                                        </label>
                                        <input
                                            type="number"
                                            value={currentGoalCarbs}
                                            onChange={e => setGoalCarbs(Number(e.target.value))}
                                            className={cn(
                                                'w-full px-3 py-2.5 rounded-xl text-sm font-semibold tabular-nums',
                                                'bg-zinc-800 text-white border border-zinc-700',
                                                'focus:outline-none focus:border-[#4B9CD3] focus:ring-1 focus:ring-[#4B9CD3]/30',
                                                'transition-colors'
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5 block">
                                            <Droplets className="w-3 h-3 inline mr-1" />
                                            Fat (g)
                                        </label>
                                        <input
                                            type="number"
                                            value={currentGoalFat}
                                            onChange={e => setGoalFat(Number(e.target.value))}
                                            className={cn(
                                                'w-full px-3 py-2.5 rounded-xl text-sm font-semibold tabular-nums',
                                                'bg-zinc-800 text-white border border-zinc-700',
                                                'focus:outline-none focus:border-[#4B9CD3] focus:ring-1 focus:ring-[#4B9CD3]/30',
                                                'transition-colors'
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleSaveGoals}
                                        className={cn(
                                            'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold',
                                            'text-white transition-colors'
                                        )}
                                        style={{ backgroundColor: CAROLINA_BLUE }}
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingGoals(false)
                                            setGoalCalories(null)
                                            setGoalProtein(null)
                                            setGoalCarbs(null)
                                            setGoalFat(null)
                                            setEditDisplayName(null)
                                        }}
                                        className={cn(
                                            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
                                            'bg-zinc-800 text-zinc-400 border border-zinc-700',
                                            'hover:bg-zinc-700 hover:text-white transition-colors'
                                        )}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.section>
            </div>
        </div>
    )
}
