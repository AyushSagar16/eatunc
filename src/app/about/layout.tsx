import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Eat UNC — Built by Ayush Sagar",
    description: "Eat UNC is built by Ayush Sagar, a UNC student. Who made it, where to find him, and how to send feedback.",
    keywords: [
        "about Eat UNC",
        "Ayush Sagar",
        "who made Eat UNC",
        "UNC dining app",
        "UNC meal tracker",
        "Carolina dining",
    ],
    openGraph: {
        title: "About Eat UNC — Built by Ayush Sagar",
        description: "Eat UNC is built by Ayush Sagar, a UNC student.",
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
