import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, Clock, MoonStar, Sunrise, Utensils } from 'lucide-react'

import {
    CAMPUS_TIMEZONE,
    campusToday,
    getHoursForDate,
    getLocations,
    locationPath,
    shiftDate,
} from '@/lib/campus'
import type { Location, LocationHours } from '@/lib/campus'
import { breadcrumbList, canonical, faqPage } from '@/lib/seo'
import type { Faq } from '@/lib/seo'
import { Badge, Breadcrumbs, CampusPage, Card, IconTile, Prose, Stat } from '@/components/campus/CampusChrome'
import { JsonLd } from '@/components/campus/JsonLd'
import { PeriodRows, PeriodSummary } from '@/components/campus/HoursList'
import {
    buildingMeta,
    formatCampusDate,
    formatClock,
    formatHoursRange,
    groupByBuilding,
    kindMeta,
    periodLabel,
    periodsFor,
    sentenceList,
} from '@/components/campus/campusDisplay'

/**
 * Today's hours are a calendar answer, so this route can never be a frozen static build —
 * `/today` shipped a six-day-old date for exactly that reason. Fifteen minutes is far shorter
 * than the nightly sweep that produces the underlying rows, so a visitor never reads a
 * yesterday's schedule; `/open-now` is the to-the-minute answer and is uncached.
 */
export const revalidate = 900

const PATH = '/hours'
const TITLE = 'UNC Dining Hall Hours Today — Chase & Lenoir'
const DESCRIPTION =
    'What time does Chase dining hall close today? Every UNC Chapel Hill dining venue’s hours for today and tomorrow — Chase, Top of Lenoir, Bottom of Lenoir, the Beach Cafe, Chick-fil-A and every campus cafe — printed exactly as Carolina Dining Services published them.'

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    keywords: [
        'unc dining hours',
        'chase dining hall hours',
        'unc dining hall hours',
        'lenoir dining hall hours',
        'unc menu and hours',
        'menu and hours unc',
        'lenoir hours unc',
        'dining hall hours unc',
        'unc lenoir hours',
        'unc cds hours',
        'unc cafeteria hours',
        'bottom of lenoir hours',
        'unc bojangles hours',
        'carolina dining hours',
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
    { name: 'UNC Dining Hours', path: PATH },
]

/** Chase carries roughly three times Lenoir's search volume, so it leads. */
const HALL_ORDER = ['chase', 'top-of-lenoir']

/** Local hour in Chapel Hill for a stored instant. Midnight can format as 24, hence the %24. */
function campusHour(iso: string): number {
    const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: CAMPUS_TIMEZONE,
        hour: 'numeric',
        hour12: false,
    }).format(new Date(iso))
    return Number(formatted) % 24
}

/** A close at or after 9 PM, or in the small hours — the shape of a "late night" answer. */
function closesLate(row: LocationHours): boolean {
    const hour = campusHour(row.closes_at)
    return hour >= 21 || hour <= 4
}

function earliest(rows: LocationHours[]): LocationHours | undefined {
    return rows.length ? rows.reduce((a, b) => (Date.parse(a.opens_at) <= Date.parse(b.opens_at) ? a : b)) : undefined
}

function latest(rows: LocationHours[]): LocationHours | undefined {
    return rows.length
        ? rows.reduce((a, b) => (Date.parse(a.closes_at) >= Date.parse(b.closes_at) ? a : b))
        : undefined
}

/** "Breakfast 7:00 AM – 10:45 AM, Lunch 11:00 AM – 3:00 PM and …", straight from the rows. */
function schedulePhrase(rows: LocationHours[]): string {
    return sentenceList(
        rows.map((row) =>
            row.period_name.toLowerCase() === 'open'
                ? formatHoursRange(row)
                : `${periodLabel(row.period_name)} ${formatHoursRange(row)}`,
        ),
    )
}

type HallDay = { location: Location; rows: LocationHours[] }

