'use client'

import React, { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { Download, Trash2, Target, Database } from 'lucide-react'
import { db, getDeviceId, getDiningDate, getActiveGoal } from '@/lib/dexie'
import { setGoal } from '@/lib/actions/goals'
import SubNav from '@/components/SubNav'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

const KCAL_BOUNDS = { min: 1200, max: 4000, step: 50 }
const PROTEIN_BOUNDS = { min: 40, max: 250, step: 5 }
const FAT_BOUNDS = { min: 20, max: 150, step: 5 }
const CARBS_BOUNDS = { min: 80, max: 500, step: 10 }

export default function ProfilePage() {
    const [deviceId, setDeviceId] = useState('')
    const [today, setToday] = useState('')
    const [confirmClear, setConfirmClear] = useState(false)
    const [busy, setBusy] = useState(false)

    const [kcal, setKcal] = useState<number | null>(null)
    const [protein, setProtein] = useState<number | null>(null)
    const [fat, setFat] = useState<number | null>(null)
    const [carbs, setCarbs] = useState<number | null>(null)
    const [dirty, setDirty] = useState(false)

    useEffect(() => {
        setDeviceId(getDeviceId())
        setToday(getDiningDate())
    }, [])

    const currentGoal = useLiveQuery(
        async () => {
            if (!deviceId || !today) return null
            const g = await getActiveGoal(today, null, deviceId)
            return g ?? null
        },
        [deviceId, today],
        null,
    )

    useEffect(() => {
        if (currentGoal) {
            setKcal(currentGoal.calorie_goal)
            setProtein(currentGoal.protein_goal_g)
            setFat(currentGoal.fat_goal_g)
            setCarbs(currentGoal.carb_goal_g)
        }
    }, [currentGoal])

    const logCount = useLiveQuery(
        async () => {
            if (!deviceId) return 0
            return db.meal_logs.where('device_id').equals(deviceId).count()
        },
        [deviceId],
        0,
    )

    const customCount = useLiveQuery(
        async () => {
            if (!deviceId) return 0
            return db.custom_foods.where('device_id').equals(deviceId).count()
        },
        [deviceId],
        0,
    )

    const handleSaveGoal = async () => {
        setBusy(true)
        try {
            await setGoal({
                calorie_goal: kcal,
                protein_goal_g: protein,
                fat_goal_g: fat,
                carb_goal_g: carbs,
            })
            toast.success('Goals updated')
            setDirty(false)
        } catch (err) {
            toast.error('Could not save', { description: err instanceof Error ? err.message : '' })
        } finally {
            setBusy(false)
        }
    }

    const handleExport = async () => {
        setBusy(true)
        try {
            const meal_logs = await db.meal_logs.toArray()
            const custom_foods = await db.custom_foods.toArray()
            const user_goals = await db.user_goals.toArray()
            const dump = {
                exported_at: new Date().toISOString(),
                device_id: deviceId,
                version: 1,
                meal_logs,
                custom_foods,
                user_goals,
            }
            const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `eatunc-export-${today}.json`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Exported', { description: `${meal_logs.length} logs · ${custom_foods.length} customs · ${user_goals.length} goals` })
        } catch (err) {
            toast.error('Export failed', { description: err instanceof Error ? err.message : '' })
        } finally {
            setBusy(false)
        }
    }

    const handleClearAll = async () => {
        setBusy(true)
        try {
            await Promise.all([
                db.meal_logs.clear(),
                db.custom_foods.clear(),
                db.user_goals.clear(),
            ])
            toast.success('All local data cleared')
            setConfirmClear(false)
            setKcal(null)
            setProtein(null)
            setFat(null)
            setCarbs(null)
        } catch (err) {
            toast.error('Could not clear', { description: err instanceof Error ? err.message : '' })
        } finally {
            setBusy(false)
        }
    }

    const updateKcal = (v: number) => { setKcal(v); setDirty(true) }
    const updateProtein = (v: number) => { setProtein(v); setDirty(true) }
    const updateFat = (v: number) => { setFat(v); setDirty(true) }
    const updateCarbs = (v: number) => { setCarbs(v); setDirty(true) }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 pb-32 pt-6 sm:px-6 sm:pt-12">
            <div className="flex justify-center">
                <SubNav />
            </div>

            <header className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">Profile</p>
                <h1 className="mt-1 font-display text-4xl font-black tracking-tight text-navy-900 dark:text-ink-50 sm:text-5xl">
                    Your Eat UNC
                </h1>
            </header>

            <section className="rounded-3xl border border-ink-200 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-carolina-100 text-carolina-700 dark:bg-carolina-900/40 dark:text-carolina-300">
                        <Target className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="font-display text-xl font-black tracking-tight text-navy-900 dark:text-ink-50">
                            Daily goals
                        </h2>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                            {currentGoal ? 'Edit your targets' : 'Not set yet'}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4">
                    <GoalRow
                        label="Calories"
                        suffix="kcal"
                        accent="kcal"
                        value={kcal ?? KCAL_BOUNDS.min}
                        onChange={updateKcal}
                        bounds={KCAL_BOUNDS}
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                        <GoalRow
                            label="Protein"
                            suffix="g"
                            accent="protein"
                            value={protein ?? PROTEIN_BOUNDS.min}
                            onChange={updateProtein}
                            bounds={PROTEIN_BOUNDS}
                            compact
                        />
                        <GoalRow
                            label="Fat"
                            suffix="g"
                            accent="fat"
                            value={fat ?? FAT_BOUNDS.min}
                            onChange={updateFat}
                            bounds={FAT_BOUNDS}
                            compact
                        />
                        <GoalRow
                            label="Carbs"
                            suffix="g"
                            accent="carbs"
                            value={carbs ?? CARBS_BOUNDS.min}
                            onChange={updateCarbs}
                            bounds={CARBS_BOUNDS}
                            compact
                        />
                    </div>

                    <div className="mt-2 flex items-center justify-end">
                        <Button
                            onClick={handleSaveGoal}
                            disabled={!dirty || busy}
                            className="bg-navy-900 text-white hover:bg-navy-800 dark:bg-carolina-500 dark:text-navy-900 dark:hover:bg-carolina-400"
                        >
                            {busy ? 'Saving…' : dirty ? 'Save goals' : 'Up to date'}
                        </Button>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-ink-200 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-navy-900 dark:bg-navy-900 dark:text-carolina-300">
                        <Database className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="font-display text-xl font-black tracking-tight text-navy-900 dark:text-ink-50">
                            Your data
                        </h2>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                            Local-first · stays on this device
                        </p>
                    </div>
                </div>

                <dl className="mb-5 grid grid-cols-3 gap-3">
                    <DataStat label="Meal logs" value={logCount ?? 0} />
                    <DataStat label="Custom foods" value={customCount ?? 0} />
                    <DataStat label="Goals" value={currentGoal ? 1 : 0} />
                </dl>

                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={handleExport} variant="outline" disabled={busy}>
                        <Download className="h-4 w-4" />
                        Export JSON
                    </Button>
                    <Button
                        onClick={() => setConfirmClear(true)}
                        variant="outline"
                        disabled={busy}
                        className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear all
                    </Button>
                </div>
            </section>

            <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-display text-xl font-black tracking-tight text-navy-900 dark:text-ink-50">
                            Delete all your data?
                        </DialogTitle>
                        <DialogDescription className="text-sm text-ink-600 dark:text-ink-300">
                            This deletes every meal log, custom food, and goal stored on this device. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button variant="outline" onClick={() => setConfirmClear(false)} disabled={busy}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleClearAll}
                            disabled={busy}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            {busy ? 'Deleting…' : 'Delete everything'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    )
}

