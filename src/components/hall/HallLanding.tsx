import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, MapPin, UtensilsCrossed } from 'lucide-react'
import {
    campusToday,
    getHoursForLocations,
    getLocationsBySlug,
    getMenuPreview,
    shiftDate,
    type HallInfo,
    type LocationHours,
    type MenuPreviewItem,
} from '@/lib/campus'
import { breadcrumbList, canonical, jsonLd, type Faq } from '@/lib/seo'
import { compareMealPeriods } from '@/lib/utils'
import { hallRestaurantNode } from './hallSchema'

/**
 * The shared shape of /chase-menu and /lenoir-menu.
 *
 * The two pages were 75% the same file with different nouns; the scaffolding lives here once
 * and each page supplies only what makes it that hall — the SEO copy, the second card, the
 * FAQ answers. Layout changes now happen in one place instead of drifting between two.
 */

export type HallLandingData = {
    today: string
    periods: [string, MenuPreviewItem[]][]
    hours: LocationHours[]
    weekHours: LocationHours[]
}

/**
 * Shared fetch sequence. These throw on failure deliberately: under ISR a swallowed error
 * would bake an empty page — with the FAQ asserting the hall is closed — and serve it for
 * 15 minutes. A failed regeneration keeps the last good page instead.
 */
export async function loadHallLanding(hall: HallInfo): Promise<HallLandingData> {
    const today = campusToday()

    const [locations, preview] = await Promise.all([
        getLocationsBySlug(hall.locationSlug),
        getMenuPreview(hall.diningHall, today),
    ])

    let hours: LocationHours[] = []
    let weekHours: LocationHours[] = []
    if (locations.length > 0) {
        weekHours = await getHoursForLocations(
            locations.map((l) => l.id),
            today,
            shiftDate(today, 6),
        )
        hours = weekHours.filter((h) => h.service_date === today)
    }

    const byPeriod = new Map<string, MenuPreviewItem[]>()
    for (const item of preview) {
        byPeriod.set(item.period, [...(byPeriod.get(item.period) ?? []), item])
    }
    const periods = Array.from(byPeriod.entries()).sort(([a], [b]) => compareMealPeriods(a, b))

    return { today, periods, hours, weekHours }
}

const ACCENTS = {
    blue: {
        tile: 'bg-blue-500/10 border-blue-400/20',
        icon: 'text-blue-500',
        cta: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25',
        link: 'text-blue-600 dark:text-blue-400',
        faqPanel:
            'from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/30',
    },
    teal: {
        tile: 'bg-teal-500/10 border-teal-400/20',
        icon: 'text-teal-500',
        cta: 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/25',
        link: 'text-teal-600 dark:text-teal-400',
        faqPanel:
            'from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20 border-teal-200/50 dark:border-teal-800/30',
    },
} as const

/** A landing-page link in the hall's accent colour, for the footer row and card footnotes. */
export function AccentLink({
    hall,
    href,
    children,
    bold = false,
}: {
    hall: HallInfo
    href: string
    children: ReactNode
    bold?: boolean
}) {
    const accent = ACCENTS[hall.accent]
    return (
        <Link href={href} className={`${accent.link} ${bold ? 'font-semibold ' : ''}hover:underline`}>
            {children}
        </Link>
    )
}

export default function HallLanding({
    hall,
    data,
    heading,
    intro,
    ctaLabel,
    hoursTitle,
    hoursFootnote,
    hoursEmpty,
    secondCard,
    menuHeading,
    faqHeading,
    faqs,
    footerLinks,
}: {
    hall: HallInfo
    data: HallLandingData
    heading: string
    intro: ReactNode
    ctaLabel: string
    hoursTitle: string
    /** Shown under the hours rows when today has service periods. */
    hoursFootnote: ReactNode
    /** Shown instead of rows when today has none. */
    hoursEmpty: ReactNode
    /** The card beside the hours — the one part of the grid each hall does differently. */
    secondCard: ReactNode
    menuHeading: string
    faqHeading: string
    faqs: Faq[]
    footerLinks: ReactNode
}) {
    const accent = ACCENTS[hall.accent]
    const { today, periods, hours, weekHours } = data

    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            hallRestaurantNode({
                routeSlug: hall.routeSlug,
                id: `${canonical(hall.landingPath)}#restaurant`,
                url: canonical(hall.landingPath),
                hours: weekHours,
            }),
            // The Q&A stays visible on the page, but FAQPage markup lives on /faq alone —
            // near-duplicate FAQPage blocks across pages read as spam to Google.
            breadcrumbList([
                { name: 'Eat UNC', path: '/' },
                { name: hall.displayName, path: hall.landingPath },
            ]),
        ].filter(Boolean),
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
            />
            <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 transition-colors"
                    >
                        ← Eat UNC
                    </Link>

                    <div className="flex items-start gap-5 mb-6">
                        <div
                            className={`w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 ${accent.tile}`}
                        >
                            <UtensilsCrossed className={`w-8 h-8 ${accent.icon}`} />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                                {heading}
                            </h1>
                            <p className="text-lg text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                UNC Chapel Hill · {hall.campus}
                            </p>
                        </div>
                    </div>

                    <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mb-8 leading-relaxed">
                        {intro}
                    </p>

                    <Link
                        href={`/${hall.routeSlug}/${today}`}
                        className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all shadow-lg hover:-translate-y-0.5 ${accent.cta}`}
                    >
                        {ctaLabel}
                        <ArrowRight className="w-5 h-5" />
                    </Link>

                    <div className="grid md:grid-cols-2 gap-6 mt-12">
                        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                                    {hoursTitle}
                                </h2>
                            </div>
                            {hours.length > 0 ? (
                                <div className="space-y-3 text-zinc-600 dark:text-zinc-400">
                                    {hours.map((row) => (
                                        <div key={row.id} className="flex justify-between gap-4">
                                            <span>{row.period_name}</span>
                                            <span className="font-medium tabular-nums">
                                                {row.opens_label} – {row.closes_label}
                                            </span>
                                        </div>
                                    ))}
                                    <p className="text-sm text-zinc-500 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                        {hoursFootnote}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-zinc-600 dark:text-zinc-400">{hoursEmpty}</p>
                            )}
                        </section>

                        {secondCard}
                    </div>

                    {periods.length > 0 && (
                        <section className="mt-12">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                                {menuHeading}
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {periods.map(([period, items]) => (
                                    <div
                                        key={period}
                                        className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                                    >
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                                            {period}
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {items.slice(0, 10).map((i) => i.name).join(' · ')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section
                        className={`mt-12 p-8 rounded-2xl bg-gradient-to-br border ${accent.faqPanel}`}
                    >
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            {faqHeading}
                        </h2>
                        <dl className="space-y-5">
                            {faqs.map((faq) => (
                                <div key={faq.question}>
                                    <dt className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {faq.question}
                                    </dt>
                                    <dd className="mt-1 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                        {faq.answer}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">{footerLinks}</div>
                </div>
            </main>
        </>
    )
}

/** The white card shell the grid uses, exported so each hall's second card matches. */
export function HallCard({
    icon,
    title,
    children,
}: {
    icon: ReactNode
    title: string
    children: ReactNode
}) {
    return (
        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                {icon}
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
            </div>
            {children}
        </section>
    )
}