function buildFaqs(
    today: string,
    halls: HallDay[],
    todayHours: LocationHours[],
    locations: Location[],
    servingToday: number,
): Faq[] {
    const dateText = formatCampusDate(today)
    const faqs: Faq[] = []
    const byId = new Map(locations.map((l) => [l.id, l]))

    const chase = halls.find((h) => h.location.slug === 'chase')
    const lenoir = halls.find((h) => h.location.slug === 'top-of-lenoir')

    if (chase) {
        const close = latest(chase.rows)
        faqs.push({
            question: 'What time does Chase dining hall close today?',
            answer: close
                ? `Chase Dining Hall closes at ${formatClock(close.closes_label)} on ${dateText}, at the end of its ${periodLabel(
                      close.period_name,
                  )} service. Its full schedule for the day is ${schedulePhrase(
                      chase.rows,
                  )}. UNC publishes hall hours one date at a time rather than as a repeating weekly pattern, so this closing time can differ tomorrow.`
                : `UNC Dining has published no hours for Chase Dining Hall on ${dateText}, so Chase is not scheduled to serve food that day. Over breaks and between terms the halls can stay closed for weeks, and UNC files no hours at all for those dates rather than filing zeroes.`,
        })
    }

    if (lenoir) {
        const open = earliest(lenoir.rows)
        const close = latest(lenoir.rows)
        faqs.push({
            question: 'When does Top of Lenoir open today?',
            answer:
                open && close
                    ? `Top of Lenoir opens at ${formatClock(open.opens_label)} on ${dateText} for ${periodLabel(
                          open.period_name,
                      )}, and closes at ${formatClock(close.closes_label)}. Its meal periods for the day are ${schedulePhrase(
                          lenoir.rows,
                      )}. Top of Lenoir is the all-you-care-to-eat hall upstairs in Lenoir Hall; the counters downstairs in Bottom of Lenoir keep their own separate hours.`
                    : `UNC Dining has published no hours for Top of Lenoir on ${dateText}, so the upstairs hall is not scheduled to open that day. The Bottom of Lenoir counters downstairs are listed separately on this page and can still be open when the hall above them is not.`,
        })
    }

    // Latest close first, then one row per venue: Chase files both a Late Dinner and a Late
    // Night, and listing it twice would read as two different places staying open.
    const seenLate = new Set<string>()
    const lateTonight = todayHours
        .filter((row) => closesLate(row) && byId.has(row.location_id))
        .sort((a, b) => Date.parse(b.closes_at) - Date.parse(a.closes_at))
        .filter((row) => {
            if (seenLate.has(row.location_id)) return false
            seenLate.add(row.location_id)
            return true
        })

    faqs.push({
        question: 'Is anything open late at UNC tonight?',
        answer:
            lateTonight.length > 0
                ? `Yes. ${sentenceList(
                      lateTonight.slice(0, 5).map((row) => {
                          const location = byId.get(row.location_id)
                          const where = location ? buildingMeta(location.venue_group).short : 'campus'
                          return `${location?.name ?? 'A campus venue'} in ${where} serves until ${formatClock(
                              row.closes_label,
                          )}`
                      }),
                  )} on ${dateText}. Those are UNC's own published closing times for tonight, not a typical week.`
                : `No UNC campus dining venue is scheduled to serve past 9:00 PM on ${dateText}. Late hours vary by day and by term, so this page reads the times UNC files for each date rather than assuming a weekly pattern.`,
    })

    if (halls.length > 0) {
        faqs.push({
            question: 'What are the UNC dining hall hours today?',
            answer: `${sentenceList(
                halls.map((hall) =>
                    hall.rows.length > 0
                        ? `${hall.location.name} serves ${schedulePhrase(hall.rows)}`
                        : `${hall.location.name} has no published hours`,
                ),
            )} on ${dateText}. Those two are the all-you-care-to-eat halls; every other campus venue is paid for item by item and is listed further down this page with its own hours.`,
        })
    }

    const firstOpen = earliest(todayHours)
    if (firstOpen) {
        const location = byId.get(firstOpen.location_id)
        faqs.push({
            question: 'What time does UNC dining open in the morning?',
            answer: `The first UNC campus dining venue to open on ${dateText} is ${
                location?.name ?? 'a campus venue'
            }${location ? ` in ${buildingMeta(location.venue_group).short}` : ''}, at ${formatClock(
                firstOpen.opens_label,
            )}. ${servingToday} campus dining ${
                servingToday === 1 ? 'venue has' : 'venues have'
            } hours published for the day in total.`,
        })
    }

    faqs.push({
        question: 'Where do these UNC dining hours come from?',
        answer:
            'Carolina Dining Services (CDS) publishes service times for each campus venue one date at a time on dining.unc.edu, and Eat UNC mirrors those rows nightly and prints them here exactly as filed. Nothing on this page is a guess or a weekly average: where a venue shows no times, UNC has published none for that date, which normally means it is closed. Eat UNC is a student project and is not affiliated with UNC Chapel Hill or Carolina Dining Services.',
    })

    return faqs
}

