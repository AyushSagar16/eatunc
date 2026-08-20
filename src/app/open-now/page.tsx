import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, DoorOpen, MapPin, Timer } from 'lucide-react'

import { CAMPUS_TIMEZONE, campusToday, getHoursForDate, getOpenNow, locationPath } from '@/lib/campus'
import type { Location, LocationHours, OpenPeriod } from '@/lib/campus'
import { breadcrumbList, canonical, faqPage } from '@/lib/seo'
import type { Faq } from '@/lib/seo'
import { Badge, Breadcrumbs, CampusPage, Card, IconTile, Prose, Stat } from '@/components/campus/CampusChrome'
import { JsonLd } from '@/components/campus/JsonLd'
import {
    buildingMeta,
    formatCampusDay,
    formatCampusTime,
    formatClock,
    kindMeta,
    sentenceList,
} from '@/components/campus/campusDisplay'

/**
 * A live answer. Anything cached here is a wrong answer: a student reading "Chase is open"
 * ninety seconds after Chase closed is worse served than one who waited for the query.
 */
export const dynamic = 'force-dynamic'

const PATH = '/open-now'
const TITLE = "What's Open Right Now at UNC — Live Campus Dining"
const DESCRIPTION =
    "See what's open right now at UNC Chapel Hill. Live list of every campus dining venue serving food this minute, when each one closes, and what opens next — Chase, Top of Lenoir, Bottom of Lenoir, the Beach Cafe and every campus cafe."

export const metadata: Metadata = {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    keywords: [
        "what's open unc",
        'unc whats open',
        'whats open unc',
        'cds whats open',
        'cds open now',
        'unc dining open now',
        'unc food open now',
    ],
    alternates: { canonical: canonical(PATH) },
    openGraph: { title: TITLE, description: DESCRIPTION, url: canonical(PATH), siteName: 'Eat UNC', type: 'website' },
    twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

const CRUMBS = [
    { name: 'Eat UNC', path: '/' },
    { name: "What's open now", path: PATH },
]

/** Local hour in Chapel Hill for a stored instant. Midnight can format as 24, hence the %24. */
function campusHour(iso: string): number {
    const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: CAMPUS_TIMEZONE,
        hour: 'numeric',
        hour12: false,
    }).format(new Date(iso))
    return Number(formatted) % 24
}

function isLateClose(iso: string): boolean {
    const hour = campusHour(iso)
    return hour >= 21 || hour <= 4
}

/** One row per venue — a venue with two concurrent periods should still read as one place. */
function dedupeByLocation(periods: OpenPeriod[]): OpenPeriod[] {
    const seen = new Set<string>()
    return periods.filter(({ location }) => {
        if (seen.has(location.id)) return false
        seen.add(location.id)
        return true
    })
}

function venueLine(period: OpenPeriod): string {
    return `${period.location.name} in ${buildingMeta(period.location.venue_group).short}`
}

function buildFaqs(
    now: Date,
    open: OpenPeriod[],
    openingSoon: OpenPeriod[],
    todayHours: LocationHours[],
    locations: Location[],
): Faq[] {
    const clock = formatCampusTime(now)
    const faqs: Faq[] = []

    faqs.push({
        question: "What's open at UNC right now?",
        answer:
            open.length === 0
                ? `Nothing on UNC's campus is serving food at ${clock} Chapel Hill time. This page is rebuilt on every request from the hours UNC Dining publishes, so it always reflects the current minute.`
                : `${open.length} UNC campus dining ${open.length === 1 ? 'venue is' : 'venues are'} serving food at ${clock} Chapel Hill time, including ${sentenceList(
                      open.slice(0, 4).map(venueLine),
                  )}. The first to close is ${venueLine(open[0])} at ${formatClock(open[0].period.closes_label)}.`,
    })

    if (openingSoon.length > 0) {
        const next = openingSoon[0]
        faqs.push({
            question: 'What opens next at UNC?',
            answer: `${venueLine(next)} is the next place to open, at ${formatClock(next.period.opens_label)}${
                openingSoon.length > 1
                    ? `, followed by ${sentenceList(
                          openingSoon.slice(1, 4).map((p) => `${venueLine(p)} at ${formatClock(p.period.opens_label)}`),
                      )}`
                    : ''
            }.`,
        })
    }

    const byId = new Map(locations.map((l) => [l.id, l]))
    const lateTonight = todayHours
        .filter((row) => isLateClose(row.closes_at) && byId.has(row.location_id))
        .sort((a, b) => Date.parse(b.closes_at) - Date.parse(a.closes_at))

    if (lateTonight.length > 0) {
        faqs.push({
            question: 'Is anything open late at UNC tonight?',
            answer: `Yes. ${sentenceList(
                lateTonight.slice(0, 4).map((row) => {
                    const location = byId.get(row.location_id)
                    const where = location ? buildingMeta(location.venue_group).short : 'campus'
                    return `${location?.name ?? 'A campus venue'} in ${where} until ${formatClock(row.closes_label)}`
                }),
            )}. Those are UNC's own published closing times for today.`,
        })
    } else {
        faqs.push({
            question: 'Is anything open late at UNC tonight?',
            answer:
                'No UNC campus dining venue is scheduled to serve past 9:00 PM today. Late hours vary by day and by term, and this page reads the times UNC publishes for each date rather than assuming a weekly pattern.',
        })
    }

    faqs.push({
        question: 'How do I check what Carolina Dining Services has open?',
        answer:
            'This page reads the service periods UNC Dining publishes for every campus venue and compares them to the current time in Chapel Hill. It covers all campus dining locations, not just the Chase and Top of Lenoir dining halls, so third-party counters like Chick-fil-A and Subway and the campus food trucks are included too.',
    })

    return faqs
}

