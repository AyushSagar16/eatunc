import type { ExternalFoodItem } from '@/lib/campus'
import NutritionSourceBadge from './NutritionSourceBadge'
import {
    categorySlug,
    ESTIMATED,
    formatNumber,
    groupByCategory,
    splitLabels,
    type CategoryGroup,
} from './nutrition'

/**
 * The full item table, grouped by the operator's own categories.
 *
 * Everything renders on the server — no client filtering, no virtualisation, no Suspense — so
 * the numbers, the allergens and every estimated row's derivation are all in the HTML a crawler
 * receives. The only concession to width is that each category's table scrolls inside its own
 * container, so a 7-column table never makes the page body scroll sideways on a phone.
 */
export default function BrandItemsTable({ items }: { items: ExternalFoodItem[] }) {
    const groups = groupByCategory(items)

    if (groups.length === 0) {
        return (
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <p className="text-zinc-600 dark:text-zinc-400">
                    We do not have any items on file for this brand yet.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {groups.map((group) => (
                <CategorySection key={group.category} group={group} />
            ))}
        </div>
    )
}

/** Anchor links to each category. Plain anchors, so they work with JavaScript switched off. */
export function BrandCategoryNav({ items }: { items: ExternalFoodItem[] }) {
    const groups = groupByCategory(items)
    if (groups.length < 2) return null

    return (
        <nav aria-label="Menu categories" className="flex flex-wrap gap-2">
            {groups.map((group) => (
                <a
                    key={group.category}
                    href={`#${categorySlug(group.category)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-[#4B9CD3] hover:text-[#4B9CD3] transition-colors"
                >
                    {group.category}
                    <span className="text-xs text-zinc-400">{group.items.length}</span>
                </a>
            ))}
        </nav>
    )
}

function CategorySection({ group }: { group: CategoryGroup }) {
    return (
        <section id={categorySlug(group.category)} className="scroll-mt-24">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                {group.category}
                <span className="ml-2 text-sm font-medium text-zinc-500">
                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                </span>
            </h3>

            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm border-collapse">
                        <caption className="sr-only">
                            {group.category} — calories, protein, fat, carbohydrates, allergens and
                            whether each figure is published by the operator or estimated by Eat UNC.
                        </caption>
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-left">
                                <th scope="col" className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                                    Item
                                </th>
                                <th scope="col" className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                                    Serving
                                </th>
                                <th scope="col" className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 text-right whitespace-nowrap">
                                    Cal
                                </th>
                                <th scope="col" className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 text-right whitespace-nowrap">
                                    Protein
                                </th>
                                <th scope="col" className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 text-right whitespace-nowrap">
                                    Fat
                                </th>
                                <th scope="col" className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 text-right whitespace-nowrap">
                                    Carbs
                                </th>
                                <th scope="col" className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                                    Nutrition data
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.items.map((item) => (
                                <ItemRow key={item.item_key || item.id} item={item} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

function ItemRow({ item }: { item: ExternalFoodItem }) {
    const allergens = splitLabels(item.allergens)
    const diets = splitLabels(item.dietary_preferences)
    const isEstimated = item.nutrition_source === ESTIMATED

    return (
        <tr className="border-t border-zinc-100 dark:border-zinc-800 align-top">
            <th scope="row" className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-zinc-100 max-w-[22rem]">
                <span className="block">{item.item_name}</span>

                {(allergens.length > 0 || diets.length > 0 || !item.allergens) && (
                    <span className="mt-1.5 flex flex-wrap gap-1">
                        {diets.map((diet) => (
                            <span
                                key={`d-${diet}`}
                                className="inline-flex items-center rounded-md bg-green-500/10 px-1.5 py-0.5 text-[11px] font-medium text-green-700 dark:text-green-400"
                            >
                                {diet}
                            </span>
                        ))}
                        {allergens.map((allergen) => (
                            <span
                                key={`a-${allergen}`}
                                title={`Contains ${allergen}`}
                                className="inline-flex items-center rounded-md bg-red-500/10 px-1.5 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-400"
                            >
                                {allergen}
                            </span>
                        ))}
                        {!item.allergens && (
                            <span className="text-[11px] font-normal text-zinc-500">
                                No allergen list on file — not a claim that it is allergen-free
                            </span>
                        )}
                    </span>
                )}
            </th>

            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 max-w-[16rem]">
                {item.serving_description || '—'}
            </td>
            <td className="px-3 py-3 text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                {formatNumber(item.calories_kcal)}
            </td>
            <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                {formatNumber(item.protein_g)}
                {item.protein_g != null && <span className="text-zinc-400"> g</span>}
            </td>
            <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                {formatNumber(item.fat_g)}
                {item.fat_g != null && <span className="text-zinc-400"> g</span>}
            </td>
            <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                {formatNumber(item.carbohydrates_g)}
                {item.carbohydrates_g != null && <span className="text-zinc-400"> g</span>}
            </td>

            <td className="px-4 py-3 max-w-[20rem]">
                <NutritionSourceBadge source={item.nutrition_source} />
                {isEstimated && item.nutrition_basis && (
                    <details className="mt-2 group">
                        <summary className="cursor-pointer text-xs font-medium text-[#4B9CD3] hover:underline marker:text-zinc-400">
                            How this was estimated
                        </summary>
                        <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {item.nutrition_basis}
                        </p>
                    </details>
                )}
                {isEstimated && !item.nutrition_basis && (
                    <p className="mt-1.5 text-xs text-zinc-500">Derivation not recorded.</p>
                )}
            </td>
        </tr>
    )
}
