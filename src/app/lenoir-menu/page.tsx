import type { Metadata } from "next";
import Link from "next/link";
import { Store } from "lucide-react";
import { getLocations, isBottomOfLenoir, locationPath, HALL_BY_ROUTE_SLUG } from "@/lib/campus";
import { canonical } from "@/lib/seo";
import HallLanding, { AccentLink, HallCard, loadHallLanding } from "@/components/hall/HallLanding";

export const revalidate = 900;

const LENOIR = HALL_BY_ROUTE_SLUG.lenoir;

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
        url: canonical(LENOIR.landingPath),
        siteName: "Eat UNC",
        type: "website",
    },
    alternates: { canonical: canonical(LENOIR.landingPath) },
};

export default async function LenoirMenuPage() {
    // getLocations failure degrades to an empty list: the Bottom of Lenoir card already has
    // an honest "listings are unavailable right now" branch, and a throw here would fail the
    // build-time prerender the same way loadHallLanding's would.
    const [data, allLocations] = await Promise.all([
        loadHallLanding(LENOIR),
        getLocations().catch((error) => {
            console.error("[/lenoir-menu] getLocations unavailable:", error);
            return [];
        }),
    ]);
    const { hours } = data;
    const closesToday = hours.length > 0 ? hours[hours.length - 1].closes_label : null;

    // "Bottom of Lenoir" is student slang, not a venue UNC lists — it is the ground-floor food
    // court, meaning every Lenoir Hall venue except the hall upstairs. It draws real search
    // volume that neither dining.unc.edu nor anyone else has a page for.
    const bottomOfLenoir = allLocations.filter(isBottomOfLenoir);

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
            // "No service periods scheduled" is only claimed when the fetch succeeded with
            // zero rows — a failed fetch must not read as a closure.
            answer: closesToday
                ? `Top of Lenoir closes at ${closesToday} today. Its service periods today are ${hours
                      .map((h) => `${h.period_name} ${h.opens_label}–${h.closes_label}`)
                      .join(", ")}.`
                : data.failed
                  ? "Today's hours could not be loaded just now. Check back in a few minutes, or see UNC's own schedule at dining.unc.edu."
                  : "Top of Lenoir has no service periods scheduled today. The hall closes over university breaks and between semesters.",
        },
        {
            question: "Is there a Chick-fil-A in Lenoir?",
            answer:
                "Yes — Chick-fil-A is one of the venues on the ground floor of Lenoir Hall, in Bottom of Lenoir. It is a separate operation from the hall upstairs and keeps its own hours.",
        },
    ];

    return (
        <HallLanding
            hall={LENOIR}
            data={data}
            heading="Lenoir Dining Hall Menu"
            intro={
                <>
                    Lenoir Hall is really two places. <strong>Top of Lenoir</strong> upstairs is the
                    all-you-care-to-eat dining hall — one swipe, everything included.{" "}
                    <strong>Bottom of Lenoir</strong> downstairs is a food court where you pay per
                    item. This page covers both.
                </>
            }
            ctaLabel="View today's Top of Lenoir menu"
            hoursTitle="Top of Lenoir hours today"
            hoursFootnote={
                <>
                    Venues downstairs keep their own hours —{" "}
                    <AccentLink hall={LENOIR} href="/hours">
                        see all campus hours
                    </AccentLink>
                    .
                </>
            }
            hoursEmpty={
                data.failed ? (
                    <>
                        Today&apos;s hours could not be loaded just now — check back in a few
                        minutes, or{" "}
                        <AccentLink hall={LENOIR} href="/hours">
                            see every campus location&apos;s hours
                        </AccentLink>
                        .
                    </>
                ) : (
                    <>
                        Nothing is scheduled at Top of Lenoir today.{" "}
                        <AccentLink hall={LENOIR} href="/open-now">
                            See what is open right now
                        </AccentLink>
                        .
                    </>
                )
            }
            secondCard={
                <HallCard
                    icon={
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Store className="w-5 h-5 text-purple-600" />
                        </div>
                    }
                    title="Bottom of Lenoir"
                >
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
                </HallCard>
            }
            menuHeading="On the Top of Lenoir menu today"
            faqHeading="Common questions about Lenoir"
            faqs={faqs}
            footerLinks={
                <>
                    <AccentLink hall={LENOIR} href="/chase-menu" bold>
                        Chase Dining Hall menu (South Campus) →
                    </AccentLink>
                    <AccentLink hall={LENOIR} href="/locations" bold>
                        All 42 campus dining locations →
                    </AccentLink>
                </>
            }
        />
    );
}
