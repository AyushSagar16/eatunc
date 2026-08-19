import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Clock, MapPin, Soup, Truck, Utensils } from 'lucide-react'

import { getOpenNow, locationPath } from '@/lib/campus'
import type { Location, OpenPeriod } from '@/lib/campus'
import { breadcrumbList, canonical } from '@/lib/seo'
import { Badge, Breadcrumbs, CampusPage, Card, IconTile, Prose, Stat } from '@/components/campus/CampusChrome'
import { JsonLd } from '@/components/campus/JsonLd'
import { VenueCard } from '@/components/campus/VenueCard'
import { groupByBuilding, kindMeta } from '@/components/campus/campusDisplay'

/**
 * Open-now badges make this page's output depend on the clock, so it can never be a frozen
 * static build. Five minutes is short enough that a badge is not meaningfully wrong and long
 * enough that a crawl does not hit Supabase 42 times a minute; `/open-now` is the live answer.
 */
export const revalidate = 300

const PATH = '/locations'
const TITLE = 'UNC Campus Dining Locations — Every Venue, Building by Building'
const DESCRIPTION =
    'Every UNC Chapel Hill campus dining location, grouped by building: the Chase and Top of Lenoir dining halls, the Bottom of Lenoir and Beach Cafe food courts, department cafes, markets and food trucks — with hours and menus for each.'

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    keywords: [
        'unc campus dining',
        'unc restaurants',
        'unc campus food',
        'unc food court',
        'bottom of lenoir',
        'unc beach cafe',
        'unc dining locations',
        'food on campus unc',
    ],
    alternates: { canonical: canonical(PATH) },
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        url: canonical(PATH),
        siteName: 'Eat UNC',
        type: 'website',
    },
    twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

const CRUMBS = [
    { name: 'Eat UNC', path: '/' },
    { name: 'Campus Dining Locations', path: PATH },
]

type PageData = { locations: Location[]; open: OpenPeriod[]; failed: boolean }

async function loadLocations(): Promise<PageData> {
    try {
        const { locations, open } = await getOpenNow()
        return { locations, open, failed: false }
    } catch {
        return { locations: [], open: [], failed: true }
    }
}

