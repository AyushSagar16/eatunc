import { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight, Clock, MapPin, Utensils, Leaf } from "lucide-react";

export const metadata: Metadata = {
    title: "Lenoir Dining Hall Menu | Top of Lenoir UNC Chapel Hill",
    description: "View today's Top of Lenoir dining hall menu at UNC Chapel Hill. Check breakfast, lunch, and dinner options with nutrition facts at North Campus.",
    keywords: [
        "lenoir dining hall menu",
        "top of lenoir menu",
        "lenoir menu unc",
        "unc lenoir dining",
        "unc north campus dining",
        "top of lenoir unc chapel hill",
        "lenoir menu today",
        "unc dining hall menu"
    ],
    openGraph: {
        title: "Lenoir Dining Hall Menu | Top of Lenoir UNC Chapel Hill",
        description: "View today's Top of Lenoir dining hall menu at UNC Chapel Hill. Check breakfast, lunch, and dinner options with nutrition facts.",
        url: "https://eatunc.com/lenoir-menu",
        siteName: "UNC Dining Menu",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Lenoir Dining Hall Menu | Top of Lenoir UNC Chapel Hill",
        description: "View today's Top of Lenoir dining hall menu at UNC Chapel Hill. Check breakfast, lunch, and dinner options with nutrition facts.",
    },
    alternates: {
        canonical: "https://eatunc.com/lenoir-menu",
    },
};

// Structured data for Lenoir Dining Hall
const structuredData = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "name": "Top of Lenoir",
    "alternateName": ["Lenoir Dining Hall", "Lenoir"],
    "url": "https://eatunc.com/lenoir-menu",
    "description": "Top of Lenoir is the main dining facility on UNC Chapel Hill's North Campus, located in the Student Union serving breakfast, lunch, and dinner.",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "Student Union, North Campus",
        "addressLocality": "Chapel Hill",
        "addressRegion": "NC",
        "postalCode": "27599",
        "addressCountry": "US"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": 35.9101,
        "longitude": -79.0481
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
            "closes": "20:00"
        },
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Saturday", "Sunday"],
            "opens": "10:00",
            "closes": "19:00"
        }
    ]
};

function getTodayDate() {
    const now = new Date();
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);
}

export default function LenoirMenuPage() {
    const today = getTodayDate();

    return (
        <>
            <Script
                id="lenoir-structured-data"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 via-transparent to-teal-400/5 pointer-events-none" />
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 transition-colors"
                        >
                            ← Back to Home
                        </Link>

                        <div className="flex items-start gap-6 mb-8">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                                <Utensils className="w-8 h-8 md:w-10 md:h-10 text-teal-500" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                                    Lenoir Dining Hall Menu
                                </h1>
                                <p className="text-lg text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Top of Lenoir · UNC Chapel Hill · North Campus
                                </p>
                            </div>
                        </div>

                        <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mb-8 leading-relaxed">
                            Top of Lenoir is UNC Chapel Hill&apos;s central North Campus dining hall, located in the Student Union.
                            View today&apos;s breakfast, lunch, and dinner menu with full nutrition information,
                            dietary preferences, and allergen details.
                        </p>

                        <Link
                            href={`/lenoir/${today}`}
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg transition-all shadow-lg shadow-teal-600/25 hover:shadow-xl hover:shadow-teal-600/30 hover:-translate-y-0.5"
                        >
                            View Today&apos;s Menu
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Info Sections */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Meal Times */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                                    Top of Lenoir Hours
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
                                    <span>Lite Lunch</span>
                                    <span className="font-medium">2:00 PM - 4:30 PM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Dinner</span>
                                    <span className="font-medium">4:30 PM - 8:00 PM</span>
                                </div>
                                <p className="text-sm text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                    Weekend hours may vary. Check the menu for current availability.
                                </p>
                            </div>
                        </div>

                        {/* Dietary Options */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <Leaf className="w-5 h-5 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                                    Dietary Options
                                </h2>
                            </div>
                            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Vegetarian and vegan options daily
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Allergen information available
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Nutrition facts for every item
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    High protein and low calorie filters
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20 border border-teal-200/50 dark:border-teal-800/30">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            About Top of Lenoir
                        </h2>
                        <div className="prose prose-zinc dark:prose-invert max-w-none">
                            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                Top of Lenoir, located on the top floor of the Student Union, is the main dining destination
                                for UNC&apos;s North Campus. The dining hall offers a wide variety of food stations including
                                home-style cooking, international flavors, fresh-made pizza, a deli, and an extensive salad bar.
                                Conveniently located near the Pit and central campus classrooms, Lenoir is popular for
                                quick meals between classes or relaxed dining with friends.
                            </p>
                        </div>
                    </div>

                    {/* Cross-link to Chase */}
                    <div className="mt-8 text-center">
                        <p className="text-zinc-500 mb-2">Looking for South Campus dining?</p>
                        <Link
                            href="/chase-menu"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                        >
                            View Chase Dining Hall Menu
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
