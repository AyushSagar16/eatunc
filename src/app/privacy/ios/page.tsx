import Link from 'next/link'
import type { Metadata } from 'next'

/**
 * The App Store privacy policy for the iOS app.
 *
 * This page and `PRIVACY-POLICY.md` in the eat-unc-app repo are deliberately the same text —
 * that file closes by saying so, because this URL is the one given to App Store Connect. They
 * are versioned in separate repos, so they have to be updated together by hand; this page had
 * drifted a release behind and was still declaring "Data Not Collected" for a build that ships
 * PostHog and mirrors the meal log.
 *
 * If the app's policy changes, change this with it, and change the `Last updated` date.
 */

const LAST_UPDATED = 'August 19, 2026'

export const metadata: Metadata = {
    title: 'iOS App Privacy Policy | Eat UNC',
    description:
        'Privacy policy for the Eat UNC iOS app: no account and no location, anonymous usage analytics and an optional meal log, both switchable off in one place.',
    openGraph: {
        title: 'iOS App Privacy Policy | Eat UNC',
        description:
            'Privacy policy for the Eat UNC iOS app: no account and no location, anonymous usage analytics and an optional meal log, both switchable off in one place.',
        url: 'https://eatunc.com/privacy/ios',
        siteName: 'Eat UNC',
        type: 'website',
    },
    alternates: {
        canonical: 'https://eatunc.com/privacy/ios',
    },
}

const H2 = 'text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4'
const H3 = 'text-base font-bold text-zinc-900 dark:text-zinc-50 mb-2'
const P = 'text-zinc-600 dark:text-zinc-400'
const UL = 'list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400'

const THIRD_PARTIES: { who: string; what: string; why: string }[] = [
    { who: 'PostHog', what: 'Anonymous usage events and the random identifier', why: 'Product analytics' },
    {
        who: 'Supabase',
        what: 'Menu and hours requests, and your meal log and ratings if enabled',
        why: 'Hosting our database',
    },
    {
        who: 'Open-Meteo',
        what: 'A fixed Chapel Hill coordinate — nothing about you',
        why: 'The temperature on the home screen',
    },
    {
        who: 'Apple',
        what: "The app's bundle ID and your device's storefront region — nothing else",
        why: 'Checking whether a newer version is available',
    },
]

