'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Sparkles, Target } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { setGoal } from '@/lib/actions/goals'

interface OnboardingWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const KCAL_BOUNDS = { min: 1200, max: 4000, step: 50 }
const PROTEIN_BOUNDS = { min: 40, max: 250, step: 5 }
const FAT_BOUNDS = { min: 20, max: 150, step: 5 }
const CARBS_BOUNDS = { min: 80, max: 500, step: 10 }

export default function OnboardingWizard({ open, onOpenChange }: OnboardingWizardProps) {
    const [kcal, setKcal] = useState(2200)
    const [protein, setProtein] = useState(110)
    const [fat, setFat] = useState(70)
    const [carbs, setCarbs] = useState(260)
    const [busy, setBusy] = useState(false)

    const handleSave = async () => {
        setBusy(true)
        try {
            await setGoal({
                calorie_goal: kcal,
                protein_goal_g: protein,
                fat_goal_g: fat,
                carb_goal_g: carbs,
            })
            toast.success('Goals set', {
                description: 'Your progress rings are live in /log.',
            })
            onOpenChange(false)
        } catch (err) {
            toast.error('Could not save goals', {
                description: err instanceof Error ? err.message : 'Try again',
            })
        } finally {
            setBusy(false)
        }
    }

    const handleSkip = () => {
        onOpenChange(false)
        toast('Skipped for now', {
            description: 'You can set goals anytime from Profile.',
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-carolina-100 text-carolina-700 dark:bg-carolina-900/40 dark:text-carolina-300">
                        <Target className="h-5 w-5" />
                    </div>
                    <DialogTitle className="font-display text-3xl font-black tracking-tight text-navy-900 dark:text-ink-50">
                        Set your daily goals
                    </DialogTitle>
                    <DialogDescription className="text-sm text-ink-600 dark:text-ink-300">
                        We&apos;ll fill four progress rings as you log. You can change these any time.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-2">
                    <GoalSlider
                        label="Calories"
                        suffix="kcal"
                        accent="kcal"
                        value={kcal}
                        onChange={setKcal}
                        min={KCAL_BOUNDS.min}
                        max={KCAL_BOUNDS.max}
                        step={KCAL_BOUNDS.step}
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                        <GoalSlider
                            label="Protein"
                            suffix="g"
                            accent="protein"
                            value={protein}
                            onChange={setProtein}
                            min={PROTEIN_BOUNDS.min}
                            max={PROTEIN_BOUNDS.max}
                            step={PROTEIN_BOUNDS.step}
                            compact
                        />
                        <GoalSlider
                            label="Fat"
                            suffix="g"
                            accent="fat"
                            value={fat}
                            onChange={setFat}
                            min={FAT_BOUNDS.min}
                            max={FAT_BOUNDS.max}
                            step={FAT_BOUNDS.step}
                            compact
                        />
                        <GoalSlider
                            label="Carbs"
                            suffix="g"
                            accent="carbs"
                            value={carbs}
                            onChange={setCarbs}
                            min={CARBS_BOUNDS.min}
                            max={CARBS_BOUNDS.max}
                            step={CARBS_BOUNDS.step}
                            compact
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" onClick={handleSkip} disabled={busy}>
                        Skip for now
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={busy}
                        className="bg-navy-900 text-white hover:bg-navy-800 dark:bg-carolina-500 dark:text-navy-900 dark:hover:bg-carolina-400"
                    >
                        <Sparkles className="h-4 w-4" />
                        {busy ? 'Saving…' : 'Lock in goals'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface GoalSliderProps {
    label: string
    suffix: string
    accent: 'kcal' | 'protein' | 'fat' | 'carbs'
    value: number
    onChange: (n: number) => void
    min: number
    max: number
    step: number
    compact?: boolean
}

function GoalSlider({ label, suffix, accent, value, onChange, min, max, step, compact }: GoalSliderProps) {
    const dot = {
        kcal: 'bg-carolina-500',
        protein: 'bg-[oklch(0.74_0.135_55)]',
        fat: 'bg-[oklch(0.65_0.180_350)]',
        carbs: 'bg-[oklch(0.72_0.105_145)]',
    }[accent]

    return (
        <div className={`grid gap-2 rounded-2xl border border-ink-200 bg-ink-50 p-3 dark:border-ink-800 dark:bg-ink-900/40 ${compact ? '' : 'gap-3 p-4'}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                    <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
                    {label}
                </span>
                <motion.span
                    key={value}
                    initial={{ scale: 0.95, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.18 }}
                    className={`font-display font-black tabular-nums text-navy-900 dark:text-ink-50 ${compact ? 'text-base' : 'text-2xl'}`}
                >
                    {value}
                    <span className={`ml-0.5 font-medium uppercase tracking-[0.1em] text-ink-500 ${compact ? 'text-[9px]' : 'text-xs'}`}>{suffix}</span>
                </motion.span>
            </div>
            <Slider
                value={[value]}
                min={min}
                max={max}
                step={step}
                onValueChange={(v) => onChange(v[0] ?? value)}
            />
        </div>
    )
}
