import type { Metadata } from "next";
import LandingScreen from "@/components/LandingScreen";
import OpenNowRail from "@/components/home/OpenNowRail";
import { redirect } from "next/navigation";
import { getHomeSnapshot, type HomeSnapshot } from "@/lib/home";
import { pickCatchphrase } from "@/lib/catchphrase";
import { CAMPUS_TIMEZONE } from "@/lib/campus";
import { canonical, jsonLd } from "@/lib/seo";

// Dynamic rendering - no caching
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ date?: string, hall?: string }>;
}

// The root layout used to declare a site-wide canonical, which every page inheriting it
// reported as a duplicate of the homepage. Removing it left the homepage itself without one,
// so it is declared here where it is actually true.
export const metadata: Metadata = {
  alternates: { canonical: canonical("/") },
};

/**
 * Organization and WebSite markup for the domain.
 *
 * The previous version declared a `SearchAction` whose `query-input` named `hall` and `date`
 * and whose target was `/{hall}/{date}`. Google's sitelinks searchbox requires a single
 * `search_term_string` pointing at a real search results page, and this site has none — so the
 * markup was invalid rather than merely unused, and it is gone.
 */
const homepageStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${canonical("/")}#organization`,
      name: "Eat UNC",
      url: canonical("/"),
      logo: {
        "@type": "ImageObject",
        url: `${canonical("/")}/eat_unc_logo_square.png`,
      },
      description:
        "An independent, student-built guide to dining at UNC Chapel Hill. Not affiliated with the University of North Carolina at Chapel Hill or Carolina Dining Services.",
    },
    {
      "@type": "WebSite",
      "@id": `${canonical("/")}#website`,
      name: "Eat UNC",
      alternateName: ["Eat UNC", "UNC Dining Menu"],
      url: canonical("/"),
      publisher: { "@id": `${canonical("/")}#organization` },
      description:
        "Daily menus, hours and nutrition for every UNC Chapel Hill dining location, including Chase, Top of Lenoir, the Beach Cafe and Bottom of Lenoir.",
    },
  ],
};

/**
 * The live line under the headline — how many places are serving, or what opens next.
 *
 * This is where the "UNC Chapel Hill Dining Menus" eyebrow used to sit. That line was static and
 * shouty; this one says something only this page at this minute can say, and still puts the
 * words "campus" and "dining" in the markup.
 */
const CLOCK = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPUS_TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
});

function clock(ms: number) {
  return CLOCK.format(new Date(ms)).replace("AM", "am").replace("PM", "pm");
}

function describeCampus({
  halls,
  openVenues,
  nextVenues,
}: Pick<HomeSnapshot, "halls" | "openVenues" | "nextVenues">): string {
  const openHalls = halls.filter((hall) => hall.isOpen);
  const total = openHalls.length + openVenues.length;

  if (total > 0) {
    const places = `${total} place${total === 1 ? "" : "s"} serving on campus right now`;
    // Name the soonest close, because "open" without "until when" is the half of the answer
    // nobody needed.
    const soonest = [
      ...openHalls.map((hall) => ({ name: hall.name, at: hall.closesAt })),
      ...openVenues.map((venue) => ({ name: venue.name, at: venue.closesAt })),
    ]
      .filter((entry): entry is { name: string; at: number } => entry.at !== null)
      .sort((a, b) => a.at - b.at)[0];

    return soonest ? `${places} · ${soonest.name} closes at ${clock(soonest.at)}` : places;
  }

  const next = nextVenues[0];
  const nextHall = halls
    .filter((hall) => hall.opensAt !== null)
    .sort((a, b) => (a.opensAt ?? 0) - (b.opensAt ?? 0))[0];

  const soonestNext = [
    ...(next ? [{ name: next.name, at: next.opensAt }] : []),
    ...(nextHall?.opensAt != null ? [{ name: nextHall.name, at: nextHall.opensAt }] : []),
  ].sort((a, b) => a.at - b.at)[0];

  return soonestNext
    ? `Nothing is serving on campus · ${soonestNext.name} opens at ${clock(soonestNext.at)}`
    : "Nothing is serving on campus right now";
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const hallSlug = params.hall;
  const selectedDate = params.date;

  // Legacy Redirect Logic
  if (hallSlug) {
    if (selectedDate) {
      redirect(`/${hallSlug}/${selectedDate}`);
    } else {
      redirect(`/${hallSlug}`);
    }
  }

  const { today, halls, openVenues, nextVenues, totalLocations } =
    await getHomeSnapshot();

  // Drawn per request rather than in the browser, so the largest text on the page does not
  // flash or shift after hydration. See the note in `pickCatchphrase`.
  const anythingOpen =
    openVenues.length > 0 || halls.some((hall) => hall.isOpen);
  const catchphrase = pickCatchphrase({ anythingOpen });
  const campusStatus = describeCampus({ halls, openVenues, nextVenues });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(homepageStructuredData) }}
      />
      <main>
        {/*
          `OpenNowRail` is passed as a child rather than imported by `LandingScreen`, which is a
          client component. That keeps the venue list a server component: its names and closing
          times are the crawlable menu-adjacent text on a page that no longer scrolls.
        */}
        <LandingScreen
          today={today}
          halls={halls}
          catchphrase={catchphrase}
          campusStatus={campusStatus}
        >
          <OpenNowRail
            openVenues={openVenues}
            nextVenues={nextVenues}
            totalLocations={totalLocations}
          />
        </LandingScreen>
      </main>
    </>
  );
}