export default async function LocationsIndexPage() {
    const { locations, open, failed } = await loadLocations()

    const openByLocation = new Map<string, OpenPeriod>()
    for (const period of open) {
        if (!openByLocation.has(period.location.id)) openByLocation.set(period.location.id, period)
    }

    const buildings = groupByBuilding(locations)
    const halls = locations.filter((l) => l.kind === 'dining_hall')
    const withUncMenu = locations.filter((l) => l.kind === 'unc_menu')
    const brands = locations.filter((l) => l.kind === 'external')
    const markets = locations.filter((l) => l.kind === 'retail')
    const openCount = openByLocation.size

    // One entry per destination URL: the four colliding slugs share a page, and the two halls
    // keep their historic /chase and /lenoir URLs.
    const listed = new Map<string, string>()
    for (const location of locations) {
        const path = locationPath(location)
        if (!listed.has(path)) listed.set(path, location.display_label)
    }

    const itemList = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'UNC Chapel Hill campus dining locations',
        description: DESCRIPTION,
        url: canonical(PATH),
        numberOfItems: listed.size,
        itemListOrder: 'https://schema.org/ItemListUnordered',
        itemListElement: Array.from(listed.entries()).map(([path, name], i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name,
            url: canonical(path),
        })),
    }

    return (
        <CampusPage>
            <JsonLd data={itemList} />
            <JsonLd data={breadcrumbList(CRUMBS)} />

            <Breadcrumbs crumbs={CRUMBS} />

            <header className="mb-8">
                <div className="flex items-start gap-4">
                    <IconTile className="w-12 h-12 bg-[#4B9CD3]/10 text-[#2c6f9e] dark:text-[#7cc0ec]">
                        <MapPin className="w-6 h-6" />
                    </IconTile>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            UNC Campus Dining Locations
                        </h1>
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                            Every place UNC Chapel Hill currently serves food, grouped by the building it is in.
                        </p>
                    </div>
                </div>
            </header>

            {failed ? (
                <Card className="p-6">
                    <p className="text-zinc-600 dark:text-zinc-300">
                        The campus location list could not be loaded right now. Try again in a few minutes, or go
                        straight to the <Link href="/hours" className="underline">hours page</Link>.
                    </p>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                        <Stat value={locations.length} label="venues listed" />
                        <Stat value={buildings.length} label="buildings" />
                        <Stat value={halls.length} label="all-you-can-eat halls" />
                        <Stat value={openCount} label="open in the last few minutes" />
                    </div>

                    <section className="mb-12" aria-labelledby="how-it-works">
                        <h2
                            id="how-it-works"
                            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4"
                        >
                            How UNC campus dining is organised
                        </h2>
                        <Prose>
                            <p>
                                Two of the {locations.length} venues on this page are all-you-can-eat dining halls:{' '}
                                <Link href="/chase" className="text-[#2c6f9e] dark:text-[#7cc0ec] underline">
                                    Chase
                                </Link>{' '}
                                on South Campus and{' '}
                                <Link href="/lenoir" className="text-[#2c6f9e] dark:text-[#7cc0ec] underline">
                                    Top of Lenoir
                                </Link>{' '}
                                upstairs in Lenoir Hall. You swipe in once and eat as much as you want, and UNC
                                publishes a full recipe-level menu for every meal period of every day.
                            </p>
                            <p>
                                Everything else is paid for item by item, and it clusters into four shapes. The two food
                                courts are the biggest: <strong>Bottom of Lenoir</strong>, the ground floor of Lenoir
                                Hall, and <strong>The Beach Cafe</strong> in the Brinkhous-Bullitt Building. Then there
                                are single-counter cafes attached to a school, a library or a research building — the
                                Law Bar, Friends Cafe in the Health Sciences Library, Cafe Converge in Genome Sciences.
                                Three are markets rather than kitchens. Eight are food trucks that move between campus
                                stops.
                            </p>
                            <p>
                                Where the nutrition comes from depends on who runs the counter. UNC Dining publishes a
                                fresh daily menu for {withUncMenu.length + halls.length + markets.length} of these
                                venues, itemised down to the recipe, which is what the menu pages on this site show.
                                The other {brands.length} are third-party brands — Chick-fil-A, Subway, Bojangles,
                                Bento Sushi, the trucks — whose menus come from the brand and stay the same from one
                                day to the next.
                            </p>
                            <p>
                                Hours are published per date rather than as a weekly pattern, which is why a venue can
                                show nothing at all for a week in December: UNC has not filed hours for those days
                                because nothing is open. Today&apos;s times for the whole campus are on the{' '}
                                <Link href="/hours" className="text-[#2c6f9e] dark:text-[#7cc0ec] underline">
                                    hours page
                                </Link>
                                , and what is serving at this exact minute is on{' '}
                                <Link href="/open-now" className="text-[#2c6f9e] dark:text-[#7cc0ec] underline">
                                    open now
                                </Link>
                                .
                            </p>
                        </Prose>

                        <div className="mt-6 grid sm:grid-cols-2 gap-3">
                            {(['dining_hall', 'unc_menu', 'external', 'retail'] as const).map((kind) => {
                                const meta = kindMeta(kind)
                                return (
                                    <div
                                        key={kind}
                                        className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4"
                                    >
                                        <Badge className={meta.badgeClass}>{meta.short}</Badge>
                                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {meta.description}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    {buildings.map((group) => {
                        const Icon =
                            group.venueGroup === 'Food Trucks'
                                ? Truck
                                : group.items.some((l) => l.kind === 'dining_hall')
                                  ? Utensils
                                  : group.items.length > 2
                                    ? Soup
                                    : Building2

                        return (
                            <section
                                key={group.venueGroup}
                                id={group.venueGroup.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                                className="mb-10 scroll-mt-8"
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <IconTile>
                                        <Icon className="w-5 h-5" />
                                    </IconTile>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                            {group.meta.heading}
                                        </h2>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                            {group.items.length} {group.items.length === 1 ? 'venue' : 'venues'}
                                        </p>
                                    </div>
                                </div>

                                {group.meta.blurb && (
                                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                                        {group.meta.blurb}
                                    </p>
                                )}

                                <div className="grid sm:grid-cols-2 gap-3">
                                    {group.items.map((location) => (
                                        <VenueCard
                                            key={location.id}
                                            location={location}
                                            openNow={openByLocation.get(location.id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )
                    })}

                    <section className="mb-10" aria-labelledby="not-listed">
                        <Card className="p-6">
                            <div className="flex items-start gap-3">
                                <IconTile className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <Clock className="w-5 h-5" />
                                </IconTile>
                                <div>
                                    <h2
                                        id="not-listed"
                                        className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2"
                                    >
                                        Venues that are not on this list
                                    </h2>
                                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                        This page lists exactly the venues UNC Dining currently publishes hours and
                                        menus for — {locations.length} of them. Names students still search for, such
                                        as Rams Head, Alpine Bagel, Agora, Terrace Cafe and Overlook Cafe, are not in
                                        that feed, so there is no page for them here. We would rather leave a gap than
                                        print hours we cannot check.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </section>

                    <nav aria-label="Related pages" className="grid sm:grid-cols-2 gap-3">
                        <Link
                            href="/hours"
                            className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                        >
                            <div className="font-semibold text-zinc-900 dark:text-zinc-50">UNC dining hours today</div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                Every venue&apos;s service periods for today and tomorrow.
                            </p>
                        </Link>
                        <Link
                            href="/open-now"
                            className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                        >
                            <div className="font-semibold text-zinc-900 dark:text-zinc-50">What&apos;s open right now</div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                Live: what is serving this minute and what opens next.
                            </p>
                        </Link>
                    </nav>
                </>
            )}
        </CampusPage>
    )
}
