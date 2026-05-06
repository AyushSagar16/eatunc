'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCart } from '@/lib/stores/cart'
import { db, getDeviceId, nowIso, type LocalCustomFood } from '@/lib/dexie'
import { getDiningDate } from '@/lib/dexie'

interface CustomItemSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function CustomItemSheet({ open, onOpenChange }: CustomItemSheetProps) {
    const cartDate = useCart((s) => s.date)
    const cartPeriod = useCart((s) => s.meal_period)
    const cartHall = useCart((s) => s.dining_hall)
    const add = useCart((s) => s.add)

    const [name, setName] = useState('')
    const [kcal, setKcal] = useState('')
    const [protein, setProtein] = useState('')
    const [fat, setFat] = useState('')
    const [carbs, setCarbs] = useState('')
    const [serving, setServing] = useState('1')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        if (!open) {
            setName('')
            setKcal('')
            setProtein('')
            setFat('')
            setCarbs('')
            setServing('1')
        }
    }, [open])

    const valid = name.trim().length > 0 && Number(kcal) >= 0 && !Number.isNaN(Number(kcal))

    const handleSave = async () => {
        if (!valid) {
            toast.error('Add at least a name and calories.')
            return
        }
        setBusy(true)
        try {
            const device_id = getDeviceId()
            const now = nowIso()
            const customFood: LocalCustomFood = {
                id: crypto.randomUUID(),
                user_id: null,
                device_id,
                name: name.trim(),
                calories_kcal: Number(kcal) || 0,
                protein_g: Number(protein) || 0,
                fat_g: Number(fat) || 0,
                carbohydrates_g: Number(carbs) || 0,
                fiber_g: null,
                sodium_mg: null,
                default_serving: Number(serving) || 1,
                created_at: now,
                updated_at: now,
                is_synced: false,
            }
            await db.custom_foods.put(customFood)

            const targetDate = cartDate ?? getDiningDate()
            const targetPeriod = cartPeriod ?? 'lunch'
            const targetHall = cartHall

            const result = add(
                {
                    source: 'custom',
                    recipe_number: null,
                    custom_food_id: customFood.id,
                    food_name: customFood.name,
                    calories_kcal: customFood.calories_kcal,
                    protein_g: customFood.protein_g,
                    fat_g: customFood.fat_g,
                    carbohydrates_g: customFood.carbohydrates_g,
                    fiber_g: null,
                    sodium_mg: null,
                    amount_per_serving: null,
                    dining_hall: targetHall,
                    servings: 1,
                },
                { date: targetDate, meal_period: targetPeriod, dining_hall: targetHall },
            )

            if (result.ok) {
                toast.success('Custom item added', {
                    description: `${customFood.name} · ${customFood.calories_kcal} kcal`,
                })
                onOpenChange(false)
            }
        } catch (err) {
            toast.error('Could not save custom item', {
                description: err instanceof Error ? err.message : 'Try again',
            })
        } finally {
            setBusy(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl font-black tracking-tight text-navy-900 dark:text-ink-50">
                        Add a custom item
                    </DialogTitle>
                    <DialogDescription className="text-sm text-ink-600 dark:text-ink-300">
                        For meals off-campus or anything not in today&apos;s menu.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="custom-name" className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                            Name
                        </Label>
                        <Input
                            id="custom-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Cookout milkshake"
                            className="font-medium"
                            autoFocus
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="custom-kcal" className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                            Calories
                        </Label>
                        <div className="relative">
                            <Input
                                id="custom-kcal"
                                inputMode="decimal"
                                value={kcal}
                                onChange={(e) => setKcal(e.target.value)}
                                placeholder="0"
                                className="pr-14 font-display text-lg font-black tracking-tight"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-[0.1em] text-ink-500">kcal</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <MacroInput label="Protein" suffix="g" value={protein} onChange={setProtein} accent="protein" />
                        <MacroInput label="Fat" suffix="g" value={fat} onChange={setFat} accent="fat" />
                        <MacroInput label="Carbs" suffix="g" value={carbs} onChange={setCarbs} accent="carbs" />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="custom-serving" className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                            Default servings
                        </Label>
                        <Input
                            id="custom-serving"
                            inputMode="decimal"
                            value={serving}
                            onChange={(e) => setServing(e.target.value)}
                            placeholder="1"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!valid || busy}
                        className="bg-navy-900 text-white hover:bg-navy-800 dark:bg-carolina-500 dark:text-navy-900 dark:hover:bg-carolina-400"
                    >
                        {busy ? 'Saving…' : 'Add to cart'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface MacroInputProps {
    label: string
    suffix: string
    value: string
    onChange: (v: string) => void
    accent: 'protein' | 'fat' | 'carbs'
}

function MacroInput({ label, suffix, value, onChange, accent }: MacroInputProps) {
    const dot = {
        protein: 'bg-[oklch(0.74_0.135_55)]',
        fat: 'bg-[oklch(0.65_0.180_350)]',
        carbs: 'bg-[oklch(0.72_0.105_145)]',
    }[accent]
    return (
        <div className="grid gap-1.5">
            <Label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
                {label}
            </Label>
            <div className="relative">
                <Input
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="0"
                    className="pr-7 font-medium tabular-nums"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-500">
                    {suffix}
                </span>
            </div>
        </div>
    )
}
