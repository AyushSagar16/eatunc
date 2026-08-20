import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Store, UtensilsCrossed } from "lucide-react";
import {
    campusToday,
    getHoursForLocations,
    getLocations,
    getLocationsBySlug,
    getMenuPreview,
    locationPath,
    shiftDate,
    type Location,
    type LocationHours,
    type MenuPreviewItem,
} from "@/lib/campus";
import { breadcrumbList, canonical, faqPage, jsonLd, toOpeningHoursSpecification } from "@/lib/seo";
import { compareMealPeriods } from "@/lib/utils";

export const revalidate = 900;

export const metadata: Metadata = {
    title: "Lenoir Dining Hall Menu & Hours — Top & Bottom of Lenoir",
    description:
        "Today's Top of Lenoir menu with calories for every dish, plus what's open downstairs at Bottom of Lenoir — Chick-fil-A, Bento Sushi, Mediterranean Deli, The Scoop and more. Updated nightly.",
    keywords: [
        "lenoir dining hall menu",
        "top of lenoir menu",
        "bottom of lenoir",
        "lenoir dining hall hours",
        "lenoir menu unc",
        "unc lenoir dining hall",
        "lenoir hall unc",
    ],
    openGraph: {
        title: "Lenoir Dining Hall Menu & Hours — Top & Bottom of Lenoir",
        description:
            "Today's Top of Lenoir menu with calories for every dish, plus what's open downstairs at Bottom of Lenoir.",
        url: canonical("/lenoir-menu"),
        siteName: "Eat UNC",
        type: "website",
    },
    alternates: { canonical: canonical("/lenoir-menu") },
};

function groupPreview(items: MenuPreviewItem[]) {
    const byPeriod = new Map<string, MenuPreviewItem[]>();
    for (const item of items) {
        byPeriod.set(item.period, [...(byPeriod.get(item.period) ?? []), item]);
    }
    return Array.from(byPeriod.entries()).sort(([a], [b]) => compareMealPeriods(a, b));
}