export default function AppPrivacyPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
            <div className="container mx-auto px-6 py-12 max-w-3xl">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 mb-8"
                >
                    ← Back to Home
                </Link>

                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                    iOS App Privacy Policy
                </h1>
                <p className={`${P} mb-8`}>
                    This policy covers the <strong>Eat UNC iOS app</strong>. The eatunc.com website has
                    its{' '}
                    <Link href="/privacy" className="underline hover:text-zinc-900 dark:hover:text-zinc-200">
                        own, separate policy
                    </Link>
                    ; the two are not interchangeable.
                </p>

                <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
                    <p className={`${P} text-sm`}>Last updated: {LAST_UPDATED}</p>

                    <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            This policy changed materially in this version.
                        </p>
                        <p className={`${P} mt-2`}>
                            Earlier versions of the app collected nothing at all. This version adds
                            anonymous usage analytics and, if you use the meal tracker, sends what you log
                            to our own database. Both are described below, and both can be switched off in
                            one place: <strong>About → Share anonymous usage data</strong>.
                        </p>
                        <p className={`${P} mt-2`}>
                            This version also removes the location permission an earlier version added. The
                            app now requests no location permission, links no location framework, and has no
                            way to find out where you are — full stop. See{' '}
                            <a href="#what-we-never-collect" className="underline hover:text-zinc-900 dark:hover:text-zinc-200">
                                What we never collect
                            </a>
                            .
                        </p>
                        <p className={`${P} mt-2`}>
                            This version also adds a check against Apple&apos;s own App Store listing, so
                            the app can tell you when it is out of date. See{' '}
                            <a href="#checking-for-updates" className="underline hover:text-zinc-900 dark:hover:text-zinc-200">
                                Checking for updates
                            </a>
                            .
                        </p>
                    </aside>

                    <section>
                        <h2 className={H2}>The short version</h2>
                        <p className={P}>
                            There is no account and no sign-in. We never ask for your email, and nothing you
                            do is used for advertising or shared with advertisers. The app cannot access
                            your location — it asks for no location permission at all. What we do collect is
                            anonymous product analytics and — if you use the tracker — the foods you log.
                            One switch in About turns both off.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>What stays on your device, always</h2>
                        <ul className={UL}>
                            <li>
                                <strong>Favorites</strong> — the foods you star, stored locally with
                                Apple&apos;s SwiftData framework.
                            </li>
                            <li>
                                <strong>Your meal log</strong> — everything you add to your plate. The device
                                copy is the real one; the app works fully offline and the copy we receive is
                                a mirror, not the source.
                            </li>
                            <li>
                                <strong>Your name</strong>, if you give one during the tour. It is optional,
                                it is used only to greet you inside the app, and it is{' '}
                                <strong>never transmitted anywhere</strong>.
                            </li>
                            <li>
                                <strong>Goals</strong>, if you set calorie or macro targets.
                            </li>
                            <li>
                                <strong>Filter, sort and view preferences</strong> — macro goals, dietary
                                preferences, avoided allergens, sort order, and card density, stored in iOS{' '}
                                <code>UserDefaults</code>.
                            </li>
                            <li>
                                <strong>Interface state</strong> — whether you have seen the tour, and which
                                stations you collapsed.
                            </li>
                        </ul>
                        <p className={`${P} mt-4`}>
                            Deleting the app deletes all of it, including the anonymous identifier described
                            below.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>The anonymous identifier</h2>
                        <p className={P}>
                            The first time the app runs it generates a random UUID. It is not derived from
                            your device, your hardware, or anything about you — it is a random number, and
                            two installs on the same phone produce different ones. It is stored in{' '}
                            <code>UserDefaults</code>, which means{' '}
                            <strong>deleting the app destroys it permanently</strong>; reinstalling makes you
                            a new, unconnected person to us.
                        </p>
                        <p className={`${P} mt-4`}>
                            We deliberately do not store it in the Keychain, which would survive reinstalls.
                            We do not use Apple&apos;s advertising identifier (IDFA) and do not ask for
                            tracking permission, because we do not track you across other companies&apos;
                            apps or websites.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>What we collect</h2>

                        <h3 className={H3}>Usage analytics — processor: PostHog</h3>
                        <p className={P}>
                            Which actions you take and which features you use: opening a hall, changing the
                            date or meal, applying a filter, logging a food, rating one, viewing the receipt.
                            Each event carries the anonymous identifier and the app version. The app does not
                            record which screens you view — automatic screen tracking is switched off, and no
                            screen-view event is ever sent.
                        </p>
                        <p className={`${P} mt-4`}>
                            Purpose: to understand which parts of the app are used and worth keeping. Under
                            Apple&apos;s App Privacy definitions this is{' '}
                            <strong>Usage Data → Product Interaction</strong> and <strong>Identifiers</strong>,
                            collected for <strong>Analytics</strong>, and <strong>not used for tracking</strong>.
                        </p>
                        <p className={`${P} mt-4`}>
                            Our analytics processor is{' '}
                            <a
                                href="https://posthog.com"
                                rel="noopener noreferrer"
                                target="_blank"
                                className="underline hover:text-zinc-900 dark:hover:text-zinc-200"
                            >
                                PostHog
                            </a>
                            , on their US infrastructure.{' '}
                            <strong>
                                Location lookup is explicitly disabled on every event the app sends
                            </strong>
                            , so no city, region or country is derived from your IP address. PostHog
                            processes this data on our instructions and provides equivalent protection to
                            that described in this policy; they do not sell it and do not combine it with
                            data from other companies&apos; apps to target advertising.
                        </p>

                        <h3 className={`${H3} mt-6`}>Your meal log — our own database</h3>
                        <p className={P}>
                            If you add foods to your plate, each change is sent to our own Supabase database
                            as an append-only record: the food, how many servings, the date, the meal, the
                            dining hall, and the anonymous identifier. Nothing identifies you personally, and
                            there is no way for us to connect a log to a real person.
                        </p>
                        <p className={`${P} mt-4`}>
                            Purpose: to see what students actually eat, so the app can be improved.
                        </p>
                        <p className={`${P} mt-4`}>
                            The app can only <strong>insert</strong> these records. It has no permission to
                            read anyone&apos;s records — including your own — so no one holding the
                            app&apos;s public key can retrieve another person&apos;s meal history.
                            Corrections work by adding a new record rather than editing an old one.
                        </p>

                        <h3 className={`${H3} mt-6`}>Food ratings</h3>
                        <p className={P}>
                            A thumbs up or down is sent with the same anonymous identifier, the food, and the
                            dining hall.
                        </p>
                    </section>

                    <section id="what-we-never-collect" className="scroll-mt-24">
                        <h2 className={H2}>What we never collect</h2>
                        <p className={P}>
                            Your name, email address, phone number, postal address, contacts, photos, health
                            or fitness data from Apple Health, financial information, your location, or your
                            advertising identifier. The app requests no location permission, links no
                            location framework, and has no way to find out where you are. The app contains no
                            advertising SDK, no social media SDK, and no crash-reporting SDK.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>How to switch it off</h2>
                        <p className={P}>
                            <strong>About → Share anonymous usage data.</strong> Turning it off stops the
                            analytics events and stops the meal log leaving the phone. The tracker keeps
                            working; it simply stays local.
                        </p>
                        <p className={`${P} mt-4`}>
                            The switch takes effect immediately. Records already sent cannot be linked back
                            to you by us, because we hold no identity to match them against — if you want
                            them gone,{' '}
                            <Link href="/feedback" className="underline hover:text-zinc-900 dark:hover:text-zinc-200">
                                contact us
                            </Link>{' '}
                            with the timeframe and we will delete records for that window.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>What the app sends to load a menu</h2>
                        <p className={P}>
                            The app makes anonymous, read-only requests to the same public database to fetch
                            menus, opening hours and nutrition information — the venue, the date, and, when
                            favorite alerts are on, the recipe numbers of your starred foods so upcoming
                            menus can be matched. All traffic uses HTTPS.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>The weather</h2>
                        <p className={P}>
                            The home screen shows the current temperature and conditions for{' '}
                            <strong>Chapel Hill</strong>. It comes from{' '}
                            <a
                                href="https://open-meteo.com"
                                rel="noopener noreferrer"
                                target="_blank"
                                className="underline hover:text-zinc-900 dark:hover:text-zinc-200"
                            >
                                Open-Meteo
                            </a>
                            , a free weather service that needs no account and no API key.
                        </p>
                        <p className={`${P} mt-4`}>
                            The app asks for no location permission, so there is nothing it could use even if
                            it wanted to. The request contains one thing: a fixed pair of coordinates for
                            Chapel Hill, compiled into the app — the same question from anywhere in the world
                            gets the same answer. As with any request over the internet, Open-Meteo can see
                            the IP address it came from; nothing else about you is sent, and no identifier of
                            ours goes with it.
                        </p>
                    </section>

                    <section id="checking-for-updates" className="scroll-mt-24">
                        <h2 className={H2}>Checking for updates</h2>
                        <p className={P}>
                            Every time the app comes to the foreground, it asks Apple&apos;s own App Store
                            lookup service (<code>itunes.apple.com/lookup</code>) which version of Eat UNC is
                            currently for sale, so it can tell you if the one you have is out of date. The
                            request carries the app&apos;s bundle ID and your device&apos;s storefront region
                            — read from iOS&apos;s <code>Locale</code>, not from location services — as a
                            query parameter. As with any request over the internet, Apple&apos;s servers see
                            the device&apos;s IP address along with it.
                        </p>
                        <p className={`${P} mt-4`}>
                            Nothing about you is sent: no identifier, no name, nothing tied to your usage of
                            the app. The response — a version number and when we saw it — is kept only in{' '}
                            <code>UserDefaults</code> and is overwritten the next time the app checks. This
                            check runs regardless of the analytics switch in About; it keeps the app working
                            rather than collecting anything about you.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>Notifications</h2>
                        <p className={P}>
                            Favorite alerts are <strong>local notifications</strong>, created and scheduled
                            on your own device with Apple&apos;s <code>UNUserNotificationCenter</code>. There
                            is no push server and no APNs token. They are only scheduled if you enable alerts
                            and grant permission, which you can revoke at any time in iOS Settings.
                        </p>
                        <p className={`${P} mt-4`}>
                            The app also registers a background refresh task so those alerts stay accurate
                            when menus change. It performs the same anonymous menu lookup and nothing else.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>Retention</h2>
                        <p className={P}>
                            Analytics events are retained by PostHog under our account&apos;s retention
                            settings. Meal log and rating records are kept indefinitely in aggregate, as they
                            have no personal identity attached. Everything on your device is kept until you
                            delete the app.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>Children</h2>
                        <p className={P}>
                            The app is rated 4+. It is intended for university students and does not
                            knowingly collect data from children under 13. No collected data identifies
                            anyone.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>Third parties</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                                        <th className="py-2 pr-4 font-semibold text-zinc-900 dark:text-zinc-100">
                                            Who
                                        </th>
                                        <th className="py-2 pr-4 font-semibold text-zinc-900 dark:text-zinc-100">
                                            What they get
                                        </th>
                                        <th className="py-2 font-semibold text-zinc-900 dark:text-zinc-100">
                                            Why
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {THIRD_PARTIES.map((row) => (
                                        <tr key={row.who} className="border-b border-zinc-100 dark:border-zinc-900">
                                            <td className="py-2 pr-4 font-medium text-zinc-800 dark:text-zinc-200">
                                                {row.who}
                                            </td>
                                            <td className={`py-2 pr-4 ${P}`}>{row.what}</td>
                                            <td className={`py-2 ${P}`}>{row.why}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className={`${P} mt-4`}>
                            PostHog and Supabase process data on our instructions and provide equivalent
                            protection to that described here. Open-Meteo and Apple receive no data about you
                            at all, so they process nothing on our behalf. None of them is a data broker.
                            Nothing about you is sold.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>Affiliation</h2>
                        <p className={P}>
                            Eat UNC is an unofficial, independently developed app. It is not affiliated with,
                            endorsed by, or sponsored by the University of North Carolina at Chapel Hill or
                            Carolina Dining Services. Menu and nutrition information is published by UNC
                            Dining and may change without notice; if you have a food allergy, always confirm
                            allergen information posted at the dining hall.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>Changes</h2>
                        <p className={P}>
                            If this policy changes, the &ldquo;Last updated&rdquo; date above will change with
                            it. Material changes will be noted in the app&apos;s release notes.
                        </p>
                    </section>

                    <section>
                        <h2 className={H2}>Contact</h2>
                        <p className={P}>
                            Questions, or a deletion request:{' '}
                            <Link href="/feedback" className="underline hover:text-zinc-900 dark:hover:text-zinc-200">
                                eatunc.com/feedback
                            </Link>
                            .
                        </p>
                    </section>
                </div>
            </div>
        </main>
    )
}