function anchorId(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

/** One venue's line in a building's hours list. Stacks on mobile, two columns from `sm`. */
function VenueHoursRow({ location, rows }: { location: Location; rows: LocationHours[] }) {
    return (
        <li className="flex flex-col gap-0.5 border-b border-zinc-100 dark:border-zinc-800 py-2.5 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <Link
                href={locationPath(location)}
                className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-[#2c6f9e] dark:hover:text-[#7cc0ec] transition-colors"
            >
                {location.name}
            </Link>
            <span className="sm:text-right">
                <PeriodSummary rows={rows} empty="No hours published" />
            </span>
        </li>
    )
}

/** Every venue's hours for one date, grouped by the building it is in. */
function DayByBuilding({
    date,
    locations,
    hours,
    idPrefix,
}: {
    date: string
    locations: Location[]
    hours: LocationHours[]
    idPrefix: string
}) {
    const buildings = groupByBuilding(locations)

    return (
        <div className="space-y-4">
            {buildings.map((group) => {
                const withRows = group.items.map((location) => ({
                    location,
                    rows: periodsFor(hours, location.id, date),
                }))
                const openCount = withRows.filter((v) => v.rows.length > 0).length

                return (
                    <Card key={group.venueGroup} className="p-5">
                        <div id={`${idPrefix}-${anchorId(group.venueGroup)}`} className="scroll-mt-8">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                {group.meta.heading} hours
                            </h3>
                            <p className="mt-0.5 mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                                {openCount === 0
                                    ? `Nothing scheduled here on ${formatCampusDate(date)}.`
                                    : `${openCount} of ${group.items.length} ${
                                          group.items.length === 1 ? 'venue' : 'venues'
                                      } scheduled.`}
                            </p>
                            <ul>
                                {withRows.map(({ location, rows }) => (
                                    <VenueHoursRow key={location.id} location={location} rows={rows} />
                                ))}
                            </ul>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}

export default async function HoursPage() {
    const today = campusToday()
    const tomorrow = shiftDate(today, 1)

    let locations: Location[] = []
    let todayHours: LocationHours[] = []
    let tomorrowHours: LocationHours[] = []
    let failed = false

    try {
        const [loaded, todayRows, tomorrowRows] = await Promise.all([
            getLocations(),
            getHoursForDate(today).catch(() => [] as LocationHours[]),
            getHoursForDate(tomorrow).catch(() => [] as LocationHours[]),
        ])
        locations = loaded
        todayHours = todayRows
        tomorrowHours = tomorrowRows
    } catch {
        failed = true
    }

    const halls: HallDay[] = locations
        .filter((l) => l.kind === 'dining_hall')
        .sort((a, b) => HALL_ORDER.indexOf(a.slug) - HALL_ORDER.indexOf(b.slug))
        .map((location) => ({ location, rows: periodsFor(todayHours, location.id, today) }))

    const locationIds = new Set(locations.map((l) => l.id))
    const scopedToday = todayHours.filter((row) => locationIds.has(row.location_id))
    const scopedTomorrow = tomorrowHours.filter((row) => locationIds.has(row.location_id))

    const servingToday = new Set(scopedToday.map((row) => row.location_id)).size
    const servingTomorrow = new Set(scopedTomorrow.map((row) => row.location_id)).size
    const firstOpenToday = earliest(scopedToday)
    const lastCloseToday = latest(scopedToday)

    // The union of both halls' period names for today, earliest service first, so the
    // comparison table has a row for Chase's Late Night even though Lenoir has no such period.
    const hallPeriodNames = Array.from(
        new Map(
            halls
                .flatMap((hall) => hall.rows)
                .sort((a, b) => Date.parse(a.opens_at) - Date.parse(b.opens_at))
                .map((row) => [row.period_name, row.period_name] as const),
        ).keys(),
    )

    const faqs = failed ? [] : buildFaqs(today, halls, scopedToday, locations, servingToday)

    return (
        <CampusPage>
            <JsonLd data={breadcrumbList(CRUMBS)} />
            {faqs.length > 0 && <JsonLd data={faqPage(faqs)} />}

            <Breadcrumbs crumbs={CRUMBS} />

            <header className="mb-8">
                <div className="flex items-start gap-4">
                    <IconTile className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Clock className="w-6 h-6" />
                    </IconTile>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            UNC Dining Hall Hours Today
                        </h1>
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                            {formatCampusDate(today)} in Chapel Hill · every campus venue&apos;s service times, as
                            Carolina Dining Services published them.
                        </p>
                    </div>
                </div>
            </header>

            {failed ? (
                <Card className="p-6">
                    <p className="text-zinc-600 dark:text-zinc-300">
                        UNC dining hours could not be loaded right now. Try again in a few minutes, or see{' '}
                        <Link href="/open-now" className="underline">
                            what&apos;s open right now
                        </Link>
                        .
                    </p>
                </Card>
            ) : scopedToday.length === 0 && scopedTomorrow.length === 0 ? (
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                        No UNC dining hours are published for today or tomorrow
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        UNC Dining has filed no service times for {formatCampusDate(today)} or{' '}
                        {formatCampusDate(tomorrow)}. That is what campus looks like between terms and over the
                        winter and summer breaks — rather than guess, this page shows nothing where UNC published
                        nothing. Hours normally reappear a few days before a term restarts. In the meantime you can
                        still browse{' '}
                        <Link href="/locations" className="text-[#2c6f9e] dark:text-[#7cc0ec] underline">
                            every campus dining location
                        </Link>
                        .
                    </p>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                        <Stat value={servingToday} label="venues with hours today" />
                        <Stat
                            value={firstOpenToday ? formatClock(firstOpenToday.opens_label) : '—'}
                            label="first opening today"
                        />
                        <Stat
                            value={lastCloseToday ? formatClock(lastCloseToday.closes_label) : '—'}
                            label="last closing today"
                        />
                        <Stat value={servingTomorrow} label="venues with hours tomorrow" />
                    </div>

                    <section className="mb-12" aria-labelledby="hall-hours">
                        <div className="flex items-start gap-3 mb-4">
                            <IconTile>
                                <Utensils className="w-5 h-5" />
                            </IconTile>
                            <div>
                                <h2
                                    id="hall-hours"
                                    className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                                >
                                    Chase and Top of Lenoir dining hall hours today
                                </h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    The two all-you-care-to-eat halls, meal period by meal period.
                                </p>
                            </div>
                        </div>

                        {halls.length === 0 ? (
                            <Card className="p-5">
                                <p className="text-zinc-600 dark:text-zinc-300">
                                    The dining hall list could not be loaded just now.
                                </p>
                            </Card>
                        ) : (
                            <>
                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                    {halls.map((hall) => (
                                        <Card key={hall.location.id} className="p-5">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                                        {hall.location.name} hours today
                                                    </h3>
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                        {buildingMeta(hall.location.venue_group).short}
                                                    </p>
                                                </div>
                                                <Badge className={kindMeta(hall.location.kind).badgeClass}>
                                                    {kindMeta(hall.location.kind).short}
                                                </Badge>
                                            </div>

                                            <PeriodRows
                                                rows={hall.rows}
                                                empty={`UNC has published no hours for ${hall.location.name} on ${formatCampusDate(
                                                    today,
                                                )}. It is not scheduled to serve today.`}
                                            />

                                            <div className="mt-4 flex flex-wrap gap-3 text-sm">
                                                <Link
                                                    href={locationPath(hall.location)}
                                                    className="text-[#2c6f9e] dark:text-[#7cc0ec] font-semibold hover:underline"
                                                >
                                                    Today&apos;s {hall.location.name} menu →
                                                </Link>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {hallPeriodNames.length > 0 && (
                                    <Card className="p-5">
                                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                                            Dining hall hours side by side
                                        </h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                                            {formatCampusDate(today)}. A dash means the hall does not run that
                                            service today.
                                        </p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[24rem] text-sm border-collapse">
                                                <caption className="sr-only">
                                                    Meal period hours for Chase and Top of Lenoir on{' '}
                                                    {formatCampusDate(today)}
                                                </caption>
                                                <thead>
                                                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                                                        <th className="text-left font-semibold text-zinc-500 dark:text-zinc-400 pb-2 pr-4">
                                                            Meal
                                                        </th>
                                                        {halls.map((hall) => (
                                                            <th
                                                                key={hall.location.id}
                                                                className="text-right font-semibold text-zinc-500 dark:text-zinc-400 pb-2 pl-4 whitespace-nowrap"
                                                            >
                                                                {hall.location.name}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {hallPeriodNames.map((name) => (
                                                        <tr
                                                            key={name}
                                                            className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                                                        >
                                                            <th
                                                                scope="row"
                                                                className="text-left font-medium text-zinc-700 dark:text-zinc-300 py-2 pr-4 whitespace-nowrap"
                                                            >
                                                                {periodLabel(name)}
                                                            </th>
                                                            {halls.map((hall) => {
                                                                const row = hall.rows.find(
                                                                    (r) => r.period_name === name,
                                                                )
                                                                return (
                                                                    <td
                                                                        key={hall.location.id}
                                                                        className="text-right py-2 pl-4 tabular-nums whitespace-nowrap text-zinc-900 dark:text-zinc-100"
                                                                    >
                                                                        {row ? (
                                                                            formatHoursRange(row)
                                                                        ) : (
                                                                            <span className="text-zinc-400 dark:text-zinc-600">
                                                                                —
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                )
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                )}
                            </>
                        )}
                    </section>

                    <section className="mb-12" aria-labelledby="campus-hours-today">
                        <div className="flex items-start gap-3 mb-4">
                            <IconTile className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Sunrise className="w-5 h-5" />
                            </IconTile>
                            <div>
                                <h2
                                    id="campus-hours-today"
                                    className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                                >
                                    Every campus venue&apos;s hours today, building by building
                                </h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {formatCampusDate(today)} · {servingToday} of {locations.length} venues
                                    scheduled
                                </p>
                            </div>
                        </div>

                        <DayByBuilding
                            date={today}
                            locations={locations}
                            hours={scopedToday}
                            idPrefix="today"
                        />
                    </section>

                    <section className="mb-12" aria-labelledby="campus-hours-tomorrow">
                        <div className="flex items-start gap-3 mb-4">
                            <IconTile className="bg-[#4B9CD3]/10 text-[#2c6f9e] dark:text-[#7cc0ec]">
                                <CalendarDays className="w-5 h-5" />
                            </IconTile>
                            <div>
                                <h2
                                    id="campus-hours-tomorrow"
                                    className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                                >
                                    UNC dining hours tomorrow
                                </h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {formatCampusDate(tomorrow)} · {servingTomorrow} of {locations.length} venues
                                    scheduled
                                </p>
                            </div>
                        </div>

                        {scopedTomorrow.length === 0 ? (
                            <Card className="p-5">
                                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                    UNC has published no hours for {formatCampusDate(tomorrow)} yet. Times for the
                                    next day usually appear the evening before; a date that stays empty is a day
                                    campus dining is closed.
                                </p>
                            </Card>
                        ) : (
                            <DayByBuilding
                                date={tomorrow}
                                locations={locations}
                                hours={scopedTomorrow}
                                idPrefix="tomorrow"
                            />
                        )}
                    </section>

                    {faqs.length > 0 && (
                        <section className="mb-12" aria-labelledby="hours-faq">
                            <div className="flex items-start gap-3 mb-4">
                                <IconTile className="bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                    <MoonStar className="w-5 h-5" />
                                </IconTile>
                                <h2
                                    id="hours-faq"
                                    className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                                >
                                    Questions about UNC dining hours
                                </h2>
                            </div>
                            <div className="space-y-3">
                                {faqs.map((faq) => (
                                    <Card key={faq.question} className="p-5">
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-1.5">
                                            {faq.question}
                                        </h3>
                                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="mb-10" aria-labelledby="about-these-hours">
                        <h2
                            id="about-these-hours"
                            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4"
                        >
                            How to read these UNC dining hours
                        </h2>
                        <Prose>
                            <p>
                                UNC publishes campus dining hours one date at a time, not as a repeating weekly
                                schedule. That is why this page shows today and tomorrow rather than a Monday-to-Sunday
                                grid: a hall that closes at 8:00 PM tonight can close at 9:00 PM on Friday, and a
                                weekly table would be wrong more often than it was right. Every time above is printed
                                exactly as UNC filed it, down to the wording of the meal period.
                            </p>
                            <p>
                                The two all-you-care-to-eat halls run named meal periods — Breakfast, Lunch, Late
                                Lunch, Dinner, and at Chase a Late Dinner and Late Night as well — and you can move
                                between them on one swipe. Almost every other venue files a single period called
                                &ldquo;Open&rdquo;, because you pay per item and there is nothing to divide the day
                                into. The food trucks are the exception: UNC files their hours under the campus stop
                                they parked at that day, so a truck appears as SASB one afternoon and Marsico Hall the
                                next.
                            </p>
                            <p>
                                A venue with no times against it has no hours published for that date. That almost
                                always means closed, and over breaks it can run for weeks at a stretch. We would
                                rather leave the line blank than print a plausible-looking time nobody filed —
                                a wrong closing time is the single worst thing a dining site can tell you.
                            </p>
                            <p>
                                For the answer at this exact minute rather than for the whole day, see{' '}
                                <Link href="/open-now" className="text-[#2c6f9e] dark:text-[#7cc0ec] underline">
                                    what&apos;s open right now
                                </Link>
                                . For a week of hours for one venue, open that venue&apos;s page from{' '}
                                <Link href="/locations" className="text-[#2c6f9e] dark:text-[#7cc0ec] underline">
                                    campus dining locations
                                </Link>
                                .
                            </p>
                        </Prose>
                    </section>

                    <nav aria-label="Related pages" className="grid sm:grid-cols-3 gap-3">
                        <Link
                            href="/open-now"
                            className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                        >
                            <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                                What&apos;s open right now
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Live, to the minute.</p>
                        </Link>
                        <Link
                            href="/locations"
                            className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                        >
                            <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                                Every campus dining location
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                All {locations.length} venues, building by building.
                            </p>
                        </Link>
                        <Link
                            href="/faq"
                            className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                        >
                            <div className="font-semibold text-zinc-900 dark:text-zinc-50">UNC dining FAQ</div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                CDS, meal plans, and the venues that changed name.
                            </p>
                        </Link>
                    </nav>
                </>
            )}
        </CampusPage>
    )
}
