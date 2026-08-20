import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
    Accessibility,
    BarChart3,
    Bell,
    Heart,
    Info,
    NotebookPen,
    Smartphone,
    Sparkles,
    Star,
    Utensils,
} from 'lucide-react'

import { APP_STORE_URL } from '@/lib/app-store'
import { SITE_URL, breadcrumbList, canonical } from '@/lib/seo'
import { Badge, Breadcrumbs, CampusPage, Card, IconTile, Prose } from '@/components/campus/CampusChrome'
import { JsonLd } from '@/components/campus/JsonLd'
import AppStoreBadge from '@/components/AppStoreBadge'

/**
 * Nothing on this page comes from the menu database, so it is genuinely static — a day-long
 * revalidate exists only so a copy change reaches production without a deploy. It carries no
 * `new Date()` and no clock-dependent claim for exactly that reason.
 */
export const revalidate = 86400

const PATH = '/unc-dining-app'
const TITLE = 'UNC Dining App for iPhone — Menus & Macros'
const DESCRIPTION =
    'Eat UNC is a free iPhone app for UNC Chapel Hill dining: every Chase and Top of Lenoir menu with full nutrition, favorites, a meal log that totals your macros, food ratings, and a notification when a favorite dish is back on the menu. iPhone only, iOS 17 and later.'

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    keywords: [
        'unc dining app',
        'eat unc app',
        'unc menu app',
        'unc dining hall app',
        'chase menu app',
        'lenoir menu app',
        'unc food app',
        'unc calorie tracker',
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
    { name: 'iPhone App', path: PATH },
]

const FEATURES = [
    {
        icon: <Heart className="w-5 h-5" />,
        iconClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        title: 'Favorites that stay on your phone',
        body: 'Star the dishes you actually eat. Favorites are stored on the device with Apple’s SwiftData, so they survive relaunches and are yours alone — the website has no equivalent, because a browser tab has nowhere durable to keep them.',
    },
    {
        icon: <NotebookPen className="w-5 h-5" />,
        iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        title: 'A meal log with real macros',
        body: 'Log a serving straight from the menu and the Tracker tab totals calories, protein, fat and carbohydrates for the day. The numbers are the ones UNC published for that recipe, not a lookup from a generic food database, so a Chase entrée logs as that entrée.',
    },
    {
        icon: <Utensils className="w-5 h-5" />,
        iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        title: 'Campus brands, not just hall recipes',
        body: 'Chick-fil-A, Bojangles, Bento Sushi, Subway, the Beach Cafe counters and the food trucks can be logged too, using the nutrition each brand publishes. Brand items file under the venue and the meal the clock says, because brands publish no meal periods of their own.',
    },
    {
        icon: <Star className="w-5 h-5" />,
        iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        title: 'Ratings for the food itself',
        body: 'Rate a dish after you eat it and your rating travels with that recipe wherever it appears — the same recipe number is served at Chase, Top of Lenoir and half the campus counters, so rating it once is enough.',
    },
    {
        icon: <Bell className="w-5 h-5" />,
        iconClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        title: 'A notification when a favorite is back',
        body: 'Turn on alerts and the app checks upcoming menus in the background and tells you when something you starred is on. These are local notifications scheduled on your own device — there is no push server and no push token.',
    },
    {
        icon: <Sparkles className="w-5 h-5" />,
        iconClass: 'bg-[#4B9CD3]/10 text-[#2c6f9e] dark:text-[#7cc0ec]',
        title: 'Top Picks for the meal in front of you',
        body: 'Set a goal — more protein, fewer calories, less fat, fewer carbs — and Top Picks scores the current meal period against it and surfaces the handful of dishes worth walking to. It is the same scoring the website uses, on the screen you already have open.',
    },
]

