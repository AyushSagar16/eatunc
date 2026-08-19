import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Eat UNC — Who Makes It & Where the Data Comes From",
    description: "Eat UNC is an independent, student-built guide to UNC Chapel Hill dining — not run by the University or Carolina Dining Services. How the menus, hours and nutrition are sourced, and how estimates are labelled.",
    keywords: [
        "about Eat UNC",
        "UNC dining app",
        "UNC meal tracker",
        "Carolina dining",
    ],
    openGraph: {
        title: "About Eat UNC — Who Makes It & Where the Data Comes From",
        description: "Learn about Eat UNC, a premium dining dashboard for UNC Chapel Hill students.",
        url: "https://eatunc.com/about",
        siteName: "Eat UNC",
        type: "website",
    },
    alternates: {
        canonical: "https://eatunc.com/about",
    },
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
