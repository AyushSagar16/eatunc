import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Leaf, MapPin, UtensilsCrossed } from "lucide-react";
import {
    campusToday,
    getHoursForLocations,
    getLocationsBySlug,
    getMenuPreview,
    shiftDate,
    type LocationHours,
    type MenuPreviewItem,
} from "@/lib/campus";
import { breadcrumbList, canonical, faqPage, jsonLd, toOpeningHoursSpecification } from "@/lib/seo";
import { compareMealPeriods } from "@/lib/utils";

// Prerendered without this, the page froze at the build date and pointed its only call to
// action at a six-day-old menu URL.
export const revalidate = 900;

export const metadata: Metadata = {
    title: "Chase Dining Hall Menu & Hours — UNC South Campus",
    description:
        "Today's Chase Dining Hall menu at UNC Chapel Hill with calories and allergens for every item, plus tonight's closing time. Chase is the South Campus hall formerly called Rams Head. Free, updated nightly.",
    keywords: [
        "chase dining hall menu",
        "chase menu unc",
        "chase dining hall hours",
        "unc chase dining",
        "rams head dining hall",
        "chase dining hall unc chapel hill",
        "unc south campus dining",
    ],
    openGraph: {
        title: "Chase Dining Hall Menu & Hours — UNC South Campus",
        description:
            "Today's Chase Dining Hall menu at UNC Chapel Hill with calories and allergens for every item, plus tonight's closing time.",
        url: canonical("/chase-menu"),
        siteName: "Eat UNC",
        type: "website",
    },
    alternates: { canonical: canonical("/chase-menu") },
};

function groupPreview(items: MenuPreviewItem[]) {
    const byPeriod = new Map<string, MenuPreviewItem[]>();
    for (const item of items) {
        byPeriod.set(item.period, [...(byPeriod.get(item.period) ?? []), item]);
    }
    return Array.from(byPeriod.entries()).sort(([a], [b]) => compareMealPeriods(a, b));
}

export default async function ChaseMenuPage() {
    const today = campusToday();

    const [locations, preview] = await Promise.all([
        getLocationsBySlug("chase").catch(() => []),
        getMenuPreview("Chase", today).catch(() => [] as MenuPreviewItem[]),
    ]);

    let hours: LocationHours[] = [];
    let weekHours: LocationHours[] = [];
    if (locations.length > 0) {
        const ids = locations.map((l) => l.id);
        weekHours = await getHoursForLocations(ids, today, shiftDate(today, 6)).catch(() => []);
        hours = weekHours.filter((h) => h.service_date === today);
    }

    const periods = groupPreview(preview);
    const closesToday = hours.length > 0 ? hours[hours.length - 1].closes_label : null;

    const faqs = [
        {
            question: "What time does Chase Dining Hall close?",
            answer: closesToday
                ? `Chase closes at ${closesToday} today. Its service periods today are ${hours
                      .map((h) => `${h.period_name} ${h.opens_label}–${h.closes_label}`)
                      .join(", ")}.`
                : "Chase has no service periods scheduled today. The hall closes over university breaks and between semesters.",
        },
        {
            question: "Is Chase Dining Hall the same as Rams Head?",
            answer:
                "Yes. Rams Head Dining Hall was renamed Chase Dining Hall in 2017. It is the same building in the same place on South Campus, and many students and alumni still call it Rams Head.",
        },
        {
            question: "Does Chase close between lunch and dinner?",
            answer:
                "Chase runs a Late Lunch period on most weekdays, so it generally stays open through the afternoon rather than closing between lunch and dinner. The exact periods change day to day — today's are listed on this page.",
        },
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Restaurant",
                "@id": `${canonical("/chase-menu")}#restaurant`,
                name: "Chase Dining Hall",
                alternateName: ["Chase", "Rams Head Dining Hall"],
                url: canonical("/chase-menu"),
                description:
                    "Chase Dining Hall is the all-you-care-to-eat dining hall on UNC Chapel Hill's South Campus, renamed from Rams Head Dining Hall in 2017.",
                address: {
                    "@type": "PostalAddress",
                    streetAddress: "South Campus",
                    addressLocality: "Chapel Hill",
                    addressRegion: "NC",
                    postalCode: "27599",
                    addressCountry: "US",
                },
                geo: { "@type": "GeoCoordinates", latitude: 35.9049, longitude: -79.0469 },
                servesCuisine: ["American", "International", "Vegetarian", "Vegan"],
                priceRange: "$$",
                acceptsReservations: false,
                parentOrganization: {
                    "@type": "Organization",
                    name: "Carolina Dining Services",
                    alternateName: "CDS",
                    url: "https://dining.unc.edu",
                },
                // Real rows from location_hours. The old markup asserted 07:00–21:00 weekdays,
                // which was a guess and contradicted the hours printed on the same page.
                ...(weekHours.length
                    ? { openingHoursSpecification: toOpeningHoursSpecification(weekHours) }
                    : {}),
            },
            faqPage(faqs),
            breadcrumbList([
                { name: "Eat UNC", path: "/" },
                { name: "Chase Dining Hall", path: "/chase-menu" },
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
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center shrink-0">
                            <UtensilsCrossed className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                                Chase Dining Hall Menu
                            </h1>
                            <p className="text-lg text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                UNC Chapel Hill · South Campus
                            </p>
                        </div>
                    </div>

                    <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mb-8 leading-relaxed">
                        Chase is the all-you-care-to-eat dining hall on South Campus — the one most
                        students living in Hinton James, Ehringhaus, Craige and Morrison walk to.
                        It was called <strong>Rams Head Dining Hall</strong> until 2017, so both
                        names refer to this same building.
                    </p>

                    <Link
                        href={`/chase/${today}`}
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all shadow-lg shadow-blue-600/25 hover:-translate-y-0.5"
                    >
                        View today&apos;s full menu
                        <ArrowRight className="w-5 h-5" />
                    </Link>

                    <div className="grid md:grid-cols-2 gap-6 mt-12">
                        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                                    Chase dining hall hours today
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
                                        Straight from the hours UNC publishes for today. See{" "}
                                        <Link href="/hours" className="text-blue-600 dark:text-blue-400 hover:underline">
                                            every campus location&apos;s hours
                                        </Link>
                                        .
                                    </p>
                                </div>
                            ) : (
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    Nothing is scheduled at Chase today — the hall closes over
                                    university breaks.{" "}
                                    <Link href="/open-now" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        See what is open right now
                                    </Link>
                                    .
                                </p>
                            )}
                        </section>

                        <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <Leaf className="w-5 h-5 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                                    Nutrition and dietary filters
                                </h2>
                            </div>
                            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                                <li>Calories, protein, fat and carbs on every item</li>
                                <li>Allergen labels taken from UNC&apos;s own menu anchors</li>
                                <li>Vegan, vegetarian, halal and gluten-free flags</li>
                                <li>Sort by protein or calories to find what fits your day</li>
                            </ul>
                            <p className="text-sm text-zinc-500 mt-4">
                                Allergen filters dim matching dishes rather than hiding them, so
                                nothing disappears from the menu without you noticing.
                            </p>
                        </section>
                    </div>

                    {periods.length > 0 && (
                        <section className="mt-12">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                                On the Chase menu today
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

                    <section className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Common questions about Chase
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
                        <Link href="/lenoir-menu" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            Top of Lenoir menu (North Campus) →
                        </Link>
                        <Link href="/locations/cafe-1789" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            Cafe 1789, also in Chase Hall →
                        </Link>
                        <Link href="/locations/subway" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            Subway in Chase Hall →
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