export default function UncDiningAppPage() {
    const softwareApplication = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        '@id': `${canonical(PATH)}#app`,
        name: 'Eat UNC',
        applicationCategory: 'FoodAndDrink',
        operatingSystem: 'iOS 17.0',
        url: canonical(PATH),
        installUrl: APP_STORE_URL,
        downloadUrl: APP_STORE_URL,
        description:
            'A free iPhone app for UNC Chapel Hill campus dining: daily Chase and Top of Lenoir menus with published nutrition, favorites, a meal log that totals macros, food ratings, local notifications for favorite dishes, and goal-based Top Picks.',
        image: `${SITE_URL}/eat_unc_logo_square.png`,
        inLanguage: 'en-US',
        isAccessibleForFree: true,
        softwareRequirements: 'Requires iOS 17.0 or later. iPhone only.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: APP_STORE_URL,
        },
        author: { '@type': 'Organization', name: 'Eat UNC', url: SITE_URL },
        publisher: { '@type': 'Organization', name: 'Eat UNC', url: SITE_URL },
        featureList: [
            'Daily Chase and Top of Lenoir dining hall menus with calories, protein, fat, carbohydrates, allergens and dietary flags',
            'Nutrition for third-party campus brands and food trucks',
            'Favorites stored on device',
            'Meal log with daily macro totals',
            'Food ratings kept per recipe',
            'Local notifications when a favorite dish returns to the menu',
            'Top Picks scored against a macro goal',
            'Filtering by dietary preference and allergen avoidance',
        ],
    }

    return (
        <CampusPage>
            <JsonLd data={breadcrumbList(CRUMBS)} />
            <JsonLd data={softwareApplication} />

            <Breadcrumbs crumbs={CRUMBS} />

            <header className="mb-10">
                <div className="flex items-start gap-4">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <Image
                            src="/eat_unc_logo_square.png"
                            alt="Eat UNC app icon"
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            The UNC Dining App for iPhone
                        </h1>
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                            Eat UNC · every UNC Chapel Hill dining menu, with the nutrition attached
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                                Free
                            </Badge>
                            <Badge className="bg-[#4B9CD3]/10 text-[#2c6f9e] dark:text-[#7cc0ec] border-[#4B9CD3]/20">
                                iPhone · iOS 17+
                            </Badge>
                            <Badge className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20">
                                No account needed
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <AppStoreBadge source="unc-dining-app-hero" />
                </div>
            </header>

            <section className="mb-12" aria-labelledby="what-it-is">
                <h2 id="what-it-is" className="sr-only">
                    What the Eat UNC app is
                </h2>
                <Prose>
                    <p>
                        Eat UNC is a free iPhone app for eating at UNC Chapel Hill. It shows the same menus this
                        website shows — Chase and Top of Lenoir day by day, with calories, protein, fat,
                        carbohydrates, allergens and dietary flags on every recipe, plus published nutrition for the
                        third-party brands and food trucks around campus. Both read the same database, so nothing
                        appears in one and not the other.
                    </p>
                    <p>
                        The reason to install it is what a phone can do that a browser tab cannot: remember. The app
                        keeps your favorites, keeps a log of what you actually ate and totals the macros, keeps your
                        ratings, and can tap you on the shoulder when a dish you starred comes back on the menu. If
                        all you want is today&apos;s menu, the website already does that and needs no download.
                    </p>
                </Prose>
            </section>

            <section className="mb-12" aria-labelledby="features">
                <div className="flex items-start gap-3 mb-5">
                    <IconTile>
                        <Smartphone className="w-5 h-5" />
                    </IconTile>
                    <div>
                        <h2
                            id="features"
                            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                        >
                            What the app adds over the website
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Six things that only work when the menu lives on your own device.
                        </p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                    {FEATURES.map((feature) => (
                        <Card key={feature.title} className="p-5">
                            <IconTile className={feature.iconClass}>{feature.icon}</IconTile>
                            <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">{feature.title}</h3>
                            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {feature.body}
                            </p>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="mb-12" aria-labelledby="requirements">
                <div className="flex items-start gap-3 mb-5">
                    <IconTile className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">
                        <Accessibility className="w-5 h-5" />
                    </IconTile>
                    <div>
                        <h2
                            id="requirements"
                            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                        >
                            What it runs on, and what it will not do
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            The limits, stated up front rather than discovered after installing.
                        </p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                    <Card className="p-5">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Requirements</h3>
                        <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            <li>iPhone only — there is no iPad layout and no Android build.</li>
                            <li>iOS 17.0 or later.</li>
                            <li>Portrait orientation only.</li>
                            <li>Free, with no in-app purchases, no subscription and no ads.</li>
                            <li>No sign-up: there is no account to create and no email to hand over.</li>
                            <li>Needs a network connection to load a menu; menus are not bundled with the app.</li>
                        </ul>
                    </Card>

                    <Card className="p-5">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Deliberate limitations</h3>
                        <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            <li>
                                <strong className="text-zinc-800 dark:text-zinc-200">One appearance, and it is
                                light.</strong>{' '}
                                There is no dark mode. iOS&apos; Increase Contrast setting is supported throughout,
                                with a higher-contrast variant of every brand color.
                            </li>
                            <li>
                                <strong className="text-zinc-800 dark:text-zinc-200">Brand items cannot be
                                favorited.</strong>{' '}
                                Favorites and menu alerts are keyed to UNC recipe numbers, which brand items do not
                                have. You can log and rate a Chick-fil-A sandwich; you cannot get an alert for one.
                            </li>
                            <li>
                                <strong className="text-zinc-800 dark:text-zinc-200">It shows what UNC
                                publishes.</strong>{' '}
                                No prices, no meal-plan balances, no swipe counts. Those belong to UNC&apos;s own
                                systems and the app has no access to them.
                            </li>
                        </ul>
                    </Card>
                </div>
            </section>

            <section className="mb-12" aria-labelledby="data">
                <div className="flex items-start gap-3 mb-5">
                    <IconTile className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <BarChart3 className="w-5 h-5" />
                    </IconTile>
                    <div>
                        <h2 id="data" className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            What the app collects, plainly
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Not buried at the bottom of a policy — this is the whole of it.
                        </p>
                    </div>
                </div>

                <Card className="p-5">
                    <div className="space-y-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        <p>
                            The app collects anonymous product analytics, and it mirrors your meal log and your
                            ratings to the same database the menus come from. Both are tied to a random identifier
                            generated on your device the first time the app runs. It is not your name, your email,
                            your Apple ID, your phone&apos;s advertising identifier or your location — none of those
                            are collected, and there is no account for anything to be attached to.
                        </p>
                        <p>
                            The analytics record how the app is used — which screens get opened, which filters get
                            set — so that the parts nobody touches can be cut. The meal-log mirror exists so a
                            device failure does not take a term of logged meals with it, and so aggregate ratings can
                            be shown back to everyone. Menu and nutrition data itself is fetched with plain read-only
                            requests that carry no identifier at all.
                        </p>
                        <p>
                            <strong className="text-zinc-900 dark:text-zinc-100">
                                All of it is off with one switch.
                            </strong>{' '}
                            The About screen inside the app has a single control that stops the analytics and the
                            mirroring together. Everything else — favorites, filter and sort preferences, the
                            onboarding state — never leaves the phone, and deleting the app deletes it.
                        </p>
                    </div>
                </Card>
            </section>

            <section className="mb-12" aria-labelledby="same-data">
                <div className="flex items-start gap-3 mb-5">
                    <IconTile className="bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Info className="w-5 h-5" />
                    </IconTile>
                    <h2
                        id="same-data"
                        className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                    >
                        The app and the website are the same data
                    </h2>
                </div>
                <Prose>
                    <p>
                        The app is a port of this website rather than a separate product. It reads the same menus,
                        the same nutrition and the same hours, updated by the same nightly job, and its filters are
                        stored under the same names the website uses — so the dietary preferences and avoided
                        allergens you set in one are the ones you would expect in the other. Where the two behave
                        differently, the website is the reference and the app follows it.
                    </p>
                    <p>
                        Eat UNC is an independent student project. It is not affiliated with, endorsed by or
                        sponsored by the University of North Carolina at Chapel Hill or Carolina Dining Services.
                        Menus and nutrition are published by UNC Dining and change without notice; if you have a food
                        allergy, confirm allergen information at the counter.
                    </p>
                </Prose>

                <div className="mt-6">
                    <AppStoreBadge source="unc-dining-app-footer" />
                </div>
            </section>

            <nav aria-label="Related pages" className="grid sm:grid-cols-3 gap-3">
                <Link
                    href="/chase-menu"
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                >
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                        <Utensils className="w-4 h-4 text-sky-500" aria-hidden />
                        Dining hall menus
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Chase and Top of Lenoir in the browser, no download.
                    </p>
                </Link>
                <Link
                    href="/hours"
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                >
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-amber-500" aria-hidden />
                        UNC dining hours today
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Every venue, today and tomorrow.</p>
                </Link>
                <Link
                    href="/faq"
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 hover:border-[#4B9CD3]/50 transition-colors"
                >
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-[#4B9CD3]" aria-hidden />
                        UNC dining FAQ
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        CDS, meal plans and the venues that changed name.
                    </p>
                </Link>
            </nav>
        </CampusPage>
    )
}
