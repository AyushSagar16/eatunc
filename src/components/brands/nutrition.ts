import type { ExternalFoodItem } from '@/lib/campus'

/**
 * Shared vocabulary for the brand pages.
 *
 * A macro is either `published` (the operator disclosed it) or `estimated` (we derived it, and
 * `nutrition_basis` names the derivation). The distinction is binary on purpose — a confidence
 * scale would have every surface invent its own threshold — and every number these pages print
 * has to carry it visibly. `estimated` is not a lesser number; it records *how we know*.
 */
export const PUBLISHED = 'published'
export const ESTIMATED = 'estimated'

export type SourceSplit = {
    total: number
    published: number
    estimated: number
}

export function sourceSplit(items: { nutrition_source: string }[]): SourceSplit {
    let published = 0
    let estimated = 0
    for (const item of items) {
        if (item.nutrition_source === PUBLISHED) published += 1
        else if (item.nutrition_source === ESTIMATED) estimated += 1
    }
    return { total: items.length, published, estimated }
}

/**
 * A macro, printed. `null` is a real state — a generic "Beverages" line that names no product
 * has no honest number — and it renders as an em dash rather than as a zero, because 0 kcal is
 * a claim and "we have no figure" is not.
 */
export function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—'
    if (!Number.isFinite(value)) return '—'
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)))
}

/** Anchor target for a category heading, so the jump nav works without JavaScript. */
export function categorySlug(category: string): string {
    const base = category
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return `cat-${base || 'other'}`
}

/** "Wheat, Milk, Egg" -> ["Wheat", "Milk", "Egg"]. Empty and null both mean "nothing to show". */
export function splitLabels(value: string | null | undefined): string[] {
    if (!value) return []
    return value
        .split(/[,;|]/)
        .map((part) => part.trim())
        .filter(Boolean)
}

export type CategoryGroup = {
    category: string
    items: ExternalFoodItem[]
}

/**
 * Items grouped by category, preserving the order `getBrandBySlug` already sorted them into
 * (category, then item name).
 */
export function groupByCategory(items: ExternalFoodItem[]): CategoryGroup[] {
    const groups: CategoryGroup[] = []
    for (const item of items) {
        const category = item.category?.trim() || 'Other'
        const last = groups[groups.length - 1]
        if (last && last.category === category) last.items.push(item)
        else groups.push({ category, items: [item] })
    }
    return groups
}

/** A stored timestamp, in Chapel Hill. Never `new Date()` — this formats data, not "now". */
export function formatStoredDate(iso: string | null | undefined): string | null {
    if (!iso) return null
    const at = new Date(iso)
    if (Number.isNaN(at.getTime())) return null
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(at)
}
