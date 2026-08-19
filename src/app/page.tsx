import type { Metadata } from "next";
import LandingScreen from "@/components/LandingScreen";
import OpenNowRail from "@/components/home/OpenNowRail";
import { redirect } from "next/navigation";
import { getHomeSnapshot } from "@/lib/home";
import { pickCatchphrase } from "@/lib/catchphrase";
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
  const catchphrase = pickCatchphrase();

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
        <LandingScreen today={today} halls={halls} catchphrase={catchphrase}>
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
