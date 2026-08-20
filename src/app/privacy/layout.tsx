import type { Metadata } from "next";

/**
 * `privacy/page.tsx` is a client component, and a client component cannot export metadata —
 * so the page silently inherited the root layout's site-wide canonical and told Google it was
 * a duplicate of the homepage. That is the whole reason this layout exists.
 */
export const metadata: Metadata = {
    title: "Privacy Policy",
    description:
        "How Eat UNC handles data on eatunc.com: what is collected, what is not, and how to opt out. Eat UNC is an independent project and is not affiliated with UNC Chapel Hill.",
    alternates: {
        canonical: "https://eatunc.com/privacy",
    },
    openGraph: {
        title: "Privacy Policy | Eat UNC",
        description: "How Eat UNC handles data on eatunc.com.",
        url: "https://eatunc.com/privacy",
        siteName: "Eat UNC",
        type: "website",
    },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
