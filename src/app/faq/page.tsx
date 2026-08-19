import type { Metadata } from 'next'
import Link from 'next/link'
import {
    Building2,
    CalendarDays,
    Clock,
    CreditCard,
    ExternalLink,
    HelpCircle,
    Info,
    MapPin,
    Utensils,
} from 'lucide-react'

import { campusToday, getHoursForDate, getLocations } from '@/lib/campus'
import type { Location, LocationHours } from '@/lib/campus'
import { breadcrumbList, canonical, faqPage } from '@/lib/seo'
import type { Faq } from '@/lib/seo'
import { Breadcrumbs, CampusPage, Card, IconTile, Prose } from '@/components/campus/CampusChrome'
import { JsonLd } from '@/components/campus/JsonLd'
import {
    buildingMeta,
    formatCampusDate,
    formatClock,
    formatHoursRange,
    periodLabel,
    periodsFor,
    sentenceList,
} from '@/components/campus/campusDisplay'

/**
 * Most of this page is durable prose, but four answers are built from today's real hours rows,
 * so it cannot be a frozen static build. An hour is short enough that a hall's schedule for the
 * day is still correct and long enough that this page costs almost nothing to serve; the answers
 * are deliberately written about the whole day rather than about "right now", which is what
 * `/open-now` is for and what a cached page could never say honestly.
 */
export const revalidate = 3600

const PATH = '/faq'
const TITLE = 'UNC Dining FAQ — Hours, CDS & Meal Plans'
const DESCRIPTION =
    'Straight answers about UNC Chapel Hill dining: what time Chase closes, whether it shuts between meals, what Carolina Dining Services (CDS) actually is, Bottom of Lenoir vs Top of Lenoir, whether Rams Head and Alpine Bagel still exist, and where UNC’s own meal-plan rules live.'

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    keywords: [
        'what time does chase dining hall close',
        'when does chase dining hall close',
        'does chase close for lunch',
        'is lenoir dining hall open',
        "what's open unc",
        'cds menu',
        'cds menu unc',
        'cds unc',
        'cds chapel hill',
        'carolina dining services',
        'unc dining services',
        'uncdining',
        'unc meal plan',
        'unc dining portal',
        'plus swipes unc',
        'rams head dining hall',
        'unc alpine bagel',
        'agora dining hall unc',
        'bottom of lenoir',
        'beach cafe unc',
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
    { name: 'UNC Dining FAQ', path: PATH },
]

const MEAL_PLAN_URL = 'https://dining.unc.edu/meal-plans/'
const ONECARD_URL = 'https://onecard.unc.edu'
const DINING_URL = 'https://dining.unc.edu'

type FaqLink = { label: string; href: string; external?: boolean }

/**
 * One question. `answer` is a plain string because it is rendered verbatim AND emitted as the
 * `acceptedAnswer` of the FAQPage markup — Google treats visible text that disagrees with the
 * markup as a structured-data violation, so there is exactly one copy of every answer here.
 * `links` sit beside the answer rather than inside it, so no link text is smuggled into schema.
 */
type FaqEntry = Faq & { links?: FaqLink[] }

type FaqGroup = {
    id: string
    heading: string
    intro: string
    icon: React.ReactNode
    iconClass: string
    entries: FaqEntry[]
}

/** The hours rows for one venue today, or an empty list if UNC published none. */
function todayRowsFor(locations: Location[], hours: LocationHours[], slug: string, date: string) {
    const location = locations.find((l) => l.slug === slug)
    if (!location) return { location: undefined, rows: [] as LocationHours[] }
    return { location, rows: periodsFor(hours, location.id, date) }
}

function schedulePhrase(rows: LocationHours[]): string {
    return sentenceList(
        rows.map((row) =>
            row.period_name.toLowerCase() === 'open'
                ? formatHoursRange(row)
                : `${periodLabel(row.period_name)} ${formatHoursRange(row)}`,
        ),
    )
}

/**
 * Breaks in a venue's day, computed from the rows rather than assumed.
 *
 * "Does Chase close for lunch?" has a real answer that no page currently gives: on a normal
 * service day Chase's breakfast ends fifteen minutes before lunch begins, and it then runs
 * unbroken into the night. Stating the gap in minutes is only honest if the minutes come from
 * the data, so they do.
 */
