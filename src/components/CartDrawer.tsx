'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { Plus, Minus, Trash2, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCart, type CartItem } from '@/lib/stores/cart'
import { logMeal } from '@/lib/actions/logMeal'
import { hasAnyGoal } from '@/lib/actions/goals'
import CustomItemSheet from '@/components/CustomItemSheet'
import OnboardingWizard from '@/components/OnboardingWizard'

const MEAL_PERIOD_LABELS: Record<string, string> = {
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

function periodLabel(slug: string | null): string {
    if (!slug) return 'Untagged'
    return MEAL_PERIOD_LABELS[slug] ?? slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(date: string | null): string {
    if (!date) return ''
    const [y, m, d] = date.split('-').map(Number)
    if (!y || !m || !d) return date
    const dt = new Date(Date.UTC(y, m - 1, d))
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(dt)
}

export default function CartDrawer() {
    const isOpen = useCart((s) => s.isOpen)
    const setOpen = useCart((s) => s.setOpen)
    const items = useCart((s) => s.items)
    const date = useCart((s) => s.date)
    const meal_period = useCart((s) => s.meal_period)
    const dining_hall = useCart((s) => s.dining_hall)
    const pending = useCart((s) => s.pendingItem)
    const remove = useCart((s) => s.remove)
    const setServings = useCart((s) => s.setServings)
    const clear = useCart((s) => s.clear)
    const forceReplace = useCart((s) => s.forceReplaceContext)
    const cancelPending = useCart((s) => s.cancelPending)

    const [showCustom, setShowCustom] = useState(false)
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const totals = useMemo(() => {
        let kcal = 0
        let p = 0
        let f = 0
        let c = 0
        for (const i of items) {
            const s = i.servings || 1
            kcal += (i.calories_kcal || 0) * s
            p += (i.protein_g || 0) * s
            f += (i.fat_g || 0) * s
            c += (i.carbohydrates_g || 0) * s
        }
        return { kcal, p, f, c }
    }, [items])

    const handleLog = async () => {
        if (!date || !meal_period || items.length === 0) return
        setSubmitting(true)
        try {
            await logMeal({ date, meal_period, items })
            const exists = await hasAnyGoal()
            clear()
            setOpen(false)
            if (!exists) {
                setShowOnboarding(true)
            } else {
                toast.success('Meal logged', {
                    description: `${Math.round(totals.kcal)} kcal · ${items.length} item${items.length === 1 ? '' : 's'}`,
                    duration: 3500,
                })
            }
        } catch (err) {
            toast.error('Could not log meal', {
                description: err instanceof Error ? err.message : 'Try again',
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <Sheet open={isOpen} onOpenChange={setOpen}>
                <SheetContent
                    side="right"
                    className="flex w-full flex-col gap-0 border-l border-ink-200 bg-ink-50 p-0 sm:max-w-md dark:border-ink-800 dark:bg-ink-950"
                >
                    <SheetHeader className="border-b border-ink-200 bg-white px-5 py-5 dark:border-ink-800 dark:bg-ink-900">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-1 rounded-full bg-carolina-500" aria-hidden="true" />
                                <div>
                                    <SheetTitle className="font-display text-2xl font-black tracking-tight text-navy-900 dark:text-ink-50">
                                        Today&apos;s Plate
                                    </SheetTitle>
                                    <SheetDescription className="mt-0.5 text-xs font-medium uppercase tracking-[0.12em] text-ink-500">
                                        {date ? formatDate(date) : 'Empty'}
                                        {meal_period ? ` · ${periodLabel(meal_period)}` : ''}
                                        {dining_hall ? ` · ${dining_hall}` : ''}
                                    </SheetDescription>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        {items.length === 0 ? (
                            <EmptyCart onAddCustom={() => setShowCustom(true)} />
                        ) : (
                            <ul className="flex flex-col gap-2">
                                <AnimatePresence initial={false}>
                                    {items.map((item) => (
                                        <CartRow
                                            key={item.cart_id}
                                            item={item}
                                            onSetServings={(s) => setServings(item.cart_id, s)}
                                            onRemove={() => remove(item.cart_id)}
                                        />
                                    ))}
                                </AnimatePresence>
                                <button
                                    type="button"
                                    onClick={() => setShowCustom(true)}
                                    className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-300 px-4 py-3 text-sm font-semibold text-ink-700 transition-colors hover:border-carolina-500 hover:text-carolina-700 dark:border-ink-700 dark:text-ink-200 dark:hover:border-carolina-400 dark:hover:text-carolina-300"
                                >
                                    <Plus className="h-4 w-4" /> Add custom item
                                </button>
                            </ul>
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="border-t border-ink-200 bg-white px-5 pb-6 pt-4 dark:border-ink-800 dark:bg-ink-900">
                            <div className="mb-4 grid grid-cols-4 gap-2">
                                <TotalCell label="kcal" value={totals.kcal} accent="kcal" />
                                <TotalCell label="P" value={totals.p} accent="protein" suffix="g" />
                                <TotalCell label="F" value={totals.f} accent="fat" suffix="g" />
                                <TotalCell label="C" value={totals.c} accent="carbs" suffix="g" />
                            </div>
                            <Button
                                size="lg"
                                onClick={handleLog}
                                disabled={submitting}
                                className="w-full bg-navy-900 text-base font-semibold text-white shadow-lg shadow-navy-900/20 hover:bg-navy-800 disabled:opacity-60 dark:bg-carolina-500 dark:text-navy-900 dark:hover:bg-carolina-400"
                            >
                                {submitting ? 'Logging…' : 'Log meal'}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            <button
                                type="button"
                                onClick={() => clear()}
                                disabled={submitting}
                                className="mt-2 w-full rounded-md py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink-500 transition-colors hover:text-ink-900 disabled:opacity-50 dark:text-ink-400 dark:hover:text-ink-50"
                            >
                                Clear cart
                            </button>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <ContextSwitchDialog
                pending={pending}
                currentDate={date}
                currentPeriod={meal_period}
                onConfirm={() => forceReplace()}
                onCancel={() => cancelPending()}
            />

            <CustomItemSheet open={showCustom} onOpenChange={setShowCustom} />
            <OnboardingWizard open={showOnboarding} onOpenChange={setShowOnboarding} />
        </>
    )
}

interface CartRowProps {
    item: CartItem
    onSetServings: (s: number) => void
    onRemove: () => void
}

function CartRow({ item, onSetServings, onRemove }: CartRowProps) {
    const s = item.servings || 1
    const displayCalories = Math.round((item.calories_kcal || 0) * s)
    const displayProtein = Math.round((item.protein_g || 0) * s)

    return (
        <motion.li
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2 }}
            className="group flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-3 shadow-sm dark:border-ink-800 dark:bg-ink-900"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-navy-900 dark:text-ink-50">
                        {item.food_name}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-500">
                        {item.source === 'custom' ? 'Custom' : item.dining_hall ?? 'Menu item'}
                    </p>
                </div>
                <button
                    type="button"
                    aria-label="Remove from cart"
                    onClick={onRemove}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-full bg-ink-100 p-0.5 dark:bg-ink-800">
                    <button
                        type="button"
                        aria-label="Decrease servings"
                        onClick={() => onSetServings(Math.max(0.25, s - 0.5))}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-ink-700 hover:bg-white hover:text-navy-900 dark:text-ink-200 dark:hover:bg-ink-700 dark:hover:text-ink-50"
                    >
                        <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-navy-900 dark:text-ink-50">
                        {s % 1 === 0 ? s : s.toFixed(1)}×
                    </span>
                    <button
                        type="button"
                        aria-label="Increase servings"
                        onClick={() => onSetServings(s + 0.5)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-ink-700 hover:bg-white hover:text-navy-900 dark:text-ink-200 dark:hover:bg-ink-700 dark:hover:text-ink-50"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <span className="font-display text-base font-black text-navy-900 dark:text-ink-50">
                        {displayCalories}
                        <span className="ml-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-500">kcal</span>
                    </span>
                    <span className="text-ink-500">·</span>
                    <span className="font-medium text-ink-700 dark:text-ink-200">{displayProtein}g P</span>
                </div>
            </div>
        </motion.li>
    )
}

interface TotalCellProps {
    label: string
    value: number
    suffix?: string
    accent: 'kcal' | 'protein' | 'fat' | 'carbs'
}

function TotalCell({ label, value, suffix = '', accent }: TotalCellProps) {
    const dotColor = {
        kcal: 'bg-carolina-500',
        protein: 'bg-[oklch(0.74_0.135_55)]',
        fat: 'bg-[oklch(0.65_0.180_350)]',
        carbs: 'bg-[oklch(0.72_0.105_145)]',
    }[accent]

    return (
        <div className="flex flex-col items-center gap-1 rounded-xl bg-ink-50 py-2 dark:bg-ink-800/40">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-500">
                <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
                {label}
            </span>
            <span className="font-display text-base font-black text-navy-900 tabular-nums dark:text-ink-50">
                {Math.round(value)}
                {suffix}
            </span>
        </div>
    )
}

function EmptyCart({ onAddCustom }: { onAddCustom: () => void }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-carolina-100 text-carolina-700 dark:bg-carolina-900/40 dark:text-carolina-300">
                <Sparkles className="h-7 w-7" />
            </div>
            <div className="space-y-1">
                <p className="font-display text-lg font-bold text-navy-900 dark:text-ink-50">
                    Your plate is empty
                </p>
                <p className="max-w-[14rem] text-sm text-ink-500">
                    Tap <span className="font-semibold text-carolina-700 dark:text-carolina-300">+</span> on any food card to add it here.
                </p>
            </div>
            <button
                type="button"
                onClick={onAddCustom}
                className="mt-2 inline-flex items-center gap-1 rounded-full border border-ink-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-700 transition-colors hover:border-carolina-500 hover:text-carolina-700 dark:border-ink-700 dark:text-ink-200 dark:hover:border-carolina-400 dark:hover:text-carolina-300"
            >
                <Plus className="h-3 w-3" /> Add custom item
            </button>
        </div>
    )
}

interface ContextSwitchDialogProps {
    pending: ReturnType<typeof useCart.getState>['pendingItem']
    currentDate: string | null
    currentPeriod: string | null
    onConfirm: () => void
    onCancel: () => void
}

function ContextSwitchDialog({ pending, currentDate, currentPeriod, onConfirm, onCancel }: ContextSwitchDialogProps) {
    if (!pending) return null
    const open = pending !== null
    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-display text-xl font-black text-navy-900 dark:text-ink-50">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        Switch meal context?
                    </DialogTitle>
                    <DialogDescription className="text-sm text-ink-600 dark:text-ink-300">
                        Your cart has items from <strong>{periodLabel(currentPeriod)}</strong> on{' '}
                        <strong>{formatDate(currentDate)}</strong>. Adding from{' '}
                        <strong>{periodLabel(pending.context.meal_period)}</strong> on{' '}
                        <strong>{formatDate(pending.context.date)}</strong> will replace the cart.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        Keep cart
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-navy-900 text-white hover:bg-navy-800 dark:bg-carolina-500 dark:text-navy-900 dark:hover:bg-carolina-400"
                    >
                        Replace and add
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
