import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, FileText, MapPin, ShieldAlert, Store } from 'lucide-react'
import {
    getBrandBySlug,
    getBrands,
    getLocations,
    locationPath,
    type Location,
} from '@/lib/campus'
import { breadcrumbList, canonical, jsonLd, menuSchema } from '@/lib/seo'
import BrandItemsTable, { BrandCategoryNav } from '@/components/brands/BrandItemsTable'
import NutritionSourceLegend from '@/components/brands/NutritionSourceLegend'
import {
    formatStoredDate,
    groupByCategory,
    sourceSplit,
} from '@/components/brands/nutrition'

/** A brand republishes its nutrition sheet once or twice a year. A day is plenty. */
export const revalidate = 86400

interface PageProps {
    params: Promise<{ slug: string }>
}

/** One fetch per request even though metadata and the body both want the brand. */
const loadBrand = cache(getBrandBySlug)

export async function generateStaticParams() {
    try {
        const brands = await getBrands()
        return brands.map((brand) => ({ slug: brand.slug }))
    } catch (error) {
        // CI builds against a placeholder Supabase URL. Returning nothing here leaves every
        // brand page to render on demand instead of failing the build.
        console.error('[/brands/[slug]] generateStaticParams failed:', error)
        return []
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params

    let brand: Awaited<ReturnType<typeof getBrandBySlug>> = null
    try {
        brand = await loadBrand(slug)
    } catch (error) {
        console.error(`[/brands/${slug}] metadata lookup failed:`, error)
    }

    if (!brand) {
        return { title: 'Brand not found', robots: { index: false, follow: true } }
    }

    const path = `/brands/${brand.slug}`
    const split = sourceSplit(brand.external_food_items)
    const lower = brand.name.toLowerCase()
    const title = `${brand.name} at UNC: Menu & Nutrition`
    const description =
        `Calories, protein, fat, carbs and allergens for ${split.total} ${brand.name} items at UNC Chapel Hill. ` +
        `${split.published} figures published by ${brand.name}, ${split.estimated} estimated by Eat UNC with the derivation shown on every row.`

    return {
        title: { absolute: `${title} | Eat UNC` },
        description,
        keywords: [
            `unc ${lower}`,
            `${lower} unc`,
            `${lower} unc chapel hill`,
            `${lower} nutrition`,
            `${lower} calories`,
            'unc campus food',
            'unc dining',
        ],
        openGraph: {
            title,
            description,
            url: canonical(path),
            siteName: 'UNC Dining Menu',
            type: 'website',
        },
        twitter: { card: 'summary_large_image', title, description },
        alternates: { canonical: canonical(path) },
    }
}

export default async function BrandPage({ params }: PageProps) {
    const { slug } = await params
    const brand = await loadBrand(slug)
    if (!brand) notFound()

    let locations: Location[] = []
    try {
        locations = (await getLocations()).filter((l) => l.brand_id === brand.id)
    } catch (error) {
        // Secondary information. The nutrition table is the page; venues are context.
        console.error(`[/brands/${slug}] getLocations failed:`, error)
    }

    const items = brand.external_food_items ?? []
    const split = sourceSplit(items)
    const groups = groupByCategory(items)
    const path = `/brands/${brand.slug}`
    const collectedOn = formatStoredDate(brand.scraped_at)
    const withAllergens = items.filter((item) => Boolean(item.allergens)).length

    // Two venues can share a slug (Alpaca operates in Lenoir and at the Beach Café), and both
    // resolve to the same `/locations/<slug>` page by design — so link once, label twice.
    const venueLinks = new Map<string, { path: string; labels: string[] }>()
    for (const location of locations) {
        const href = locationPath(location)
        const entry = venueLinks.get(href) ?? { path: href, labels: [] }
        const label = location.venue_group
        if (!entry.labels.includes(label)) entry.labels.push(label)
        venueLinks.set(href, entry)
    }

    const restaurant = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: brand.name,
        url: canonical(path),
        description: `${brand.name} operates on the University of North Carolina at Chapel Hill campus. This page lists ${split.total} items with calories, protein, fat, carbohydrates and allergens.`,
        sameAs: brand.source_url ? [brand.source_url] : undefined,
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Chapel Hill',
            addressRegion: 'NC',
            addressCountry: 'US',
        },
        areaServed: {
            '@type': 'Place',
            name: 'University of North Carolina at Chapel Hill',
        },
        ...(locations.length
            ? {
                  containedInPlace: locations.map((location) => ({
                      '@type': 'Place',
                      name: location.display_label,
                      address: {
                          '@type': 'PostalAddress',
                          addressLocality: 'Chapel Hill',
                          addressRegion: 'NC',
                          addressCountry: 'US',
                      },
                  })),
              }
            : {}),
        ...(groups.length
            ? {
                  hasMenu: menuSchema({
                      name: `${brand.name} menu at UNC Chapel Hill`,
                      url: canonical(path),
                      description: `${split.published} of ${split.total} figures are published by ${brand.name}; the remaining ${split.estimated} are estimated by Eat UNC and labelled as such.`,
                      sections: groups.map((group) => ({
                          name: group.category,
                          items: group.items.map((item) => ({
                              name: item.item_name,
                              calories_kcal: item.calories_kcal,
                              protein_g: item.protein_g,
                              fat_g: item.fat_g,
                              carbohydrates_g: item.carbohydrates_g,
                              amount_per_serving: item.serving_description,
                              dietary_preferences: item.dietary_preferences,
                              allergens: item.allergens,
                          })),
                      })),
                  }),
              }
            : {}),
    }

    const breadcrumbs = breadcrumbList([
        { name: 'Eat UNC', path: '/' },
        { name: 'Campus restaurants', path: '/brands' },
        { name: brand.name, path },
    ])

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd(restaurant) }}
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
                        <Link
                            href="/brands"
                            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                            Campus restaurants
                        </Link>
                        <span className="mx-2 text-zinc-300">/</span>
                        <span className="text-zinc-700 dark:text-zinc-300">{brand.name}</span>
                    </nav>

                    <div className="flex items-start gap-5 mb-6">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#4B9CD3]/10 border border-[#4B9CD3]/20 flex items-center justify-center shrink-0">
                            <Store className="w-7 h-7 md:w-8 md:h-8 text-[#4B9CD3]" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                                {brand.name} at UNC: Menu &amp; Nutrition
                            </h1>
                            {venueLinks.size > 0 && (
                                <p className="text-lg text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
                                    <MapPin className="w-4 h-4 mt-1.5 shrink-0" aria-hidden="true" />
                                    <span>
                                        {Array.from(venueLinks.values())
                                            .flatMap((entry) => entry.labels)
                                            .join(' · ')}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>

                    <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-3xl leading-relaxed mb-8">
                        {split.total > 0 ? (
                            <>
                                {split.total} {brand.name} items served on the UNC Chapel Hill campus,
                                with calories, protein, fat and carbohydrates for each.{' '}
                                {split.published > 0 && split.estimated > 0 ? (
                                    <>
                                        {split.published} of those figures come straight from{' '}
                                        {brand.name}; the other {split.estimated} are estimated by Eat
                                        UNC and every one of them shows its own working.
                                    </>
                                ) : split.estimated > 0 ? (
                                    <>
                                        {brand.name} publishes no nutrition figures, so all{' '}
                                        {split.estimated} are estimated by Eat UNC — each row shows
                                        exactly how.
                                    </>
                                ) : (
                                    <>Every figure here is published by {brand.name} itself.</>
                                )}{' '}
                                {withAllergens} of the {split.total} carry an allergen list.
                            </>
                        ) : (
                            <>
                                We do not have nutrition on file for {brand.name} yet. The coverage note
                                below records exactly what has and has not been collected.
                            </>
                        )}
                    </p>

                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                        <Stat label="Items" value={split.total} />
                        <Stat label="Published figures" value={split.published} tone="emerald" />
                        <Stat label="Estimated figures" value={split.estimated} tone="amber" />
                        <Stat label="With an allergen list" value={withAllergens} />
                    </dl>

                    {/* Where the numbers came from — the operator's own document, named and linked. */}
                    <section className="mb-8 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#4B9CD3]/10 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-[#4B9CD3]" aria-hidden="true" />
                            </div>
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                                Where this data came from
                            </h2>
                        </div>

                        {brand.source_url && (
                            <p className="mb-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Source document:{' '}
                                <a
                                    href={brand.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer nofollow"
                                    className="inline-flex items-center gap-1 text-[#4B9CD3] hover:underline break-all"
                                >
                                    {brand.source_url}
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                </a>
                                {collectedOn && (
                                    <span className="text-zinc-500"> · collected {collectedOn}</span>
                                )}
                            </p>
                        )}

                        {brand.coverage_note && (
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                                    Coverage note
                                </h3>
                                {/* Verbatim. This is the record of what was and was not covered, and
                                    paraphrasing it would be the one edit that makes it worthless. */}
                                <blockquote className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border-l-4 border-[#4B9CD3] text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                                    {brand.coverage_note}
                                </blockquote>
                            </div>
                        )}
                    </section>

                    {venueLinks.size > 0 && (
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                                Where to find {brand.name} on campus
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {Array.from(venueLinks.values()).map((entry) => (
                                    <Link
                                        key={entry.path}
                                        href={entry.path}
                                        className="group flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-[#4B9CD3] transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                            <MapPin className="w-5 h-5 text-amber-600" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-[#4B9CD3] transition-colors">
                                                {entry.labels.join(' & ')}
                                            </p>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                Hours and what else is in the building
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="mb-8">
                        <NutritionSourceLegend />
                    </div>

                    {items.length > 0 && (
                        <>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                                {brand.name} nutrition, item by item
                            </h2>
                            <div className="mb-6">
                                <BrandCategoryNav items={items} />
                            </div>
                            <BrandItemsTable items={items} />
                        </>
                    )}

                    <div className="mt-10 flex gap-3 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Eat UNC is an independent student project. It is not affiliated with,
                            endorsed by or sponsored by {brand.name}, the University of North Carolina at
                            Chapel Hill, or Carolina Dining Services. Menus, recipes and preparation
                            change without notice, and a campus location can differ from the national
                            menu. If a number matters medically, confirm it with the operator.
                        </p>
                    </div>

                    <div className="mt-8">
                        <Link
                            href="/brands"
                            className="inline-flex items-center gap-2 text-[#4B9CD3] hover:underline font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                            All campus restaurants with nutrition
                        </Link>
                    </div>
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