function gapsBetween(rows: LocationHours[]): { after: LocationHours; before: LocationHours; minutes: number }[] {
    const sorted = [...rows].sort((a, b) => Date.parse(a.opens_at) - Date.parse(b.opens_at))
    const gaps: { after: LocationHours; before: LocationHours; minutes: number }[] = []

    for (let i = 0; i < sorted.length - 1; i += 1) {
        const closes = Date.parse(sorted[i].closes_at)
        const opens = Date.parse(sorted[i + 1].opens_at)
        if (Number.isNaN(closes) || Number.isNaN(opens)) continue
        const minutes = Math.round((opens - closes) / 60_000)
        if (minutes > 0) gaps.push({ after: sorted[i], before: sorted[i + 1], minutes })
    }

    return gaps
}

function minutesPhrase(minutes: number): string {
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    const hourText = `${hours} ${hours === 1 ? 'hour' : 'hours'}`
    return rest === 0 ? hourText : `${hourText} ${rest} minutes`
}

function buildGroups(date: string, locations: Location[], hours: LocationHours[]): FaqGroup[] {
    const dateText = formatCampusDate(date)
    const chase = todayRowsFor(locations, hours, 'chase', date)
    const lenoir = todayRowsFor(locations, hours, 'top-of-lenoir', date)
    const scheduled = new Set(hours.map((row) => row.location_id)).size

    const chaseClose = chase.rows.length ? chase.rows[chase.rows.length - 1] : undefined
    const chaseGaps = gapsBetween(chase.rows)

    const hoursEntries: FaqEntry[] = [
        {
            question: 'What time does Chase dining hall close?',
            answer: chaseClose
                ? `On ${dateText}, Chase Dining Hall closes at ${formatClock(
                      chaseClose.closes_label,
                  )} — the end of its ${periodLabel(
                      chaseClose.period_name,
                  )} service. Its meal periods for the day are ${schedulePhrase(
                      chase.rows,
                  )}. There is no fixed weekly closing time to memorise: UNC files Chase's hours date by date, and weekends and reading days routinely differ from a Tuesday.`
                : `UNC Dining has published no hours for Chase Dining Hall on ${dateText}, which means Chase is not scheduled to serve that day. Between terms and over breaks the halls close for weeks, and UNC files no hours for those dates rather than filing zeroes. Chase's hours page shows the live schedule whenever there is one.`,
            links: [{ label: 'Chase hours today', href: '/hours' }],
        },
        {
            question: 'Does Chase close for lunch?',
            answer:
                chase.rows.length === 0
                    ? `Chase has no published hours at all on ${dateText}, so there is no lunch service to break. On a normal service day Chase runs a breakfast period and a separate lunch period, and the gap between them — if there is one — is shown period by period on the hours page.`
                    : chaseGaps.length === 0
                      ? `No. On ${dateText} Chase's service periods run back to back with no break between them — ${schedulePhrase(
                            chase.rows,
                        )} — so you can walk in at any point in that window. Chase's periods are billing labels for the same continuous service, not separate openings.`
                      : `Only briefly, and not in the way the question usually means. On ${dateText} Chase closes for ${minutesPhrase(
                            chaseGaps[0].minutes,
                        )} between ${periodLabel(chaseGaps[0].after.period_name)} and ${periodLabel(
                            chaseGaps[0].before.period_name,
                        )} — it stops serving at ${formatClock(
                            chaseGaps[0].after.closes_label,
                        )} and reopens at ${formatClock(
                            chaseGaps[0].before.opens_label,
                        )}. After that its remaining periods run back to back until it closes for the night. Chase does not shut down in the middle of lunch itself; the changeover students notice is the one between breakfast and lunch while the line is reset.`,
            links: [{ label: 'Every meal period, with times', href: '/hours' }],
        },
        {
            question: 'Is Lenoir dining hall open?',
            answer:
                lenoir.rows.length > 0
                    ? `Yes — Top of Lenoir is scheduled to serve on ${dateText}, ${schedulePhrase(
                          lenoir.rows,
                      )}. "Lenoir dining hall" almost always means Top of Lenoir, the all-you-care-to-eat hall upstairs in Lenoir Hall. The counters downstairs in Bottom of Lenoir keep completely separate hours and are listed individually on the hours page.`
                    : `UNC Dining has published no hours for Top of Lenoir on ${dateText}, so the upstairs hall is not scheduled to open. The Bottom of Lenoir counters downstairs — Chick-fil-A, Bento Sushi and the rest — file their own hours and can be open on days the hall above them is not, so check them separately.`,
            links: [
                { label: "Top of Lenoir's menu", href: '/lenoir-menu' },
                { label: 'All UNC dining hours today', href: '/hours' },
            ],
        },
        {
            question: "What's open at UNC right now?",
            answer: `${scheduled} UNC campus dining ${
                scheduled === 1 ? 'venue has' : 'venues have'
            } hours published for ${dateText}, out of ${
                locations.length
            } venues in total. Which of them is serving at this exact minute changes by the hour, so Eat UNC answers that on a separate page that is generated fresh on every request and never cached — it compares the current time in Chapel Hill against every venue's published service periods, including overnight windows like Chase's late night and Subway's midnight close.`,
            links: [
                { label: "What's open right now", href: '/open-now' },
                { label: "Today's hours for all of campus", href: '/hours' },
            ],
        },
        {
            question: "What's on the menu today at UNC?",
            answer: `Chase and Top of Lenoir publish a full recipe-level menu every day, broken down by meal period and station, with calories, protein, fat, carbohydrates, allergens and dietary flags on every item — those are the menus Eat UNC is built around, and you can search, sort and filter them. Many smaller UNC-run counters publish a daily menu too. Third-party brands on campus do not: their menu comes from the brand and stays the same day to day.`,
            links: [
                { label: "Today's Chase menu", href: '/chase-menu' },
                { label: "Today's Top of Lenoir menu", href: '/lenoir-menu' },
                { label: 'Both halls at a glance', href: '/today' },
            ],
        },
    ]

    const cdsEntries: FaqEntry[] = [
        {
            question: 'What is CDS at UNC?',
            answer: 'CDS stands for Carolina Dining Services, the university department that runs dining at UNC Chapel Hill. It operates the two all-you-care-to-eat halls (Chase and Top of Lenoir), the UNC-run counters and markets across campus, and it administers meal plans. When students say "the CDS menu" they mean the daily menu Carolina Dining Services publishes for those venues. Its official site is dining.unc.edu, which is also where the abbreviations "UNC Dining" and "uncdining" point.',
            links: [{ label: 'dining.unc.edu (official)', href: DINING_URL, external: true }],
        },
        {
            question: 'Is Eat UNC the official Carolina Dining Services site?',
            answer: 'No. Eat UNC is an independent student project and is not affiliated with, endorsed by or sponsored by the University of North Carolina at Chapel Hill or Carolina Dining Services. The menus, hours and nutrition here are read from what UNC Dining publishes and re-presented so they are searchable and filterable; the official source is dining.unc.edu, and anything that matters medically should be confirmed with the operator or with signage at the counter.',
            links: [
                { label: 'dining.unc.edu (official)', href: DINING_URL, external: true },
                { label: 'About Eat UNC', href: '/about' },
            ],
        },
        {
            question: 'Where do I find the CDS menu for a specific day?',
            answer: 'Every stored day for both dining halls has its own page, and you can move between dates from the menu itself. Menus normally appear the night before a service day, and no menu is published for a day a venue is closed — during breaks that can run for weeks, so an empty day is usually a closure rather than a missing file.',
            links: [
                { label: 'Chase menu', href: '/chase-menu' },
                { label: 'Top of Lenoir menu', href: '/lenoir-menu' },
            ],
        },
    ]

    const mealPlanEntries: FaqEntry[] = [
        {
            question: 'How do UNC meal plans work, and what do they cost?',
            answer: 'UNC runs meal plans, not Eat UNC — we hold no account data and no pricing, and we will not guess at either. Plan tiers, prices, what a plan includes, how many meals or swipes it carries and the deadlines for changing it are all published and kept current by Carolina Dining Services on its meal-plan pages, and they change from year to year. Read them there rather than trusting a number copied onto a third-party site.',
            links: [
                { label: 'UNC meal plans (official)', href: MEAL_PLAN_URL, external: true },
                { label: 'UNC One Card', href: ONECARD_URL, external: true },
            ],
        },
        {
            question: 'What are PLUS Swipes and Flex, and where do I check my balance?',
            answer: 'These are components of UNC dining and campus-card accounts, and their exact rules — where each one can be spent, what it converts to, when balances expire or roll over — are set by UNC and change between plan years. Eat UNC deliberately publishes none of those rules, because a stale answer about a balance is worse than no answer. Carolina Dining Services documents what each component does, and the UNC One Card office is where accounts and balances live.',
            links: [
                { label: 'UNC meal plans (official)', href: MEAL_PLAN_URL, external: true },
                { label: 'UNC One Card (balances)', href: ONECARD_URL, external: true },
            ],
        },
        {
            question: 'Where is the UNC dining portal?',
            answer: 'Meal-plan selection, changes and account questions run through UNC\'s own systems — Carolina Dining Services for the plans themselves and the UNC One Card office for the card and its balances. Eat UNC has no login, no account and no portal: it is a read-only view of published menus and hours, so there is nothing here to sign in to.',
            links: [
                { label: 'UNC meal plans (official)', href: MEAL_PLAN_URL, external: true },
                { label: 'UNC One Card', href: ONECARD_URL, external: true },
            ],
        },
    ]

    const changedEntries: FaqEntry[] = [
        {
            question: 'Is Rams Head Dining Hall still open?',
            answer: 'Rams Head Dining Hall was renamed Chase Dining Hall in 2017. It is the same building in the same place on South Campus — nothing moved and nothing closed, the name simply changed. If you were sent to "Rams Head" for a meal, go to Chase. The name does survive elsewhere on campus in Rams Market, the convenience store in the same building, and in the Rams Head Recreation Center, which is why the phrase still turns up.',
            links: [
                { label: 'Chase dining hall menu', href: '/chase-menu' },
                { label: 'Chase hours today', href: '/hours' },
            ],
        },
        {
            question: 'What happened to Alpine Bagel?',
            answer: 'Alpine Bagel in the Carolina Union closed permanently in May 2025. First Draft Deli now operates in the Union in its place, and it publishes a daily UNC menu, so you can see what it is serving and when it is open. Alpine Bagel is not in UNC Dining\'s current venue list at all, which is why searching for it on the official site returns nothing.',
            links: [
                { label: 'First Draft Deli', href: '/locations/first-draft-deli' },
                { label: 'Everything in the Carolina Union', href: '/locations' },
            ],
        },
        {
            question: 'Is Agora a UNC dining hall?',
            answer: 'No. Agora is the private dining hall at Granville Towers, run by American Campus Communities rather than by Carolina Dining Services, and it is not part of a UNC meal plan. Granville Towers is privately owned off-campus housing next to campus, and Agora serves its residents under its own separate plan. Because it is not a UNC venue, it is not in UNC Dining\'s published feed and has no menu, hours or nutrition on this site.',
            links: [{ label: 'The UNC dining halls', href: '/locations' }],
        },
    ]

    const namesEntries: FaqEntry[] = [
        {
            question: "What's the difference between Bottom of Lenoir and Top of Lenoir?",
            answer: 'They are two different operations in one building. Top of Lenoir is the all-you-care-to-eat dining hall upstairs: you swipe in once, eat as much as you like, and UNC publishes a full menu for every meal period. Bottom of Lenoir is the food court on the ground floor, where you pay counter by counter — Chick-fil-A, Bento Sushi, Mediterranean Deli, The Scoop, Bandido\'s, Zayka Indian Grill, La Farm Bakery and Alpaca Peruvian Chicken. They keep separate hours, so the downstairs counters can be serving when the hall upstairs is closed, and vice versa.',
            links: [
                { label: 'Top of Lenoir menu', href: '/lenoir-menu' },
                { label: 'Every Lenoir Hall venue', href: '/locations' },
            ],
        },
        {
            question: 'Why can I not find "the Beach Cafe" on UNC\'s site?',
            answer: 'Because UNC names the venue differently from the students who eat there. "The Beach Cafe" is what everyone calls the food court in the Brinkhous-Bullitt Building at the medical-school end of campus, and UNC Dining files its main counter as "Beach Grille". Search the official site for "beach cafe" and you get nothing; search for "Beach Grille" and you get the page. Both names appear on Eat UNC for exactly that reason, along with the other counters in the building — Italian Pizzeria III, Makus Empanadas, Hibachi & Co., Mediterranean Deli, Bandido\'s, Zayka Indian Grill, Alpaca Peruvian Chicken and The Mad Hatter\'s Café.',
            links: [
                { label: 'Beach Grille', href: '/locations/beach-grille' },
                { label: 'The whole Beach Cafe food court', href: '/locations' },
            ],
        },
        {
            question: 'Which UNC campus venues does Eat UNC cover?',
            answer: `All ${locations.length} venues Carolina Dining Services currently publishes hours or menus for, across ${
                new Set(locations.map((l) => l.venue_group)).size
            } buildings — the two dining halls, both food courts, the department and library cafes, the markets and the food trucks. Venues that are no longer in UNC's feed, such as Rams Head, Alpine Bagel, Terrace Cafe and Overlook Cafe, have no page here, and neither does Agora, which is not a UNC venue at all. We would rather leave a gap than print hours nobody published.`,
            links: [{ label: 'Every campus dining location', href: '/locations' }],
        },
    ]

    return [
        {
            id: 'hours',
            heading: 'Hours, closing times and what is open',
            intro: `The four answers below are built from the service periods UNC Dining published for ${dateText}, not from a remembered weekly pattern. They change as UNC's own schedule changes.`,
            icon: <Clock className="w-5 h-5" />,
            iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            entries: hoursEntries,
        },
        {
            id: 'cds',
            heading: 'Carolina Dining Services (CDS) and this site',
            intro: 'Who runs UNC dining, what the abbreviations mean, and where the official source is.',
            icon: <Info className="w-5 h-5" />,
            iconClass: 'bg-[#4B9CD3]/10 text-[#2c6f9e] dark:text-[#7cc0ec]',
            entries: cdsEntries,
        },
        {
            id: 'meal-plans',
            heading: 'Meal plans, PLUS Swipes and Flex',
            intro: 'UNC runs all of this, and we do not repeat prices or policies we cannot keep current. Here is where the real answers live.',
            icon: <CreditCard className="w-5 h-5" />,
            iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            entries: mealPlanEntries,
        },
        {
            id: 'renamed',
            heading: 'Venues that were renamed, closed or were never UNC’s',
            intro: 'Three names students still search for that no longer mean what they used to.',
            icon: <Building2 className="w-5 h-5" />,
            iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
            entries: changedEntries,
        },
        {
            id: 'names',
            heading: 'Student names vs. the names UNC uses',
            intro: 'Half the difficulty of finding a UNC menu is that the building, the room and the counter each have a different name.',
            icon: <MapPin className="w-5 h-5" />,
            iconClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
            entries: namesEntries,
        },
    ]
}

