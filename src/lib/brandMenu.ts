import type { MasterFoodItem } from '@/lib/api'
import type { ExternalFoodItem } from '@/lib/campus'

/**
 * A third-party brand's nutrition set, shaped as menu entries.
 *
 * The 17 brand venues have no UNC-published daily menu, and inventing dates for one would be a
 * lie — but the food is still food, and it was reaching people as a static table while every
 * UNC venue on the same site had search, sort, dietary filters, allergen dimming and a nutrition
 * modal. This maps a brand row onto the shape `MenuContainer` already reads so those venues get
 * the same interface out of the same components rather than a second implementation of them.
 *
 * `BrandItemsTable` still renders every row underneath, server-side: the grid virtualises past
 * 50 items and would otherwise delete the item names from the HTML a crawler receives.
 */

/**
 * The service label every campus venue outside the two halls stores, and what the shape-one
 * venue pages already show. A brand publishes no meal periods of its own, and one period is
 * also what suppresses the tab strip in `FoodDisplayLayout`.
 */
export const BRAND_MEAL_PERIOD = 'Open'

/**
 * The nine allergens the filter panel offers, matched in `MenuContainer` by exact lowercase
 * equality. UNC's own rows are already written in these words; a brand's list is the operator's
 * vocabulary — "Dairy", "Eggs", "Peanuts (may contain - shared equipment)".
 */
const FILTER_ALLERGENS = new Set([
    'milk',
    'egg',
    'fish',
    'shellfish',
    'tree nuts',
    'peanut',
    'wheat',
    'soy',
    'sesame',
])

/** Title case as UNC files it, so a brand row's added token reads like every other one. */
const ALLERGEN_DISPLAY: Record<string, string> = {
    milk: 'Milk',
    egg: 'Egg',
    fish: 'Fish',
    shellfish: 'Shellfish',
    'tree nuts': 'Tree Nuts',
    peanut: 'Peanut',
    wheat: 'Wheat',
    soy: 'Soy',
    sesame: 'Sesame',
}

/** The one dietary label whose wording differs; the rest of the vocabulary already agrees. */
const DIETARY_SYNONYMS: Record<string, string> = {
    'gluten-free': 'Made Without Gluten',
    'gluten free': 'Made Without Gluten',
}

function splitLabels(value: string | null): string[] {
    if (!value) return []
    return value
        .split(/[,;|]/)
        .map((part) => part.trim())
        .filter(Boolean)
}

/**
 * Which of the nine filter allergens a brand's label names, or `null`.
 *
 * The qualifier is dropped for the purpose of matching only — "Peanuts (may contain - shared
 * equipment)" is a peanut warning, and a filter that ignored it would fail in the one direction
 * that matters.
 */
function canonicalAllergen(label: string): string | null {
    const base = label.toLowerCase().replace(/\(.*$/, '').trim()
    if (base === 'dairy') return ALLERGEN_DISPLAY.milk
    if (FILTER_ALLERGENS.has(base)) return ALLERGEN_DISPLAY[base]
    const singular = base.replace(/s$/, '')
    return FILTER_ALLERGENS.has(singular) ? ALLERGEN_DISPLAY[singular] : null
}

/**
 * The operator's labels, plus whichever canonical word the filters need.
 *
 * Added, never replaced and never dropped: allergen data is safety-critical, so the operator's
 * own wording — including a "may contain" qualifier — stays on the card and in the modal, and
 * the canonical token rides alongside it so the allergen filter can dim the row. Dimming one
 * item too many is the only survivable direction to be wrong in.
 */
function withCanonicalLabels(value: string | null, canonical: (label: string) => string | null): string | null {
    const labels = splitLabels(value)
    if (labels.length === 0) return value

    const present = new Set(labels.map((label) => label.toLowerCase()))
    const added: string[] = []
    for (const label of labels) {
        const token = canonical(label)
        if (token && !present.has(token.toLowerCase())) {
            present.add(token.toLowerCase())
            added.push(token)
        }
    }

    return added.length > 0 ? [...labels, ...added].join(', ') : value
}

function canonicalDiet(label: string): string | null {
    return DIETARY_SYNONYMS[label.toLowerCase()] ?? null
}

export type BrandMenuEntry = {
    meal_period: string
    meal_station: string
    recipe_number: number
    master_food_items: MasterFoodItem
}

/**
 * Brand items as menu entries, ready for `MenuContainer`.
 *
 * The station is the operator's own category, so the grid's accordions group exactly the way
 * `BrandItemsTable` does and the two listings on the page agree.
 *
 * 🔒 A brand item's identity is `external_food_items.item_key`, never `id` — `id` is regenerated
 * on every seed load. `MenuContainer` keys its grid, its per-station dedup and its Top Picks on
 * `recipe_number`, so one is minted here as a negative index. Negative because UNC's recipe
 * numbers start at 3388: it cannot collide, and anything that ever read it as a recipe would
 * miss loudly instead of resolving the wrong food. It is a React key and nothing else — no
 * surface prints it (`FoodCard` and `FoodModal` show the name and the macros), it is not in the
 * JSON-LD, and it never reaches a URL.
 */
export function brandMenuEntries(items: ExternalFoodItem[]): BrandMenuEntry[] {
    return items.map((item, index) => ({
        meal_period: BRAND_MEAL_PERIOD,
        meal_station: item.category?.trim() || 'Menu',
        recipe_number: -(index + 1),
        master_food_items: {
            recipe_number: -(index + 1),
            food_name: item.item_name,
            calories_kcal: item.calories_kcal,
            protein_g: item.protein_g,
            carbohydrates_g: item.carbohydrates_g,
            fat_g: item.fat_g,
            amount_per_serving: item.serving_description,
            dietary_preferences: withCanonicalLabels(item.dietary_preferences, canonicalDiet),
            allergens: withCanonicalLabels(item.allergens, canonicalAllergen),
        },
    }))
}