interface GoalRowProps {
    label: string
    suffix: string
    accent: 'kcal' | 'protein' | 'fat' | 'carbs'
    value: number
    onChange: (n: number) => void
    bounds: { min: number; max: number; step: number }
    compact?: boolean
}

function GoalRow({ label, suffix, accent, value, onChange, bounds, compact }: GoalRowProps) {
    const dot = {
        kcal: 'bg-carolina-500',
        protein: 'bg-[oklch(0.74_0.135_55)]',
        fat: 'bg-[oklch(0.65_0.180_350)]',
        carbs: 'bg-[oklch(0.72_0.105_145)]',
    }[accent]
    return (
        <div className={`grid gap-2 rounded-2xl border border-ink-200 bg-ink-50 p-3 dark:border-ink-800 dark:bg-ink-900/40 ${compact ? '' : 'gap-3 p-4'}`}>
            <div className="flex items-center justify-between gap-2">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                    <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
                    {label}
                </Label>
                <span className={`font-display font-black tabular-nums text-navy-900 dark:text-ink-50 ${compact ? 'text-base' : 'text-2xl'}`}>
                    {value}
                    <span className={`ml-0.5 font-medium uppercase tracking-[0.1em] text-ink-500 ${compact ? 'text-[9px]' : 'text-xs'}`}>{suffix}</span>
                </span>
            </div>
            <Slider
                value={[value]}
                min={bounds.min}
                max={bounds.max}
                step={bounds.step}
                onValueChange={(v) => onChange(v[0] ?? value)}
            />
        </div>
    )
}

function DataStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-ink-100 bg-ink-50 py-3 text-center dark:border-ink-800 dark:bg-ink-900/40">
            <span className="font-display text-2xl font-black tabular-nums text-navy-900 dark:text-ink-50">
                {value}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                {label}
            </span>
        </div>
    )
}
