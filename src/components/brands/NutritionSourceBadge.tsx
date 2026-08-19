import { BadgeCheck, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ESTIMATED } from './nutrition'

interface NutritionSourceBadgeProps {
    /** `published` or `estimated`, straight off `external_food_items.nutrition_source`. */
    source: string
    className?: string
}

/**
 * The published/estimated marker, shown on every row that prints a number.
 *
 * This is the whole point of the brand pages: a chain that files a nutrition PDF and a food
 * truck that files nothing are both on this site, and it must never be possible to mistake one
 * for the other. Colour alone would not carry it, so the badge always spells the word out.
 */
export default function NutritionSourceBadge({ source, className }: NutritionSourceBadgeProps) {
    const isEstimated = source === ESTIMATED
    const Icon = isEstimated ? Calculator : BadgeCheck

    return (
        <span
            title={
                isEstimated
                    ? 'Estimated by Eat UNC — the operator publishes no figure for this item. The derivation is shown below.'
                    : 'Published by the operator — these are the numbers the brand discloses itself.'
            }
            className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
                isEstimated
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
                className
            )}
        >
            <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
            {isEstimated ? 'Estimated' : 'Published'}
        </span>
    )
}
