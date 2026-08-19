import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, UtensilsCrossed } from "lucide-react";
import { getFullMenuByDateAndHall } from "@/lib/api";
import {
    campusToday,
    getHoursForLocations,
    getLocationsBySlug,
    type LocationHours,
} from "@/lib/campus";
import { groupByPeriodAndStation, type OutlineEntry } from "@/components/MenuOutline";
import { breadcrumbList, canonical, jsonLd } from "@/lib/seo";
import { compareMealPeriods } from "@/lib/utils";

// This page is entirely about "today". Without a revalidate it is prerendered once at build
// time and then frozen — the deployed build was six days old and still announcing
// "Thursday, August 13, 2026" while linking to /chase/2026-08-13.
export const revalidate = 900;

export const metadata: Metadata = {
    title: "What's on the UNC Dining Menu Today",
    description:
        "Today's menus for Chase and Top of Lenoir at UNC Chapel Hill — meal times, stations and calories for every item, updated nightly. See what's being served before you walk over.",
    keywords: [
        "unc dining today",
        "unc menu today",
        "what's on the menu today",
        "unc dining hall today",
        "unc chapel hill dining today",
        "todays menu unc",
    ],
    openGraph: {
        title: "What's on the UNC Dining Menu Today",
        description:
            "Today's menus for Chase and Top of Lenoir at UNC Chapel Hill — meal times, stations and calories for every item.",
        url: canonical("/today"),
        siteName: "Eat UNC",
        type: "website",
    },
    alternates: {
        canonical: canonical("/today"),
    },
};

const HALLS = [
    {
        slug: "chase",
        locationSlug: "chase",
        diningHall: "Chase",
        name: "Chase Dining Hall",
        campus: "South Campus",
        accent: "blue",
    },
    {
        slug: "lenoir",
        locationSlug: "top-of-lenoir",
        diningHall: "Top of Lenoir",
        name: "Top of Lenoir",
        campus: "North Campus",
        accent: "teal",
    },
] as const;

type HallToday = {
    slug: string;
    name: string;
    campus: string;
    accent: string;
    itemCount: number;
    periods: { period: string; stationCount: number; itemCount: number; sample: string[] }[];
    hours: LocationHours[];
};

/** Today's menu and hours for one hall. Failures degrade to an empty card, never a 500. */
async function loadHall(hall: (typeof HALLS)[number], date: string): Promise<HallToday> {
    const empty: HallToday = {
        slug: hall.slug,
        name: hall.name,
        campus: hall.campus,
        accent: hall.accent,
        itemCount: 0,
        periods: [],
        hours: [],
    };

    const [menuResult, hoursResult] = await Promise.allSettled([
        getFullMenuByDateAndHall(date, hall.diningHall),
        getLocationsBySlug(hall.locationSlug).then((locations) =>
            locations.length
                ? getHoursForLocations(
                      locations.map((l) => l.id),
                      date,
                      date,
                  )
                : [],
        ),
    ]);

    if (hoursResult.status === "fulfilled") empty.hours = hoursResult.value;
    if (menuResult.status !== "fulfilled" || !menuResult.value) return empty;

    const entries = (menuResult.value.menu_entries ?? []) as OutlineEntry[];
    const grouped = groupByPeriodAndStation(entries);

    return {
        ...empty,
        itemCount: entries.length,
        periods: grouped.map(({ period, stations }) => ({
            period,
            stationCount: stations.length,
            itemCount: stations.reduce((sum, s) => sum + s.items.length, 0),
            // A handful of real dishes, so the page says something concrete about today
            // rather than only counting things.
            sample: stations
                .flatMap((s) => s.items)
                .map((i) => i.master_food_items?.food_name)
                .filter((n): n is string => Boolean(n))
                .slice(0, 6),
        })),
    };
}

export default async function TodayPage() {
    const today = campusToday();
    const formattedDate = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date());

    const halls = await Promise.all(HALLS.map((hall) => loadHall(hall, today)));
    const anyMenu = halls.some((h) => h.itemCount > 0);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLd(
                        breadcrumbList([
                            { name: "Eat UNC", path: "/" },
                            { name: "Today's menu", path: "/today" },
                        ]),
                    ),
                }}
            />
            <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">
                        What&apos;s on the UNC dining menu today
                    </h1>
                    <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-2">{formattedDate}</p>
                    <p className="text-zinc-600 dark:text-zinc-300 max-w-2xl mb-10 leading-relaxed">
                        Both UNC Chapel Hill dining halls, with the stations serving right now and
                        the calories for every dish. Menus come from Carolina Dining Services and
                        refresh nightly.
                    </p>

                    {!anyMenu && (
                        <div className="mb-10 p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                            <p className="text-zinc-700 dark:text-zinc-300">
                                No menu is published for {formattedDate} yet. Both halls close for
                                university breaks, and menus usually appear a day or two ahead —
                                check the hall pages below for the next date that has one.
                            </p>
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        {halls.map((hall) => (
                            <section
                                key={hall.slug}
                                className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col"
                            >
                                <div className="flex items-start gap-3 mb-4">
                                    <div
                                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                            hall.accent === "blue"
                                                ? "bg-blue-500/10 text-blue-600"
                                                : "bg-teal-500/10 text-teal-600"
                                        }`}
                                    >
                                        <UtensilsCrossed className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                                            {hall.name}
                                        </h2>
                                        <p className="text-sm text-zinc-500">
                                            {hall.campus}
                                            {hall.itemCount > 0 && ` · ${hall.itemCount} items today`}
                                        </p>
                                    </div>
                                </div>

                                {hall.hours.length > 0 && (
                                    <div className="mb-4 space-y-1.5">
                                        {hall.hours.map((row) => (
                                            <div
                                                key={row.id}
                                                className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400"
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                                    {row.period_name}
                                                </span>
                                                <span className="font-medium tabular-nums">
                                                    {row.opens_label} – {row.closes_label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {hall.periods.length > 0 ? (
                                    <div className="space-y-4 flex-1">
                                        {hall.periods
                                            .slice()
                                            .sort((a, b) => compareMealPeriods(a.period, b.period))
                                            .map((period) => (
                                                <div key={period.period}>
                                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                        {period.period}
                                                    </h3>
                                                    <p className="text-xs text-zinc-500 mb-1">
                                                        {period.stationCount} stations ·{" "}
                                                        {period.itemCount} items
                                                    </p>
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                        {period.sample.join(" · ")}
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-500 flex-1">
                                        Nothing published for {hall.name} today.
                                    </p>
                                )}

                                <Link
                                    href={`/${hall.slug}/${today}`}
                                    className={`mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition-colors ${
                                        hall.accent === "blue"
                                            ? "bg-blue-600 hover:bg-blue-700"
                                            : "bg-teal-600 hover:bg-teal-700"
                                    }`}
                                >
                                    Full {hall.name} menu
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </section>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-wrap gap-4 text-sm">
                        <Link href="/open-now" className="text-blue-600 dark:text-blue-400 hover:underline">
                            What&apos;s open right now →
                        </Link>
                        <Link href="/hours" className="text-blue-600 dark:text-blue-400 hover:underline">
                            All UNC dining hours today →
                        </Link>
                        <Link href="/locations" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Every campus dining location →
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