export default async function LenoirMenuPage() {
    const today = campusToday();

    const [locations, preview, allLocations] = await Promise.all([
        getLocationsBySlug("top-of-lenoir").catch(() => [] as Location[]),
        getMenuPreview("Top of Lenoir", today).catch(() => [] as MenuPreviewItem[]),
        getLocations().catch(() => [] as Location[]),
    ]);

    // "Bottom of Lenoir" is student slang, not a venue UNC lists — it is the ground-floor food
    // court, meaning every Lenoir Hall venue except the hall upstairs. It draws real search
    // volume that neither dining.unc.edu nor anyone else has a page for.
    const bottomOfLenoir = allLocations.filter(
        (l) => l.venue_group === "Lenoir Hall" && l.slug !== "top-of-lenoir",
    );

    let hours: LocationHours[] = [];
    let weekHours: LocationHours[] = [];
    if (locations.length > 0) {
        weekHours = await getHoursForLocations(
            locations.map((l) => l.id),
            today,
            shiftDate(today, 6),
        ).catch(() => []);
        hours = weekHours.filter((h) => h.service_date === today);
    }

    const periods = groupPreview(preview);
    const closesToday = hours.length > 0 ? hours[hours.length - 1].closes_label : null;

    const faqs = [
        {
            question: "What is the difference between Top of Lenoir and Bottom of Lenoir?",
            answer:
                bottomOfLenoir.length > 0
                    ? `Top of Lenoir is the all-you-care-to-eat dining hall upstairs, where one swipe covers the whole meal. Bottom of Lenoir is the food court on the ground floor, where you pay per item: ${bottomOfLenoir
                          .map((l) => l.name)
                          .join(", ")}. UNC's own site lists these as separate venues and never uses the phrase "Bottom of Lenoir", which is why searching for it turns up so little.`
                    : "Top of Lenoir is the all-you-care-to-eat dining hall upstairs in Lenoir Hall. Bottom of Lenoir is the food court on the ground floor, where you pay per item.",
        },
        {
            question: "What time does Top of Lenoir close?",
            answer: closesToday
                ? `Top of Lenoir closes at ${closesToday} today. Its service periods today are ${hours
                      .map((h) => `${h.period_name} ${h.opens_label}–${h.closes_label}`)
                      .join(", ")}.`
                : "Top of Lenoir has no service periods scheduled today. The hall closes over university breaks and between semesters.",
        },
        {
            question: "Is there a Chick-fil-A in Lenoir?",
            answer:
                "Yes — Chick-fil-A is one of the venues on the ground floor of Lenoir Hall, in Bottom of Lenoir. It is a separate operation from the hall upstairs and keeps its own hours.",
        },
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Restaurant",
                "@id": `${canonical("/lenoir-menu")}#restaurant`,
                name: "Top of Lenoir Dining Hall",
                alternateName: ["Top of Lenoir", "Lenoir Dining Hall", "Lenoir Hall"],
                url: canonical("/lenoir-menu"),
                description:
                    "Top of Lenoir is the all-you-care-to-eat dining hall upstairs in Lenoir Hall on UNC Chapel Hill's North Campus.",
                address: {
                    "@type": "PostalAddress",
                    streetAddress: "Lenoir Hall, North Campus",
                    addressLocality: "Chapel Hill",
                    addressRegion: "NC",
                    postalCode: "27599",
                    addressCountry: "US",
                },
                geo: { "@type": "GeoCoordinates", latitude: 35.9101, longitude: -79.0481 },
                servesCuisine: ["American", "International", "Vegetarian", "Vegan"],
                priceRange: "$$",
                acceptsReservations: false,
                parentOrganization: {
                    "@type": "Organization",
                    name: "Carolina Dining Services",
                    alternateName: "CDS",
                    url: "https://dining.unc.edu",
                },
                ...(weekHours.length
                    ? { openingHoursSpecification: toOpeningHoursSpecification(weekHours) }
                    : {}),
            },
            faqPage(faqs),
            breadcrumbList([
                { name: "Eat UNC", path: "/" },
                { name: "Lenoir Dining Hall", path: "/lenoir-menu" },
            ]),
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
            />
            <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 transition-colors"
                    >
                        ← Eat UNC
                    </Link>

                    <div className="flex items-start gap-5 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                            <UtensilsCrossed className="w-8 h-8 text-teal-500" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                                Lenoir Dining Hall Menu
                            </h1>
                            <p className="text-lg text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                UNC Chapel Hill · North Campus
                            </p>
                        </div>
                    </div>

                    <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mb-8 leading-relaxed">
                        Lenoir Hall is really two places. <strong>Top of Lenoir</strong> upstairs is
                        the all-you-care-to-eat dining hall — one swipe, everything included.{" "}
                        <strong>Bottom of Lenoir</strong> downstairs is a food court where you pay
                        per item. This page covers both.
                    </p>

                    <Link
                        href={`/lenoir/${today}`}
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg transition-all shadow-lg shadow-teal-600/25 hover:-translate-y-0.5"
                    >
                        View today&apos;s Top of Lenoir menu
                        <ArrowRight className="w-5 h-5" />
                    </Link>

                    <div className="grid md:grid-cols-2 gap-6 mt-12">
                        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                                    Top of Lenoir hours today
                                </h2>
                            </div>
                            {hours.length > 0 ? (
                                <div className="space-y-3 text-zinc-600 dark:text-zinc-400">
                                    {hours.map((row) => (
                                        <div key={row.id} className="flex justify-between gap-4">
                                            <span>{row.period_name}</span>
                                            <span className="font-medium tabular-nums">
                                                {row.opens_label} – {row.closes_label}
                                            </span>
                                        </div>
                                    ))}
                                    <p className="text-sm text-zinc-500 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                        Venues downstairs keep their own hours —{" "}
                                        <Link href="/hours" className="text-teal-600 dark:text-teal-400 hover:underline">
                                            see all campus hours
                                        </Link>
                                        .
                                    </p>
                                </div>
                            ) : (
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    Nothing is scheduled at Top of Lenoir today.{" "}
                                    <Link href="/open-now" className="text-teal-600 dark:text-teal-400 hover:underline">
                                        See what is open right now
                                    </Link>
                                    .
                                </p>
                            )}
                        </section>

                        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Store className="w-5 h-5 text-purple-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                                    Bottom of Lenoir
                                </h2>
                            </div>
                            {bottomOfLenoir.length > 0 ? (
                                <>
                                    <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                                        The ground-floor food court, paid per item:
                                    </p>
                                    <ul className="space-y-1.5">
                                        {bottomOfLenoir.map((venue) => (
                                            <li key={venue.id}>
                                                <Link
                                                    href={locationPath(venue)}
                                                    className="text-zinc-700 dark:text-zinc-300 hover:text-teal-600 dark:hover:text-teal-400 hover:underline"
                                                >
                                                    {venue.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    Venue listings for the ground floor are unavailable right now.
                                </p>
                            )}
                        </section>
                    </div>

                    {periods.length > 0 && (
                        <section className="mt-12">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                                On the Top of Lenoir menu today
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {periods.map(([period, items]) => (
                                    <div
                                        key={period}
                                        className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                                    >
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                                            {period}
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {items.slice(0, 10).map((i) => i.name).join(" · ")}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20 border border-teal-200/50 dark:border-teal-800/30">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Common questions about Lenoir
                        </h2>
                        <dl className="space-y-5">
                            {faqs.map((faq) => (
                                <div key={faq.question}>
                                    <dt className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {faq.question}
                                    </dt>
                                    <dd className="mt-1 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                        {faq.answer}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <Link href="/chase-menu" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                            Chase Dining Hall menu (South Campus) →
                        </Link>
                        <Link href="/locations" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                            All 42 campus dining locations →
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
