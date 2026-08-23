import { compareMealPeriods } from '@/lib/utils'

export type OutlineEntry = {
    meal_period: string
    meal_station: string
    recipe_number: number
    master_food_items: {
        food_name: string | null
        calories_kcal: number | null
        protein_g: number | null
    } | null
}

export function groupByPeriodAndStation(entries: OutlineEntry[]) {
    const periods = new Map<string, Map<string, OutlineEntry[]>>()

    for (const entry of entries) {
        const stations = periods.get(entry.meal_period) ?? new Map<string, OutlineEntry[]>()
        const items = stations.get(entry.meal_station) ?? []
        items.push(entry)
        stations.set(entry.meal_station, items)
        periods.set(entry.meal_period, stations)
    }

    return Array.from(periods.entries())
        .sort(([a], [b]) => compareMealPeriods(a, b))
        .map(([period, stations]) => ({
            period,
            stations: Array.from(stations.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([station, items]) => ({
                    station,
                    items: items
                        .filter((i) => i.master_food_items?.food_name)
                        .sort((a, b) =>
                            (a.master_food_items?.food_name ?? '').localeCompare(
                                b.master_food_items?.food_name ?? '',
                            ),
                        ),
                }))
                .filter((s) => s.items.length > 0),
        }))
        .filter((p) => p.stations.length > 0)
}

/**
 * The full day's menu as plain server-rendered HTML.
 *
 * `MenuContainer` is the real interface, but it cannot answer a crawler: it virtualises past
 * 50 items, and its filter state reads `localStorage` behind `typeof window === 'undefined'`
 * guards that return `[]` on the server. The rendered response therefore carried 261 visible
 * words and no food names at all — the entire menu reached the browser only as an RSC payload,
 * which is why the brochure page at /chase-menu outranked the page that actually has the menu.
 *
 * This is a `<details>` rather than a hidden div on purpose. Collapsed content is indexed
 * normally under mobile-first indexing, and it is a disclosure a reader can genuinely open —
 * it also makes the page work with JavaScript off and gives screen readers a linear menu.
 */
export default function MenuOutline({
    entries,
    hallName,
    formattedDate,
}: {
    entries: OutlineEntry[]
    hallName: string
    formattedDate: string
}) {
    const grouped = groupByPeriodAndStation(entries)
    if (grouped.length === 0) return null

    const itemCount = grouped.reduce(
        (total, p) => total + p.stations.reduce((sum, s) => sum + s.items.length, 0),
        0,
    )

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-8">
            <details className="group rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between gap-4 rounded-2xl">
                    <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        Full {hallName} menu for {formattedDate}
                        <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
                            {itemCount} items
                        </span>
                    </span>
                    <span
                        aria-hidden
                        className="shrink-0 text-zinc-400 transition-transform group-open:rotate-180"
                    >
                        ▾
                    </span>
                </summary>

                <div className="px-6 pb-6 pt-2 space-y-8">
                    {grouped.map(({ period, stations }) => (
                        <div key={period}>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                                {hallName} {period}
                            </h2>
                            <div className="space-y-5">
                                {stations.map(({ station, items }) => (
                                    <div key={station}>
                                        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                                            {station}
                                        </h3>
                                        <ul className="space-y-1">
                                            {items.map((item) => (
                                                <li
                                                    key={`${station}-${item.recipe_number}`}
                                                    className="text-sm text-zinc-700 dark:text-zinc-300 flex flex-wrap gap-x-2"
                                                >
                                                    <span>{item.master_food_items?.food_name}</span>
                                                    {item.master_food_items?.calories_kcal != null && (
                                                        <span className="text-zinc-500 dark:text-zinc-500">
                                                            {item.master_food_items.calories_kcal} cal
                                                            {item.master_food_items.protein_g != null &&
                                                                ` · ${item.master_food_items.protein_g}g protein`}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </details>
        </section>
    )
}
