import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, MapPin, Soup, Truck, Utensils } from 'lucide-react'

import { getOpenNow, locationPath } from '@/lib/campus'
import type { Location, OpenPeriod } from '@/lib/campus'
import { breadcrumbList, canonical } from '@/lib/seo'
import { Breadcrumbs, CampusPage, Card, IconTile } from '@/components/campus/CampusChrome'
import { JsonLd } from '@/components/campus/JsonLd'
import { VenueCard } from '@/components/campus/VenueCard'
import { groupByBuilding } from '@/components/campus/campusDisplay'

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
                            Every place UNC Chapel Hill currently serves food, grouped by where it is.
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
                                        {/*
                                            `short`, not `heading`. The long form ("Chase Hall —
                                            Chase Dining Hall, Cafe 1789 & Rams Market") was
                                            written to introduce a section of prose; with the
                                            prose gone it just repeats the venue names listed
                                            directly underneath it.
                                        */}
                                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                            {group.meta.short}
                                        </h2>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                            {group.items.length} {group.items.length === 1 ? 'venue' : 'venues'}
                                        </p>
                                    </div>
                                </div>

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

                </>
            )}
        </CampusPage>
    )
}
