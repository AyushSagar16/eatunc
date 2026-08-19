import Link from 'next/link'
import { Clock, MapPin, UtensilsCrossed } from 'lucide-react'
import { CAMPUS_TIMEZONE, locationPath, type Location, type MenuPreviewItem, type OpenPeriod } from '@/lib/campus'
import { compareMealPeriods } from '@/lib/utils'

/**
 * The crawlable half of the homepage.
 *
 * The hero above it is a WebGL splash with 77 words of text, which is what Google had to rank
 * a page carrying 15,007 impressions a quarter at 1.31% CTR. This section is plain server-
 * rendered HTML: what is open at this minute, what the two halls are serving today, and a link
 * to each of the 42 campus venues — the content the queries were actually asking for.
 */

// Built once rather than per row — this runs over every venue open on campus.
const CLOCK = new Intl.DateTimeFormat('en-US', {
    timeZone: CAMPUS_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
})

function timeLabel(ms: number) {
    return CLOCK.format(new Date(ms))
}

function groupPreview(items: MenuPreviewItem[]) {
    const byPeriod = new Map<string, MenuPreviewItem[]>()
    for (const item of items) {
        byPeriod.set(item.period, [...(byPeriod.get(item.period) ?? []), item])
    }
    return Array.from(byPeriod.entries())
        .sort(([a], [b]) => compareMealPeriods(a, b))
        .map(([period, list]) => ({ period, items: list }))
}

function HallToday({
    name,
    slug,
    campus,
    today,
    items,
}: {
    name: string
    slug: string
    campus: string
    today: string
    items: MenuPreviewItem[]
}) {
    const periods = groupPreview(items)

    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{name}</h3>
                    <p className="text-sm text-zinc-500">{campus}</p>
                </div>
            </div>

            {periods.length > 0 ? (
                <div className="space-y-3">
                    {periods.map(({ period, items: list }) => (
                        <div key={period}>
                            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {period}
                            </h4>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {list
                                    .slice(0, 8)
                                    .map((i) => i.name)
                                    .join(' · ')}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-zinc-500">
                    No menu published for {name} today. The halls close over university breaks.
                </p>
            )}

            <Link
                href={`/${slug}/${today}`}
                className="mt-5 inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:gap-3 transition-all"
            >
                Full {name} menu with calories →
            </Link>
        </div>
    )
}

export default function HomeCampusSection({
    today,
    open,
    openingSoon,
    locations,
    chase,
    lenoir,
}: {
    today: string
    open: OpenPeriod[]
    openingSoon: OpenPeriod[]
    locations: Location[]
    chase: MenuPreviewItem[]
    lenoir: MenuPreviewItem[]
}) {
    const byBuilding = new Map<string, Location[]>()
    for (const location of locations) {
        byBuilding.set(location.venue_group, [...(byBuilding.get(location.venue_group) ?? []), location])
    }

    return (
        <section className="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-20 space-y-14">
                {/* Open right now */}
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                        What&apos;s open right now at UNC
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-300 mb-6 max-w-2xl leading-relaxed">
                        Every Carolina Dining Services venue on campus, checked against the hours UNC
                        publishes for today.
                    </p>

                    {open.length > 0 ? (
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {open.slice(0, 10).map(({ location, period, closesAt }) => (
                                <li key={`${location.id}-${period.id}`}>
                                    <Link
                                        href={locationPath(location)}
                                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
                                    >
                                        <span className="flex items-center gap-2 min-w-0">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                            <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {location.name}
                                            </span>
                                        </span>
                                        <span className="text-sm text-zinc-500 shrink-0 tabular-nums">
                                            until {timeLabel(closesAt)}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Nothing is serving on campus at the moment.
                            {openingSoon.length > 0 && (
                                <>
                                    {' '}
                                    Next up is {openingSoon[0].location.name} at{' '}
                                    {timeLabel(openingSoon[0].opensAt)}.
                                </>
                            )}
                        </p>
                    )}

                    <Link
                        href="/open-now"
                        className="mt-4 inline-flex text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline"
                    >
                        See everything open now and opening next →
                    </Link>
                </div>

                {/* Today's hall menus */}
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                        Today&apos;s dining hall menus
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-300 mb-6 max-w-2xl leading-relaxed">
                        Chase and Top of Lenoir are the two all-you-care-to-eat halls. Every dish
                        carries calories, protein, fat, carbs, allergens and dietary tags, so you can
                        filter by what you actually need.
                    </p>
                    <div className="grid gap-5 md:grid-cols-2">
                        <HallToday
                            name="Chase Dining Hall"
                            slug="chase"
                            campus="South Campus"
                            today={today}
                            items={chase}
                        />
                        <HallToday
                            name="Top of Lenoir"
                            slug="lenoir"
                            campus="North Campus · Lenoir Hall"
                            today={today}
                            items={lenoir}
                        />
                    </div>
                </div>

                {/* Everywhere else */}
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                        Every dining location on campus
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-300 mb-6 max-w-2xl leading-relaxed">
                        The two halls are a small part of it. Bottom of Lenoir, the Beach Cafe in
                        Brinkhous-Bullitt, the Union, the food trucks and the cafes in the
                        professional schools add up to {locations.length} places to eat — each with
                        its own hours, and many with published nutrition.
                    </p>

                    <div className="grid gap-5 sm:grid-cols-2">
                        {Array.from(byBuilding.entries()).map(([building, venues]) => (
                            <div
                                key={building}
                                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                            >
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                    <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                                    {building}
                                </h3>
                                <ul className="flex flex-wrap gap-x-2 gap-y-1">
                                    {venues.map((venue) => (
                                        <li key={venue.id} className="text-sm">
                                            <Link
                                                href={locationPath(venue)}
                                                className="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                                            >
                                                {venue.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <Link href="/locations" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            All campus dining locations →
                        </Link>
                        <Link href="/hours" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            <Clock className="w-3.5 h-3.5 inline mr-1" />
                            UNC dining hours today →
                        </Link>
                        <Link href="/faq" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            UNC dining FAQ →
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
