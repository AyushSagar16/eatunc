import type { Metadata } from "next";
import { Leaf } from "lucide-react";
import { HALL_BY_ROUTE_SLUG } from "@/lib/campus";
import { canonical } from "@/lib/seo";
import HallLanding, { AccentLink, HallCard, loadHallLanding } from "@/components/hall/HallLanding";

// Prerendered without this, the page froze at the build date and pointed its only call to
// action at a six-day-old menu URL.
export const revalidate = 900;

const CHASE = HALL_BY_ROUTE_SLUG.chase;

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
        url: canonical(CHASE.landingPath),
        siteName: "Eat UNC",
        type: "website",
    },
    alternates: { canonical: canonical(CHASE.landingPath) },
};

export default async function ChaseMenuPage() {
    const data = await loadHallLanding(CHASE);
    const { hours } = data;
    const closesToday = hours.length > 0 ? hours[hours.length - 1].closes_label : null;

    const faqs = [
        {
            question: "What time does Chase Dining Hall close?",
            // "No service periods scheduled" is only claimed when the fetch succeeded with
            // zero rows — a failed fetch must not read as a closure.
            answer: closesToday
                ? `Chase closes at ${closesToday} today. Its service periods today are ${hours
                      .map((h) => `${h.period_name} ${h.opens_label}–${h.closes_label}`)
                      .join(", ")}.`
                : data.failed
                  ? "Today's hours could not be loaded just now. Check back in a few minutes, or see UNC's own schedule at dining.unc.edu."
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

    return (
        <HallLanding
            hall={CHASE}
            data={data}
            heading="Chase Dining Hall Menu"
            intro={
                <>
                    Chase is the all-you-care-to-eat dining hall on South Campus — the one most
                    students living in Hinton James, Ehringhaus, Craige and Morrison walk to. It was
                    called <strong>Rams Head Dining Hall</strong> until 2017, so both names refer to
                    this same building.
                </>
            }
            ctaLabel="View today's full menu"
            hoursTitle="Chase dining hall hours today"
            hoursFootnote={
                <>
                    Straight from the hours UNC publishes for today. See{" "}
                    <AccentLink hall={CHASE} href="/hours">
                        every campus location&apos;s hours
                    </AccentLink>
                    .
                </>
            }
            hoursEmpty={
                data.failed ? (
                    <>
                        Today&apos;s hours could not be loaded just now — check back in a few
                        minutes, or{" "}
                        <AccentLink hall={CHASE} href="/hours">
                            see every campus location&apos;s hours
                        </AccentLink>
                        .
                    </>
                ) : (
                    <>
                        Nothing is scheduled at Chase today — the hall closes over university
                        breaks.{" "}
                        <AccentLink hall={CHASE} href="/open-now">
                            See what is open right now
                        </AccentLink>
                        .
                    </>
                )
            }
            secondCard={
                <HallCard
                    icon={
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-green-600" />
                        </div>
                    }
                    title="Nutrition and dietary filters"
                >
                    <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                        <li>Calories, protein, fat and carbs on every item</li>
                        <li>Allergen labels taken from UNC&apos;s own menu anchors</li>
                        <li>Vegan, vegetarian, halal and gluten-free flags</li>
                        <li>Sort by protein or calories to find what fits your day</li>
                    </ul>
                    <p className="text-sm text-zinc-500 mt-4">
                        Allergen filters dim matching dishes rather than hiding them, so nothing
                        disappears from the menu without you noticing.
                    </p>
                </HallCard>
            }
            menuHeading="On the Chase menu today"
            faqHeading="Common questions about Chase"
            faqs={faqs}
            footerLinks={
                <>
                    <AccentLink hall={CHASE} href="/lenoir-menu" bold>
                        Top of Lenoir menu (North Campus) →
                    </AccentLink>
                    <AccentLink hall={CHASE} href="/locations/cafe-1789" bold>
                        Cafe 1789, also in Chase Hall →
                    </AccentLink>
                    <AccentLink hall={CHASE} href="/locations/subway" bold>
                        Subway in Chase Hall →
                    </AccentLink>
                </>
            }
        />
    );
}
