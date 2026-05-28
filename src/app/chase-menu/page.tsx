import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { toJsonLd } from "@/lib/utils";
import { ArrowRight, Clock, MapPin, Utensils, Leaf } from "lucide-react";

export const metadata: Metadata = {
    title: "Chase Dining Hall Menu Today | UNC South Campus",
    description: "View today's Chase Dining Hall menu at UNC Chapel Hill. Check breakfast, lunch, and dinner options with nutrition facts at South Campus's main dining location.",
    keywords: [
        "chase dining hall menu",
        "chase menu unc",
        "unc chase dining",
        "unc south campus dining",
        "chase dining hall unc chapel hill",
        "chase menu today",
        "unc dining hall menu"
    ],
    openGraph: {
        title: "Chase Dining Hall Menu Today | UNC South Campus",
        description: "View today's Chase Dining Hall menu at UNC Chapel Hill. Check breakfast, lunch, and dinner options with nutrition facts.",
        url: "https://eatunc.com/chase-menu",
        siteName: "UNC Dining Menu",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Chase Dining Hall Menu Today | UNC South Campus",
        description: "View today's Chase Dining Hall menu at UNC Chapel Hill. Check breakfast, lunch, and dinner options with nutrition facts.",
    },
    alternates: {
        canonical: "https://eatunc.com/chase-menu",
    },
};

// Structured data for Chase Dining Hall
const structuredData = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "name": "Chase Dining Hall",
    "alternateName": "Chase",
    "url": "https://eatunc.com/chase-menu",
    "description": "Chase Dining Hall is the main dining facility on UNC Chapel Hill's South Campus, serving breakfast, lunch, and dinner with a variety of food stations.",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "South Campus",
        "addressLocality": "Chapel Hill",
        "addressRegion": "NC",
        "postalCode": "27599",
        "addressCountry": "US"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": 35.9049,
        "longitude": -79.0469
    },
    "servesCuisine": ["American", "International", "Vegetarian", "Vegan"],
    "priceRange": "$$",
    "acceptsReservations": false,
    "parentOrganization": {
        "@type": "Organization",
        "name": "UNC Chapel Hill Dining Services",
        "url": "https://dining.unc.edu"
    },
    "openingHoursSpecification": [
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "07:00",
            "closes": "21:00"
        },
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Saturday", "Sunday"],
            "opens": "10:00",
            "closes": "20:00"
        }
    ]
};

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

function getTodayDate() {
    const now = new Date();
    return dateFormatter.format(now);
}

export default function ChaseMenuPage() {
    const today = getTodayDate();

    return (
        <>
            <script
                id="chase-structured-data"
                type="application/ld+json"
            >{toJsonLd(structuredData)}</script>
            <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-blue-400/5 pointer-events-none" />
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 transition-colors"
                        >
                            ← Back to Home
                        </Link>

                        <div className="flex items-start gap-6 mb-8">
                            <div className="size-16 md:w-20 md:h-20 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center shrink-0">
                                <Utensils className="size-8 md:w-10 md:h-10 text-blue-500" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                                    Chase Dining Hall Menu
                                </h1>
                                <p className="text-lg text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                    <MapPin className="size-4" />
                                    UNC Chapel Hill · South Campus
                                </p>
                            </div>
                        </div>

                        <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mb-8 leading-relaxed">
                            Chase Dining Hall is UNC Chapel Hill&apos;s premier South Campus dining destination.
                            Explore today&apos;s breakfast, lunch, and dinner menu with complete nutrition information,
                            dietary filters, and allergen details.
                        </p>

                        <Link
                            href={`/chase/${today}`}
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
                        >
                            View Today&apos;s Menu
                            <ArrowRight className="size-5" />
                        </Link>
                    </div>
                </div>

                {/* Info Sections */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Meal Times */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Clock className="size-5 text-amber-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                                    Chase Dining Hall Hours
                                </h2>
                            </div>
                            <div className="space-y-3 text-zinc-600 dark:text-zinc-400">
                                <div className="flex justify-between">
                                    <span>Breakfast</span>
                                    <span className="font-medium">7:00 AM - 10:30 AM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Lunch</span>
                                    <span className="font-medium">11:00 AM - 2:00 PM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Dinner</span>
                                    <span className="font-medium">4:30 PM - 9:00 PM</span>
                                </div>
                                <p className="text-sm text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                    Weekend hours may vary. Check the menu for current availability.
                                </p>
                            </div>
                        </div>

                        {/* Dietary Options */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <Leaf className="size-5 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                                    Dietary Options
                                </h2>
                            </div>
                            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                                <li className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-green-500"></span>
                                    Vegetarian and vegan options daily
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-blue-500"></span>
                                    Allergen information available
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-amber-500"></span>
                                    Nutrition facts for every item
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-purple-500"></span>
                                    High protein and low calorie filters
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            About Chase Dining Hall
                        </h2>
                        <div className="prose prose-zinc dark:prose-invert max-w-none">
                            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                Located in the heart of South Campus, Chase Dining Hall serves thousands of UNC students daily.
                                The dining hall features multiple food stations including grill, deli, pizza, international cuisine,
                                and a fresh salad bar. Whether you&apos;re looking for a quick breakfast between classes or a
                                hearty dinner, Chase offers diverse menu options to fit your dietary needs and preferences.
                            </p>
                        </div>
                    </div>

                    {/* Cross-link to Lenoir */}
                    <div className="mt-8 text-center">
                        <p className="text-zinc-500 mb-2">Looking for North Campus dining?</p>
                        <Link
                            href="/lenoir-menu"
                            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium transition-colors"
                        >
                            View Lenoir Dining Hall Menu
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
