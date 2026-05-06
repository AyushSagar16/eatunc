'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'

export interface ProgressRingsValue {
    calories: number
    protein: number
    fat: number
    carbs: number
}

export interface ProgressRingsGoal {
    calorie_goal: number | null
    protein_goal_g: number | null
    fat_goal_g: number | null
    carb_goal_g: number | null
}

interface ProgressRingsProps {
    values: ProgressRingsValue
    goal: ProgressRingsGoal | null
    /** sm: tiny, header-friendly. md: card. lg: hero */
    size?: 'sm' | 'md' | 'lg'
    label?: string
    sublabel?: string
    className?: string
}

const SIZES = {
    sm: { outer: 84, smallRing: 22, smallStroke: 4, outerStroke: 8, gap: 4 },
    md: { outer: 168, smallRing: 36, smallStroke: 6, outerStroke: 12, gap: 8 },
    lg: { outer: 232, smallRing: 48, smallStroke: 8, outerStroke: 16, gap: 12 },
} as const

export default function ProgressRings({
    values,
    goal,
    size = 'md',
    label,
    sublabel,
    className = '',
}: ProgressRingsProps) {
    const reduced = useReducedMotion()
    const dims = SIZES[size]

    const ratio = (v: number, g: number | null) => {
        if (!g || g <= 0) return 0
        return Math.min(1.05, v / g)
    }

    const calRatio = ratio(values.calories, goal?.calorie_goal ?? null)
    const protRatio = ratio(values.protein, goal?.protein_goal_g ?? null)
    const fatRatio = ratio(values.fat, goal?.fat_goal_g ?? null)
    const carbRatio = ratio(values.carbs, goal?.carb_goal_g ?? null)

    const transition = reduced
        ? { duration: 0 }
        : { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }

    return (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            <div
                className="relative"
                style={{ width: dims.outer, height: dims.outer }}
            >
                <Ring
                    diameter={dims.outer}
                    stroke={dims.outerStroke}
                    ratio={calRatio}
                    color="var(--color-macro-kcal)"
                    transition={transition}
                />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span
                        className="font-display font-black tabular-nums leading-none text-navy-900 dark:text-ink-50"
                        style={{
                            fontSize: size === 'lg' ? '2.5rem' : size === 'md' ? '1.75rem' : '1rem',
                        }}
                    >
                        {Math.round(values.calories)}
                    </span>
                    {goal?.calorie_goal && size !== 'sm' ? (
                        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                            of {goal.calorie_goal} kcal
                        </span>
                    ) : (
                        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                            kcal
                        </span>
                    )}
                </div>
            </div>

            {(label || sublabel) && (
                <div className="text-center">
                    {label && (
                        <p className="font-display text-base font-bold tracking-tight text-navy-900 dark:text-ink-50">
                            {label}
                        </p>
                    )}
                    {sublabel && (
                        <p className="mt-0.5 text-xs font-medium text-ink-500">{sublabel}</p>
                    )}
                </div>
            )}

            {size !== 'sm' && (
                <div
                    className="flex items-center justify-center"
                    style={{ gap: dims.gap * 2 }}
                >
                    <SmallRing
                        label="P"
                        value={values.protein}
                        goal={goal?.protein_goal_g ?? null}
                        ratio={protRatio}
                        color="var(--color-macro-protein)"
                        diameter={dims.smallRing * 2}
                        stroke={dims.smallStroke}
                        transition={transition}
                    />
                    <SmallRing
                        label="F"
                        value={values.fat}
                        goal={goal?.fat_goal_g ?? null}
                        ratio={fatRatio}
                        color="var(--color-macro-fat)"
                        diameter={dims.smallRing * 2}
                        stroke={dims.smallStroke}
                        transition={transition}
                    />
                    <SmallRing
                        label="C"
                        value={values.carbs}
                        goal={goal?.carb_goal_g ?? null}
                        ratio={carbRatio}
                        color="var(--color-macro-carbs)"
                        diameter={dims.smallRing * 2}
                        stroke={dims.smallStroke}
                        transition={transition}
                    />
                </div>
            )}
        </div>
    )
}

interface RingProps {
    diameter: number
    stroke: number
    ratio: number
    color: string
    transition: { duration: number; ease?: readonly [number, number, number, number] }
}

function Ring({ diameter, stroke, ratio, color, transition }: RingProps) {
    const r = (diameter - stroke) / 2
    const circumference = 2 * Math.PI * r

    return (
        <svg
            width={diameter}
            height={diameter}
            viewBox={`0 0 ${diameter} ${diameter}`}
            className="-rotate-90"
        >
            <circle
                cx={diameter / 2}
                cy={diameter / 2}
                r={r}
                fill="none"
                stroke="var(--color-ink-200)"
                strokeWidth={stroke}
                strokeLinecap="round"
                className="dark:stroke-ink-800"
            />
            <motion.circle
                cx={diameter / 2}
                cy={diameter / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - Math.min(ratio, 1)) }}
                transition={transition}
            />
        </svg>
    )
}

interface SmallRingProps {
    label: string
    value: number
    goal: number | null
    ratio: number
    color: string
    diameter: number
    stroke: number
    transition: { duration: number; ease?: readonly [number, number, number, number] }
}

function SmallRing({ label, value, goal, ratio, color, diameter, stroke, transition }: SmallRingProps) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative" style={{ width: diameter, height: diameter }}>
                <Ring
                    diameter={diameter}
                    stroke={stroke}
                    ratio={ratio}
                    color={color}
                    transition={transition}
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-sm font-black tabular-nums text-navy-900 dark:text-ink-50">
                        {Math.round(value)}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                />
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                    {label}{goal ? ` · ${goal}g` : 'g'}
                </span>
            </div>
        </div>
    )
}
