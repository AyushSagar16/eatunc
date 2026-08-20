import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, HelpCircle, Smartphone, Store, Utensils } from 'lucide-react'
import { getBrands, getLocations, type ExternalBrand, type Location } from '@/lib/campus'
import { supabase } from '@/lib/supabase'
import { breadcrumbList, canonical, jsonLd } from '@/lib/seo'
import BrandCard from '@/components/brands/BrandCard'
import NutritionSourceLegend from '@/components/brands/NutritionSourceLegend'
import { sourceSplit, type SourceSplit } from '@/components/brands/nutrition'

/**
 * Brand nutrition changes when an operator republishes a PDF, which is a matter of months, not
 * hours. A day-long revalidate keeps this page static in practice while still letting a seed
 * reload reach it without a deploy.
 */
export const revalidate = 86400

const PATH = '/brands'

export const metadata: Metadata = {
    title: { absolute: 'Nutrition for Campus Restaurants at UNC | Eat UNC' },
    description:
        'Calories, protein, fat, carbs and allergens for the third-party restaurants on UNC Chapel Hill campus — Chick-fil-A, Bojangles, Subway, Bento Sushi, the food trucks and more. Every figure is marked published or estimated.',
    keywords: [
        'unc chick fil a',
        'unc bojangles',
        'bojangles unc chapel hill',
        'lenoir chick fil a',
        'unc subway',
        'unc campus food',
        'unc campus restaurants nutrition',
        'unc food trucks',
        'unc dining nutrition',
    ],
    openGraph: {
        title: 'Nutrition for Campus Restaurants at UNC',
        description:
            'Calories, protein, fat, carbs and allergens for every third-party restaurant on UNC Chapel Hill campus, with each number marked published or estimated.',
        url: canonical(PATH),
        siteName: 'UNC Dining Menu',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Nutrition for Campus Restaurants at UNC',
        description:
            'Calories, protein, fat, carbs and allergens for every third-party restaurant on UNC Chapel Hill campus.',
    },
    alternates: { canonical: canonical(PATH) },
}

type ItemSourceRow = { brand_id: string; nutrition_source: string }

/**
 * Just the two columns the index needs, paginated.
 *
 * 830 rows sits close enough to Supabase's 1000-row ceiling that a flat unpaginated select is a
 * silent truncation waiting for the next brand to be seeded — the same reason `campus.ts`
 * paginates hours rather than nesting them.
 */
async function fetchItemSourceRows(): Promise<ItemSourceRow[]> {
    const PAGE_SIZE = 1000
    const all: ItemSourceRow[] = []
    let offset = 0

    for (;;) {
        const { data, error } = await supabase
            .from('external_food_items')
            .select('brand_id, nutrition_source')
            .range(offset, offset + PAGE_SIZE - 1)

        if (error) throw error
        if (!data?.length) break
        all.push(...data)
        if (data.length < PAGE_SIZE) break
        offset += PAGE_SIZE
    }

    return all
}

/** CI builds against a placeholder Supabase URL, and a page must never blank out on a bad night. */
async function safely<T>(label: string, load: () => Promise<T>, fallback: T): Promise<T> {
    try {
        return await load()
    } catch (error) {
        console.error(`[/brands] ${label} failed:`, error)
        return fallback
    }
}

