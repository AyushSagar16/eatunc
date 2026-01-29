'use client'

/**
 * Cart Totals
 * 
 * Displays running totals for all macros in the cart.
 * Optionally shows comparison against user targets.
 */

import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/hooks/useAuth'

export function CartTotals() {
    const getTotals = useCartStore((state) => state.getTotals)
    const { profile } = useAuth()

    const totals = getTotals()

    // Calculate percentages if user has targets
    const getPercentage = (current: number, target: number | undefined) => {
        if (!target || target === 0) return null
        return Math.round((current / target) * 100)
    }

    const caloriesPercent = getPercentage(totals.calories, profile?.daily_calories_target)
    const proteinPercent = getPercentage(totals.protein, profile?.daily_protein_target)
    const carbsPercent = getPercentage(totals.carbs, profile?.daily_carbs_target)
    const fatPercent = getPercentage(totals.fat, profile?.daily_fat_target)

    return (
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl">
            <h4 className="text-sm font-semibold text-zinc-400 mb-3">Cart Totals</h4>

            <div className="grid grid-cols-2 gap-3">
                {/* Calories */}
                <div className="col-span-2">
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-white">{totals.calories}</span>
                        <span className="text-sm text-zinc-400">kcal</span>
                    </div>
                    {caloriesPercent !== null && (
                        <div className="mt-1">
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${caloriesPercent > 100 ? 'bg-red-500' : 'bg-blue-500'
                                        }`}
                                    style={{ width: `${Math.min(caloriesPercent, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">
                                {caloriesPercent}% of {profile?.daily_calories_target} target
                            </p>
                        </div>
                    )}
                </div>

                {/* Protein */}
                <MacroItem
                    label="Protein"
                    value={totals.protein}
                    unit="g"
                    percentage={proteinPercent}
                    target={profile?.daily_protein_target}
                    color="green"
                />

                {/* Carbs */}
                <MacroItem
                    label="Carbs"
                    value={totals.carbs}
                    unit="g"
                    percentage={carbsPercent}
                    target={profile?.daily_carbs_target}
                    color="yellow"
                />

                {/* Fat */}
                <MacroItem
                    label="Fat"
                    value={totals.fat}
                    unit="g"
                    percentage={fatPercent}
                    target={profile?.daily_fat_target}
                    color="orange"
                />
            </div>
        </div>
    )
}

interface MacroItemProps {
    label: string
    value: number
    unit: string
    percentage: number | null
    target: number | undefined
    color: 'green' | 'yellow' | 'orange'
}

function MacroItem({ label, value, unit, percentage, target, color }: MacroItemProps) {
    const colorClasses = {
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        orange: 'bg-orange-500',
    }

    return (
        <div>
            <div className="flex items-baseline justify-between">
                <span className="text-lg font-semibold text-white">{value}{unit}</span>
                <span className="text-xs text-zinc-500">{label}</span>
            </div>
            {percentage !== null && (
                <div className="mt-1">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${percentage > 100 ? 'bg-red-500' : colorClasses[color]
                                }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                        {percentage}% of {target}
                    </p>
                </div>
            )}
        </div>
    )
}
