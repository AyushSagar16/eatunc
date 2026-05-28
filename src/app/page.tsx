
import type { Metadata } from "next";
import LandingScreen from "@/components/LandingScreen";
import { redirect } from "next/navigation";
import { toJsonLd } from "@/lib/utils";

// Dynamic rendering - no caching
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    absolute: 'UNC Dining Menu Today | Chase & Lenoir Dining Halls',
  },
  description: "Check today's UNC dining menus for Chase and Top of Lenoir — meal times, nutrition facts, and healthy picks at UNC Chapel Hill.",
  alternates: { canonical: 'https://eatunc.com' },
};

interface PageProps {
  searchParams: Promise<{ date?: string, hall?: string }>;
}

// Homepage structured data for organization/website
const homepageStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Eat UNC - UNC Dining Menu",
  "alternateName": "Eat UNC",
  "url": "https://eatunc.com",
  "description": "View daily menus for UNC Chapel Hill dining halls including Chase and Top of Lenoir. Check nutrition facts, meal times, and healthy options.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://eatunc.com/{hall}/{date}"
    },
    "query-input": "required name=hall required name=date"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Eat UNC",
    "url": "https://eatunc.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://eatunc.com/eat_unc_logo_square.png"
    }
  }
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

  return (
    <>
      <script
        id="homepage-structured-data"
        type="application/ld+json"
      >{toJsonLd(homepageStructuredData)}</script>
      <main className="min-h-screen-ios-safe bg-transparent overflow-hidden">
        <LandingScreen />
      </main>
    </>
  );
}
