import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Eat UNC | UNC Dining Menu Dashboard",
    description: "Learn about Eat UNC, a premium dining dashboard for UNC Chapel Hill students. View real-time menu updates, nutritional information, and dietary preference filtering.",
    keywords: [
        "about Eat UNC",
        "UNC dining app",
        "UNC meal tracker",
        "Carolina dining",
    ],
    openGraph: {
        title: "About Eat UNC | UNC Dining Menu Dashboard",
        description: "Learn about Eat UNC, a premium dining dashboard for UNC Chapel Hill students.",
        url: "https://eatunc.com/about",
        siteName: "UNC Dining Menu",
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
