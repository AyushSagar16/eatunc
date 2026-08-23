import type { LocationHours } from './campus'
import { CAMPUS_TIMEZONE } from './campus'

export const SITE_URL = 'https://eatunc.com'

export function canonical(path: string): string {
    return path === '/' ? SITE_URL : `${SITE_URL}${path}`
}

const SCHEMA_DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
] as const

/**
 * Local wall-clock weekday and HH:MM for an instant, in Chapel Hill.
 *
 * `opens_at` is timestamptz, so the stored value is an instant; schema.org's
 * `OpeningHoursSpecification` wants local wall-clock time. Formatting through Intl with an
 * explicit timeZone is the only conversion that survives daylight saving, which moves every
 * stored instant by an hour twice a year while the posted hours stay put.
 */
function campusTimeParts(iso: string): { weekday: string; hhmm: string } | null {
    const at = new Date(iso)
    if (Number.isNaN(at.getTime())) return null

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: CAMPUS_TIMEZONE,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(at)

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
    const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
    if (weekdayIndex < 0) return null

    // Intl renders midnight as "24" under hour12:false in some ICU versions.
    const hour = get('hour') === '24' ? '00' : get('hour')
    return { weekday: SCHEMA_DAYS[weekdayIndex], hhmm: `${hour}:${get('minute')}` }
}

export type OpeningHoursSpecification = {
    '@type': 'OpeningHoursSpecification'
    dayOfWeek: string[]
    opens: string
    closes: string
}

/**
 * Recurring weekly hours derived from the dated rows the scraper actually stored.
 *
 * The site previously hardcoded "07:00–21:00 weekdays" in JSON-LD, which was a guess and
 * contradicted the hours rendered on the same page. Collapsing real rows into a weekly pattern
 * keeps the markup and the visible hours from ever disagreeing — Google treats that mismatch as
 * a structured-data violation, and a wrong closing time is the single worst thing this site can
 * tell a hungry student.
 */
export function toOpeningHoursSpecification(hours: LocationHours[]): OpeningHoursSpecification[] {
    const byWindow = new Map<string, { opens: string; closes: string; days: Set<string> }>()

    for (const row of hours) {
        const opens = campusTimeParts(row.opens_at)
        const closes = campusTimeParts(row.closes_at)
        if (!opens || !closes) continue

        const key = `${opens.hhmm}-${closes.hhmm}`
        const entry = byWindow.get(key) ?? { opens: opens.hhmm, closes: closes.hhmm, days: new Set<string>() }
        entry.days.add(opens.weekday)
        byWindow.set(key, entry)
    }

    return Array.from(byWindow.values())
        .map((entry) => ({
            '@type': 'OpeningHoursSpecification' as const,
            dayOfWeek: SCHEMA_DAYS.filter((d) => entry.days.has(d)),
            opens: entry.opens,
            closes: entry.closes,
        }))
        .sort((a, b) => a.opens.localeCompare(b.opens))
}

export type Crumb = { name: string; path: string }

export function breadcrumbList(crumbs: Crumb[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((crumb, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: crumb.name,
            item: canonical(crumb.path),
        })),
    }
}

export type Faq = { question: string; answer: string }

export function faqPage(faqs: Faq[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
    }
}

export type NutritionalItem = {
    name: string
    calories_kcal?: number | null
    protein_g?: number | null
    fat_g?: number | null
    carbohydrates_g?: number | null
    amount_per_serving?: string | null
    dietary_preferences?: string | null
    allergens?: string | null
}

const DIET_TO_SCHEMA: Record<string, string> = {
    vegan: 'https://schema.org/VeganDiet',
    vegetarian: 'https://schema.org/VegetarianDiet',
    halal: 'https://schema.org/HalalDiet',
    kosher: 'https://schema.org/KosherDiet',
    'gluten free': 'https://schema.org/GlutenFreeDiet',
}

function suitableForDiet(preferences?: string | null): string[] | undefined {
    if (!preferences) return undefined
    const matched = Object.entries(DIET_TO_SCHEMA)
        .filter(([term]) => preferences.toLowerCase().includes(term))
        .map(([, url]) => url)
    return matched.length ? Array.from(new Set(matched)) : undefined
}

export function menuItem(item: NutritionalItem) {
    const nutrition: Record<string, string> = {}
    if (item.calories_kcal != null) nutrition.calories = `${item.calories_kcal} calories`
    if (item.protein_g != null) nutrition.proteinContent = `${item.protein_g} g`
    if (item.fat_g != null) nutrition.fatContent = `${item.fat_g} g`
    if (item.carbohydrates_g != null) nutrition.carbohydrateContent = `${item.carbohydrates_g} g`
    if (item.amount_per_serving) nutrition.servingSize = item.amount_per_serving

    return {
        '@type': 'MenuItem',
        name: item.name,
        ...(Object.keys(nutrition).length
            ? { nutrition: { '@type': 'NutritionInformation', ...nutrition } }
            : {}),
        ...(suitableForDiet(item.dietary_preferences)
            ? { suitableForDiet: suitableForDiet(item.dietary_preferences) }
            : {}),
    }
}

export type MenuSectionInput = { name: string; items: NutritionalItem[] }

/**
 * A `Menu` with its sections and their nutrition. This is the one piece of markup the official
 * dining site does not publish, and it is the only structured way to tell Google that a page
 * answers "what is being served at Chase today" rather than merely mentioning Chase.
 *
 * Both a per-section cap and a total budget apply. A hall day is around 100 stations and
 * 1,300 items, which serialises to 188KB — heavier than the page's own HTML, on the mobile
 * connections that produce 56% of impressions and hold the best positions. A representative
 * sample carries the same signal, and the complete menu is in the markup either way.
 */
export function menuSchema(opts: {
    name: string
    url: string
    description?: string
    sections: MenuSectionInput[]
    maxItemsPerSection?: number
    maxItemsTotal?: number
}) {
    const perSection = opts.maxItemsPerSection ?? 12
    const budget = opts.maxItemsTotal ?? 200

    // Filled round-robin rather than section by section. Sections arrive ordered by meal
    // period, so spending the budget in order would describe breakfast in full and never
    // reach dinner — the meal most people are searching for at the time they search.
    const sections = opts.sections.filter((section) => section.items.length > 0)
    const taken = sections.map(() => 0)
    let spent = 0

    for (let round = 0; round < perSection && spent < budget; round++) {
        let placedThisRound = false
        for (let i = 0; i < sections.length && spent < budget; i++) {
            if (taken[i] > round) continue
            if (sections[i].items.length <= round) continue
            taken[i] = round + 1
            spent++
            placedThisRound = true
        }
        if (!placedThisRound) break
    }

    const hasMenuSection = sections
        .map((section, i) => ({
            '@type': 'MenuSection',
            name: section.name,
            hasMenuItem: section.items.slice(0, taken[i]).map(menuItem),
        }))
        .filter((section) => section.hasMenuItem.length > 0)

    return {
        '@type': 'Menu',
        name: opts.name,
        url: opts.url,
        ...(opts.description ? { description: opts.description } : {}),
        hasMenuSection,
    }
}

export function jsonLd(data: unknown): string {
    // `<` is escaped so a food name containing markup cannot close the script element early.
    return JSON.stringify(data).replace(/</g, '\\u003c')
}
