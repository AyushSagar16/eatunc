import type { Metadata } from "next";

/** See privacy/layout.tsx — same reason: the page is a client component. */
export const metadata: Metadata = {
    title: "Send Feedback",
    description:
        "Report a wrong menu, a missing dining location or a bug on Eat UNC. Menu data comes from Carolina Dining Services and corrections help everyone using the site.",
    alternates: {
        canonical: "https://eatunc.com/feedback",
    },
    openGraph: {
        title: "Send Feedback | Eat UNC",
        description: "Report a wrong menu, a missing dining location or a bug on Eat UNC.",
        url: "https://eatunc.com/feedback",
        siteName: "Eat UNC",
        type: "website",
    },
    // A contact form has nothing to rank for and was drawing impressions at position 45.
    robots: { index: false, follow: true },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
