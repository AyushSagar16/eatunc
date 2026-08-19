
import { getAvailableDates, getFullMenuByDateAndHall } from "@/lib/api";
import MenuContainer from "@/components/MenuContainer";
import NoMenuAvailable from "@/components/NoMenuAvailable";
import BackButton from "@/components/BackButton";
import StructuredData from "@/components/StructuredData";
import MenuTutorial from "@/components/MenuTutorial";
import FeedbackPopup from "@/components/FeedbackPopup";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { compareMealPeriods } from "@/lib/utils";
import MenuOutline from "@/components/MenuOutline";
import { campusToday, getHoursForLocations, getLocationsBySlug, shiftDate } from "@/lib/campus";

// Dynamic rendering - no caching, always fetch fresh data
export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{
        hall: string;
        date: string;
    }>;
}

const HALL_MAP: Record<string, string> = {
    chase: 'Chase',
    lenoir: 'Top of Lenoir',
};

/**
 * How far either side of today a dated menu page is worth indexing.
 *
 * Google had indexed the whole back-catalogue and was serving /lenoir/2026-01-08 for
 * "lenoir dining hall menu" in August — a page that cannot answer the query at all. Old dates
 * stay reachable and keep a self-canonical, but they are marked noindex so the ranking signal
 * consolidates on today's menu and on /lenoir-menu instead of splitting across 236 near-
 * duplicate URLs.
 */
const INDEXABLE_PAST_DAYS = 7;
const INDEXABLE_FUTURE_DAYS = 14;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { hall, date } = await params;
    const hallName = HALL_MAP[hall];

    if (!hallName || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { title: 'Page Not Found', robots: { index: false, follow: false } };
    }

    const formattedDate = formatMenuDate(date);
    const shortDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
    });

    // Chapel Hill's date, not the server's — a UTC server rolls over to tomorrow at 8pm ET
    // and would have called tomorrow's menu "today" every single evening.
    const today = campusToday();
    const isToday = date === today;
    const withinIndexWindow =
        date >= shiftDate(today, -INDEXABLE_PAST_DAYS) &&
        date <= shiftDate(today, INDEXABLE_FUTURE_DAYS);

    const hallDisplayName = hall === 'chase' ? 'Chase Dining Hall' : 'Lenoir Dining Hall';
    const title = isToday
        ? `${hallDisplayName} Menu Today — ${shortDate}`
        : `${hallDisplayName} Menu — ${formattedDate}`;

    const description = isToday
        ? `Everything on the ${hallDisplayName} menu today at UNC Chapel Hill, with calories, protein and allergens for every item. Filter by diet, sort by macros. Free and updated nightly.`
        : `The full ${hallDisplayName} menu for ${formattedDate} at UNC Chapel Hill — every station, with calories, protein and allergens for each item.`;

    return {
        title,
        description,
        keywords: [
            `${hall} dining hall menu`,
            `${hall} menu unc`,
            `unc ${hall} menu`,
            'unc dining hall menu',
            'unc dining today',
            'UNC Chapel Hill dining',
        ],
        openGraph: {
            title,
            description,
            url: `https://eatunc.com/${hall}/${date}`,
            siteName: 'Eat UNC',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: `https://eatunc.com/${hall}/${date}`,
        },
        robots: withinIndexWindow
            ? undefined
            : { index: false, follow: true },
    };
}


/** The two halls are rows in `locations`, under slugs that differ from the site's URL slugs. */
const HALL_LOCATION_SLUG: Record<string, string> = {
    chase: 'chase',
    lenoir: 'top-of-lenoir',
};