function AnswerLinks({ links }: { links: FaqLink[] }) {
    return (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            {links.map((link) =>
                link.external ? (
                    <a
                        key={link.href}
                        href={link.href}
                        rel="noopener"
                        className="inline-flex items-center gap-1 text-[#2c6f9e] dark:text-[#7cc0ec] font-medium hover:underline"
                    >
                        {link.label}
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                    </a>
                ) : (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="text-[#2c6f9e] dark:text-[#7cc0ec] font-medium hover:underline"
                    >
                        {link.label} →
                    </Link>
                ),
            )}
        </div>
    )
}

export default async function FaqPage() {
    const today = campusToday()

    let locations: Location[] = []
    let hours: LocationHours[] = []

    try {
        const [loadedLocations, loadedHours] = await Promise.all([
            getLocations(),
            getHoursForDate(today).catch(() => [] as LocationHours[]),
        ])
        locations = loadedLocations
        const ids = new Set(locations.map((l) => l.id))
        hours = loadedHours.filter((row) => ids.has(row.location_id))
    } catch {
        // A data outage must not blank the page: every answer below either has a written
        // fallback or is durable prose that does not depend on today's rows at all.
    }

    const groups = buildGroups(today, locations, hours)
    const allEntries = groups.flatMap((group) => group.entries)

    return (
        <CampusPage>
            <JsonLd data={breadcrumbList(CRUMBS)} />
            <JsonLd data={faqPage(allEntries.map(({ question, answer }) => ({ question, answer })))} />

            <Breadcrumbs crumbs={CRUMBS} />

            <header className="mb-8">
                <div className="flex items-start gap-4">
                    <IconTile className="w-12 h-12 bg-[#4B9CD3]/10 text-[#2c6f9e] dark:text-[#7cc0ec]">
                        <HelpCircle className="w-6 h-6" />
                    </IconTile>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            UNC Dining FAQ
                        </h1>
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                            {allEntries.length} questions about eating at UNC Chapel Hill, answered from published
                            data where there is any — and answered with a link to UNC where the answer is
                            UNC&apos;s to give.
                        </p>
                    </div>
                </div>
            </header>

            <section className="mb-10">
                <Prose>
                    <p>
                        This page collects the questions students actually type into a search box about UNC dining.
                        Where a question has a factual answer that changes — what time Chase closes, whether Lenoir
                        is open — it is written from the service periods Carolina Dining Services published for{' '}
                        {formatCampusDate(today)}, not from memory. Where a question is about money, accounts or
                        policy, the honest answer is that UNC sets those rules and publishes them itself, so you get
                        a link rather than a number we cannot keep current.
                    </p>
                    <p>
                        Eat UNC is an independent student project. It is not affiliated with, endorsed by or
                        sponsored by UNC Chapel Hill or Carolina Dining Services.
                    </p>
                </Prose>
            </section>

            <nav aria-label="Sections on this page" className="mb-10">
                <ul className="flex flex-wrap gap-2">
                    {groups.map((group) => (
                        <li key={group.id}>
                            <Link
                                href={`#${group.id}`}
                                className="inline-flex rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-sm hover:border-[#4B9CD3]/50 transition-colors"
                            >
                                {group.heading}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {groups.map((group) => (
                <section key={group.id} id={group.id} className="mb-12 scroll-mt-8" aria-labelledby={`${group.id}-h`}>
                    <div className="flex items-start gap-3 mb-4">
                        <IconTile className={group.iconClass}>{group.icon}</IconTile>
                        <div>
                            <h2
                                id={`${group.id}-h`}
                                className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                            >
                                {group.heading}
                            </h2>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {group.intro}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {group.entries.map((entry) => (
                            <Card key={entry.question} className="p-5">
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-1.5">
                                    {entry.question}
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{entry.answer}</p>
                                {entry.links && entry.links.length > 0 && <AnswerLinks links={entry.links} />}
                            </Card>
                        ))}
                    </div>
                </section>
            ))}

            <section className="mb-10" aria-labelledby="still-stuck">
                <Card className="p-6">
                    <div className="flex items-start gap-3">
                        <IconTile className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <CalendarDays className="w-5 h-5" />
                        </IconTile>
                        <div>
                            <h2
                                id="still-stuck"
                                className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2"
                            >
                                Something here wrong or missing?
                            </h2>
                            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                Campus dining changes — counters open, close and get renamed, and UNC does not
                                announce all of it. If an answer on this page is out of date, or a question you had
                                is not here,{' '}
                                <Link href="/feedback" className="text-[#2c6f9e] dark:text-[#7cc0ec] underline">
                                    tell us
                                </Link>
                                . We would rather correct a page than let it quietly go stale.
                            </p>
                        </div>
                    </div>
                </Card>
            </section>

            <nav aria-label="Related pages" className="grid sm:grid-cols-3 gap-3">
                <Link
                    href="/hours"
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                >
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" aria-hidden />
                        UNC dining hours today
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Every venue, today and tomorrow.
                    </p>
                </Link>
                <Link
                    href="/chase-menu"
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                >
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                        <Utensils className="w-4 h-4 text-sky-500" aria-hidden />
                        Dining hall menus
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Chase and Top of Lenoir, with nutrition on every item.
                    </p>
                </Link>
                <Link
                    href="/locations"
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                >
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#4B9CD3]" aria-hidden />
                        Campus dining locations
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {locations.length > 0 ? `All ${locations.length} venues` : 'Every venue'}, building by
                        building.
                    </p>
                </Link>
            </nav>
        </CampusPage>
    )
}
