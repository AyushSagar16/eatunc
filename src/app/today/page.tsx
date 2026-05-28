import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
    title: "UNC Dining Menu Today | What's Cooking at Chapel Hill",
    description: "View today's dining menu at UNC Chapel Hill. Quick access to Chase and Lenoir dining hall menus with real-time updates.",
    keywords: [
        "unc dining today",
        "unc menu today",
        "what's for dinner unc",
        "unc dining hall today",
        "unc chapel hill dining today",
        "unc campus dining"
    ],
    openGraph: {
        title: "UNC Dining Menu Today | What's Cooking at Chapel Hill",
        description: "View today's dining menu at UNC Chapel Hill. Quick access to Chase and Lenoir dining hall menus.",
        url: "https://eatunc.com/today",
        siteName: "UNC Dining Menu",
        type: "website",
    },
    alternates: {
        canonical: "https://eatunc.com/today",
    },
};

const todayDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

const formattedDateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
});

function getTodayDate() {
    const now = new Date();
    return todayDateFormatter.format(now);
}

function getFormattedDate() {
    const now = new Date();
    return formattedDateFormatter.format(now);
}

export default function TodayPage() {
    const today = getTodayDate();
    const formattedDate = getFormattedDate();

    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 flex flex-col items-center justify-center px-4">
            <div className="max-w-xl w-full text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    UNC Dining Today
                </h1>
                <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-2">
                    {formattedDate}
                </p>
                <p className="text-zinc-600 dark:text-zinc-300 mb-12">
                    Choose a dining hall to view today&apos;s menu
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Chase Card */}
                    <Link
                        href={`/chase/${today}`}
                        className="group p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:-translate-y-1"
                    >
                        <div className="size-14 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <svg className="size-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                            Chase
                        </h2>
                        <p className="text-sm text-zinc-500 mb-4">South Campus</p>
                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:gap-2 transition-all">
                            View Menu <ArrowRight className="size-4" />
                        </span>
                    </Link>

                    {/* Lenoir Card */}
                    <Link
                        href={`/lenoir/${today}`}
                        className="group p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700 transition-all hover:-translate-y-1"
                    >
                        <div className="size-14 rounded-xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <svg className="size-7 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                            Top of Lenoir
                        </h2>
                        <p className="text-sm text-zinc-500 mb-4">North Campus</p>
                        <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium text-sm group-hover:gap-2 transition-all">
                            View Menu <ArrowRight className="size-4" />
                        </span>
                    </Link>
                </div>

                <p className="mt-8 text-sm text-zinc-400">
                    Menus are updated daily from UNC Dining Services
                </p>
            </div>
        </main>
    );
}