export default async function OpenNowPage() {
    const now = new Date()
    const today = campusToday(now)

    let open: OpenPeriod[] = []
    let openingSoon: OpenPeriod[] = []
    let locations: Location[] = []
    let todayHours: LocationHours[] = []
    let failed = false

    try {
        const [live, hours] = await Promise.all([getOpenNow(now), getHoursForDate(today).catch(() => [])])
        open = dedupeByLocation(live.open)
        openingSoon = live.openingSoon
        locations = live.locations
        todayHours = hours
    } catch {
        failed = true
    }

    const faqs = failed ? [] : buildFaqs(now, open, openingSoon, todayHours, locations)

    return (
        <CampusPage>
            <JsonLd data={breadcrumbList(CRUMBS)} />
            {faqs.length > 0 && <JsonLd data={faqPage(faqs)} />}

            <Breadcrumbs crumbs={CRUMBS} />

            <header className="mb-8">
                <div className="flex items-start gap-4">
                    <IconTile className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <DoorOpen className="w-6 h-6" />
                    </IconTile>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            What&apos;s Open Right Now at UNC
                        </h1>
                        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-zinc-500 dark:text-zinc-400">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>
                                {formatCampusTime(now)} in Chapel Hill · {formatCampusDay(now)}
                            </span>
                        </p>
                    </div>
                </div>
            </header>

            {failed ? (
                <Card className="p-6">
                    <p className="text-zinc-600 dark:text-zinc-300">
                        Live hours could not be loaded right now. Try again in a moment, or see{' '}
                        <Link href="/hours" className="underline">
                            today&apos;s published hours
                        </Link>
                        .
                    </p>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 mb-10">
                        <Stat value={open.length} label="serving food right now" />
                        <Stat value={openingSoon.length} label="opening later" />
                    </div>

                    <section className="mb-12" aria-labelledby="open-now-heading">
                        <div className="flex items-center gap-3 mb-4">
                            <IconTile className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <DoorOpen className="w-5 h-5" />
                            </IconTile>
                            <h2
                                id="open-now-heading"
                                className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                            >
                                Open now — closing soonest first
                            </h2>
                        </div>

                        {open.length === 0 ? (
                            <Card className="p-6">
                                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                    Nothing on campus is serving food at {formatCampusTime(now)}. Everything below
                                    under &ldquo;opening next&rdquo; is still to come.
                                </p>
                            </Card>
                        ) : (
                            <ul className="grid sm:grid-cols-2 gap-3">
                                {open.map((entry) => (
                                    <li key={`${entry.location.id}-${entry.period.id}`}>
                                        <Link
                                            href={locationPath(entry.location)}
                                            className="block h-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm px-4 py-3.5 hover:border-[#4B9CD3]/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                                                        {entry.location.name}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="truncate">
                                                            {buildingMeta(entry.location.venue_group).short}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 whitespace-nowrap">
                                                    until {formatClock(entry.period.closes_label)}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                <Badge className={kindMeta(entry.location.kind).badgeClass}>
                                                    {kindMeta(entry.location.kind).short}
                                                </Badge>
                                                {entry.period.period_name.toLowerCase() !== 'open' && (
                                                    <Badge className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20">
                                                        {entry.period.period_name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="mb-12" aria-labelledby="opening-next-heading">
                        <div className="flex items-center gap-3 mb-4">
                            <IconTile className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Timer className="w-5 h-5" />
                            </IconTile>
                            <h2
                                id="opening-next-heading"
                                className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                            >
                                Opening next
                            </h2>
                        </div>

                        {openingSoon.length === 0 ? (
                            <Card className="p-6">
                                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                    Nothing else is scheduled to open today or tomorrow. During breaks UNC publishes no
                                    hours at all for days when campus dining is shut.
                                </p>
                            </Card>
                        ) : (
                            <ul className="grid sm:grid-cols-2 gap-3">
                                {openingSoon.slice(0, 16).map((entry) => (
                                    <li key={`${entry.location.id}-${entry.period.id}`}>
                                        <Link
                                            href={locationPath(entry.location)}
                                            className="block h-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm px-4 py-3.5 hover:border-[#4B9CD3]/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                                                        {entry.location.name}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="truncate">
                                                            {buildingMeta(entry.location.venue_group).short}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 whitespace-nowrap">
                                                    opens {formatClock(entry.period.opens_label)}
                                                </Badge>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="mb-12" aria-labelledby="faq-heading">
                        <h2
                            id="faq-heading"
                            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4"
                        >
                            Questions about what&apos;s open at UNC
                        </h2>
                        <div className="space-y-3">
                            {faqs.map((faq) => (
                                <Card key={faq.question} className="p-5">
                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-1.5">
                                        {faq.question}
                                    </h3>
                                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{faq.answer}</p>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <section className="mb-10">
                        <Prose>
                            <p>
                                This page is generated on every request, so it never shows a cached answer. It compares
                                the current time in Chapel Hill against the service periods UNC Dining publishes for
                                each date, which means an overnight window — Chase&apos;s late night, Subway&apos;s
                                midnight close — is handled as one continuous period rather than being cut off at
                                midnight.
                            </p>
                            <p>
                                For the whole day laid out at once, see{' '}
                                <Link href="/hours" className="text-[#2c6f9e] dark:text-[#7cc0ec] underline">
                                    today&apos;s UNC dining hours
                                </Link>
                                . For the full list of venues and what each one is, see{' '}
                                <Link href="/locations" className="text-[#2c6f9e] dark:text-[#7cc0ec] underline">
                                    campus dining locations
                                </Link>
                                .
                            </p>
                        </Prose>
                    </section>
                </>
            )}
        </CampusPage>
    )
}
