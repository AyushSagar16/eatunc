import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'iOS App Privacy Policy | Eat UNC',
    description:
        'Privacy policy for the Eat UNC iOS app. The app collects no data: no account, no analytics, no tracking, and no third-party SDKs.',
    openGraph: {
        title: 'iOS App Privacy Policy | Eat UNC',
        description:
            'Privacy policy for the Eat UNC iOS app. The app collects no data: no account, no analytics, no tracking.',
        url: 'https://eatunc.com/privacy/ios',
        siteName: 'UNC Dining Menu',
        type: 'website',
    },
    alternates: {
        canonical: 'https://eatunc.com/privacy/ios',
    },
}

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
                <p className="text-zinc-600 dark:text-zinc-400 mb-8">
                    This policy covers the <strong>Eat UNC iOS app</strong>. The website has a{' '}
                    <Link
                        href="/privacy"
                        className="underline hover:text-zinc-900 dark:hover:text-zinc-200"
                    >
                        separate privacy policy
                    </Link>
                    ; the two are not interchangeable, because the website uses analytics and the app
                    does not.
                </p>

                <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                        Last updated: August 6, 2026
                    </p>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            The short version
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            The app collects nothing about you. There is no account, no sign-in, no
                            analytics, no advertising, and no third-party SDK of any kind. Nothing you do
                            in the app is transmitted to us or to anyone else.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            What stays on your device
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400">
                            <li>
                                <strong>Favorites</strong> — the foods you star, stored locally with
                                Apple&apos;s SwiftData framework.
                            </li>
                            <li>
                                <strong>Filter and sort preferences</strong> — macro goals, dietary
                                preferences, avoided allergens, and sort order.
                            </li>
                            <li>
                                <strong>Interface state</strong> — whether you have seen the onboarding
                                tour, and which menu stations you have collapsed.
                            </li>
                        </ul>
                        <p className="text-zinc-600 dark:text-zinc-400 mt-4">
                            This data never leaves your phone. Deleting the app deletes all of it. We
                            cannot see it, cannot recover it, and receive no copy of it.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            What the app sends over the network
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            The app makes anonymous, read-only requests to a public database to fetch
                            dining hall menus and nutrition information. These requests contain only what
                            is needed to load a menu — the dining hall, the date, and, when favorite
                            alerts are enabled, the recipe numbers of your starred foods so upcoming
                            menus can be matched against them.
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            No device identifier, advertising identifier, account identifier, or location
                            data is sent. The requests are not linked to you or to any profile. All
                            traffic uses HTTPS.
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Your favorite foods are sent as anonymous recipe numbers only, and are used
                            solely to generate the response for that request. They are not stored against
                            any user record.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Notifications
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            Favorite alerts are <strong>local notifications</strong>, created and
                            scheduled by the app on your own device. There is no push server and no Apple
                            Push Notification service token. Notifications are only scheduled if you
                            explicitly enable alerts and grant notification permission, and you can
                            revoke that permission at any time in iOS Settings.
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            The app also registers a background refresh task so those local alerts stay
                            accurate when menus change. It performs the same anonymous menu lookup
                            described above and nothing else.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Data we collect
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            None. Under Apple&apos;s App Privacy definitions, this app is{' '}
                            <strong>&ldquo;Data Not Collected.&rdquo;</strong>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Children
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            The app is rated 4+ and collects no data from anyone, including children
                            under 13.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Third parties
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            The app contains no advertising networks, analytics providers, crash
                            reporting SDKs, social media SDKs, or tracking technologies. Nothing about
                            your usage is shared or sold, because nothing is gathered.
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Menu data is served from a Supabase-hosted public database. Supabase
                            processes the network request itself (including the originating IP address,
                            as any web server does) in order to return the menu; it receives no personal
                            information from the app.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Affiliation
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Eat UNC is an unofficial, independently developed app. It is not affiliated
                            with, endorsed by, or sponsored by the University of North Carolina at Chapel
                            Hill or Carolina Dining Services. Menu and nutrition information is published
                            by UNC Dining and may change without notice; if you have a food allergy,
                            always confirm allergen information posted at the dining hall.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Changes
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            If this policy changes, the &ldquo;Last updated&rdquo; date above will change
                            with it. Material changes will be noted in the app&apos;s release notes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Contact
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            If you have questions about this privacy policy, please contact us through
                            our{' '}
                            <Link
                                href="/feedback"
                                className="underline hover:text-zinc-900 dark:hover:text-zinc-200"
                            >
                                feedback page
                            </Link>
                            .
                        </p>
                    </section>
                </div>
            </div>
        </main>
    )
}