export default async function BrandsPage() {
    const [brands, locations, itemRows] = await Promise.all([
        safely('getBrands', getBrands, [] as ExternalBrand[]),
        safely('getLocations', getLocations, [] as Location[]),
        safely('fetchItemSourceRows', fetchItemSourceRows, [] as ItemSourceRow[]),
    ])

    const rowsByBrand = new Map<string, ItemSourceRow[]>()
    for (const row of itemRows) {
        const bucket = rowsByBrand.get(row.brand_id)
        if (bucket) bucket.push(row)
        else rowsByBrand.set(row.brand_id, [row])
    }

    const venueGroupsByBrand = new Map<string, string[]>()
    for (const location of locations) {
        if (!location.brand_id) continue
        const groups = venueGroupsByBrand.get(location.brand_id) ?? []
        if (!groups.includes(location.venue_group)) groups.push(location.venue_group)
        venueGroupsByBrand.set(location.brand_id, groups)
    }

    const cards = brands
        .map((brand) => ({
            brand,
            split: sourceSplit(rowsByBrand.get(brand.id) ?? []),
            venueGroups: venueGroupsByBrand.get(brand.id) ?? [],
        }))
        .sort((a, b) => b.split.total - a.split.total || a.brand.name.localeCompare(b.brand.name))

    const totals: SourceSplit = cards.reduce(
        (acc, card) => ({
            total: acc.total + card.split.total,
            published: acc.published + card.split.published,
            estimated: acc.estimated + card.split.estimated,
        }),
        { total: 0, published: 0, estimated: 0 }
    )

    const venueCount = locations.filter((l) => l.brand_id).length

    const itemList = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Third-party restaurants on UNC Chapel Hill campus with nutrition data',
        description:
            'Campus restaurants, chains and food trucks at UNC Chapel Hill for which Eat UNC publishes calories, protein, fat, carbohydrates and allergens.',
        url: canonical(PATH),
        numberOfItems: cards.length,
        itemListElement: cards.map((card, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: card.brand.name,
            url: canonical(`/brands/${card.brand.slug}`),
        })),
    }

    const breadcrumbs = breadcrumbList([
        { name: 'Eat UNC', path: '/' },
        { name: 'Campus restaurants', path: PATH },
    ])

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd(itemList) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }}
            />

            <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">
                    <nav aria-label="Breadcrumb" className="mb-8 text-sm text-zinc-500">
                        <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            Home
                        </Link>
                        <span className="mx-2 text-zinc-300">/</span>
                        <span className="text-zinc-700 dark:text-zinc-300">Campus restaurants</span>
                    </nav>

                    <div className="flex items-start gap-5 mb-6">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#4B9CD3]/10 border border-[#4B9CD3]/20 flex items-center justify-center shrink-0">
                            <Store className="w-7 h-7 md:w-8 md:h-8 text-[#4B9CD3]" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                                Nutrition for Campus Restaurants at UNC
                            </h1>
                            <p className="text-lg text-zinc-500 dark:text-zinc-400">
                                Chapel Hill · the chains, cafés and food trucks outside the dining halls
                            </p>
                        </div>
                    </div>

                    <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-3xl leading-relaxed mb-4">
                        Chase and Top of Lenoir publish nutrition for every recipe they serve. The rest
                        of campus does not. This is the calorie, protein, fat, carbohydrate and allergen
                        data we have collected for the third-party restaurants that operate at UNC
                        Chapel Hill — Chick-fil-A and Bento Sushi in Lenoir, Bojangles in the Carolina
                        Union, Subway in Chase, the Beach Café vendors, and the food trucks.
                    </p>
                    <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-3xl leading-relaxed mb-8">
                        Every number is marked with where it came from. Nothing we derived is dressed up
                        as something the brand disclosed.
                    </p>

                    {totals.total > 0 && (
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                            <Stat label="Brands" value={cards.length} />
                            <Stat label="Items with nutrition" value={totals.total} />
                            <Stat
                                label="Published by the operator"
                                value={totals.published}
                                tone="emerald"
                            />
                            <Stat label="Estimated by Eat UNC" value={totals.estimated} tone="amber" />
                        </dl>
                    )}

                    <div className="mb-10">
                        <NutritionSourceLegend />
                    </div>

                    <section className="mb-10 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Why campus restaurants are harder than the dining halls
                        </h2>
                        <div className="space-y-4 text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl">
                            <p>
                                A dining hall dish is a recipe. UNC&apos;s kitchens cost every recipe out
                                in a system that returns calories, macros, allergens and dietary flags
                                for each one, and that is what the Chase and Top of Lenoir menus on this
                                site are built from. Ask for &ldquo;Bacon&rdquo; and you get the same
                                numbers whichever hall is serving it, because it is the same recipe
                                number underneath.
                            </p>
                            <p>
                                A third-party restaurant is a business. It brings its own recipes, its
                                own suppliers and its own disclosure policy onto campus, and UNC&apos;s
                                recipe system never sees any of it. So the data comes from wherever that
                                operator chose to put it — and those choices are wildly different. A
                                national chain publishes a full nutrition calculator. A regional chain
                                posts a single wall sign as a PDF. A local café publishes an allergen
                                guide with no calories anywhere on it. A food truck publishes a menu and
                                nothing else.
                            </p>
                            <p>
                                We could have shipped only the brands that publish everything, which
                                would have left most of campus blank. We could have quietly filled the
                                gaps with numbers of our own and let them look official, which is what
                                most calorie databases do. We did neither. Where an operator publishes a
                                figure we transcribe it and say so. Where it publishes nothing, we build
                                an estimate from the ingredients its own menu names and USDA reference
                                data, print the derivation on the row, and label it{' '}
                                <strong className="text-zinc-900 dark:text-zinc-100">Estimated</strong>{' '}
                                so you can weigh it yourself.
                            </p>
                            <p>
                                Two things stay off-limits either way. Allergen lists are never derived —
                                they are copied verbatim or left empty, because a guessed allergen list
                                is a safety problem, not a data problem. And a dietary claim that an
                                item&apos;s own allergen list contradicts gets dropped rather than
                                reconciled.
                            </p>
                        </div>
                    </section>

                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                        Every brand we have nutrition for
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                        {cards.length > 0
                            ? `${cards.length} operators across ${venueCount} campus locations, biggest data set first.`
                            : 'Brand data is being loaded — check back shortly.'}
                    </p>

                    {cards.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cards.map((card) => (
                                <BrandCard
                                    key={card.brand.id}
                                    brand={card.brand}
                                    split={card.split}
                                    venueGroups={card.venueGroups}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <p className="text-zinc-600 dark:text-zinc-400">
                                We could not load the brand list just now. The dining hall menus are
                                unaffected —{' '}
                                <Link href="/chase-menu" className="text-[#4B9CD3] hover:underline">
                                    Chase
                                </Link>{' '}
                                and{' '}
                                <Link href="/lenoir-menu" className="text-[#4B9CD3] hover:underline">
                                    Top of Lenoir
                                </Link>{' '}
                                are still there.
                            </p>
                        </div>
                    )}

                    <section className="mt-12 grid sm:grid-cols-3 gap-4">
                        <CrossLink
                            href="/chase-menu"
                            icon={<Utensils className="w-5 h-5 text-blue-500" aria-hidden="true" />}
                            title="Dining hall menus"
                            body="Chase and Top of Lenoir, by meal period and station, with nutrition on every item."
                        />
                        <CrossLink
                            href="/faq"
                            icon={<HelpCircle className="w-5 h-5 text-amber-600" aria-hidden="true" />}
                            title="UNC dining FAQ"
                            body="Hours, meal swipes, PLUS Swipes, Flex and what Carolina Dining Services actually is."
                        />
                        <CrossLink
                            href="/unc-dining-app"
                            icon={<Smartphone className="w-5 h-5 text-[#4B9CD3]" aria-hidden="true" />}
                            title="The iPhone app"
                            body="Log what you ate from any of these brands and track the macros for the day."
                        />
                    </section>

                    <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
                        Eat UNC is a student project. It is not affiliated with, endorsed by or sponsored
                        by the University of North Carolina at Chapel Hill, Carolina Dining Services, or
                        any of the brands listed here. Brand names and trademarks belong to their owners.
                        Menus and recipes change; confirm anything that matters medically with the
                        operator.
                    </p>
                </div>
            </main>
        </>
    )
}

function Stat({
    label,
    value,
    tone,
}: {
    label: string
    value: number
    tone?: 'emerald' | 'amber'
}) {
    const valueTone =
        tone === 'emerald'
            ? 'text-emerald-700 dark:text-emerald-400'
            : tone === 'amber'
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-zinc-900 dark:text-zinc-50'

    return (
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{label}</dt>
            <dd className={`text-2xl font-bold tabular-nums ${valueTone}`}>{value}</dd>
        </div>
    )
}

function CrossLink({
    href,
    icon,
    title,
    body,
}: {
    href: string
    icon: React.ReactNode
    title: string
    body: string
}) {
    return (
        <Link
            href={href}
            className="group p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-[#4B9CD3] transition-colors"
        >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                {icon}
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-1 flex items-center gap-1">
                {title}
                <ArrowRight
                    className="w-3.5 h-3.5 text-zinc-300 group-hover:text-[#4B9CD3] transition-colors"
                    aria-hidden="true"
                />
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{body}</p>
        </Link>
    )
}