function formatMenuDate(date: string) {
    return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Real service periods for the hall, used for the page's opening-hours markup.
 *
 * Failure here is deliberately non-fatal: hours are supporting detail, and a hall with no
 * stored hours for the week (which happens over breaks) must not take the menu down with it.
 */
async function loadHallHours(hallSlug: string) {
    try {
        const locations = await getLocationsBySlug(HALL_LOCATION_SLUG[hallSlug]);
        if (locations.length === 0) return [];
        const today = campusToday();
        return await getHoursForLocations(
            locations.map((l) => l.id),
            shiftDate(today, -7),
            shiftDate(today, 7),
        );
    } catch {
        return [];
    }
}

export default async function Page({ params }: PageProps) {
    const { hall: hallSlug, date } = await params;
    const selectedHall = HALL_MAP[hallSlug];

    // Validated before any fetching so that notFound() sets a real 404 status. Under
    // `force-dynamic` the response streams, and a notFound() reached after the first flush
    // arrives too late to change the status line — which is how /notahall/2026-08-19 and
    // /chase/not-a-date both came to answer 200.
    if (!selectedHall) notFound();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

    let menu: Awaited<ReturnType<typeof getFullMenuByDateAndHall>> | undefined;
    let dateData: Awaited<ReturnType<typeof getAvailableDates>> | undefined;
    let menuError: Error | undefined;
    let hours: Awaited<ReturnType<typeof loadHallHours>> = [];

    try {
        const [datesResult, menuResult, hoursResult] = await Promise.allSettled([
            getAvailableDates(),
            getFullMenuByDateAndHall(date, selectedHall),
            loadHallHours(hallSlug),
        ]);

        const errorMessages: string[] = [];

        if (datesResult.status === "fulfilled") {
            dateData = datesResult.value;
        } else {
            errorMessages.push("Failed to load available dates");
        }

        if (menuResult.status === "fulfilled") {
            menu = menuResult.value;
        } else {
            const reason = menuResult.reason;
            errorMessages.push(reason instanceof Error ? reason.message : "Failed to load menu data");
        }

        if (hoursResult.status === "fulfilled") {
            hours = hoursResult.value;
        }

        if (errorMessages.length > 0) {
            menuError = new Error(errorMessages.join(" | "));
        }
    } catch (error) {
        menuError = error as Error;
    }

    const availableDates = Array.from(new Set(dateData?.map(d => d.menu_date) || [])).sort();
    const formattedDate = formatMenuDate(date);
    const hallDisplayName = hallSlug === 'chase' ? 'Chase Dining Hall' : 'Lenoir Dining Hall';

    const shell = (children: React.ReactNode, extra?: React.ReactNode) => (
        <main className="min-h-screen bg-transparent relative overflow-hidden">
            {extra}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-500/10 blur-[120px] pointer-events-none -z-10 dark:bg-blue-600/5" />
            {children}
        </main>
    );

    if (menuError) {
        return shell(
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="max-w-sm w-full text-center p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Failed to load menus</h2>
                    <p className="text-zinc-500 mb-8 text-sm">{menuError.message}</p>
                    <a
                        href={`/${hallSlug}/${date}`}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors w-full"
                    >
                        Retry Connection
                    </a>
                </div>
            </div>
        );
    }

    if (!menu) {
        return shell(
            <NoMenuAvailable
                selectedDate={date}
                selectedHall={selectedHall}
                availableDates={availableDates}
                nextAvailableDate={availableDates.find(d => d > date)}
            />
        );
    }

    // Passed straight through. Each entry used to be rebuilt with a `meal_period_raw` copy of
    // `meal_period` and the hall name repeated on it; nothing reads either, and at ~1,360
    // entries a day the two dead fields were around 90KB of RSC payload per request.
    const hallFilteredEntries = menu.menu_entries || [];

    const availablePeriods = Array.from(new Set(hallFilteredEntries.map(e => e.meal_period)));
    availablePeriods.sort(compareMealPeriods);

    return shell(
        <div className="relative">
            <MenuTutorial />
            <FeedbackPopup />

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex justify-start">
                    <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                        <Image
                            src="/eat_unc_text_logo_nw.png"
                            alt="EAT UNC"
                            width={600}
                            height={180}
                            className="h-28 md:h-36 w-auto"
                            priority
                        />
                    </Link>
                </div>

                {/* The page had no h1 at all — its only heading-level content was a logo image. */}
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                    {hallDisplayName} Menu
                </h1>
                <p className="mt-1 mb-2 text-zinc-500 dark:text-zinc-400">
                    {formattedDate} · {availablePeriods.length > 0 ? availablePeriods.map(p => p.split('(')[0].trim()).join(', ') : 'No meals scheduled'} · {hallFilteredEntries.length} items with nutrition
                </p>
            </div>

            <MenuContainer
                key={`${date}-${selectedHall}`}
                allEntries={hallFilteredEntries}
                availablePeriods={availablePeriods}
                availableDates={availableDates}
                selectedDate={date}
                selectedHall={selectedHall}
                initialPeriod={undefined}
            />

            <MenuOutline
                entries={hallFilteredEntries}
                hallName={hallDisplayName}
                formattedDate={formattedDate}
            />
        </div>,
        <StructuredData
            hall={hallSlug}
            date={date}
            formattedDate={formattedDate}
            entries={hallFilteredEntries}
            hours={hours}
        />
    );
}
