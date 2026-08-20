import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";

import { ThemeProvider } from "@/components/ThemeProvider";
import { PostHogProvider } from "@/providers/PostHogProvider";
import CookieConsent from "@/components/CookieConsent";
import { Analytics } from "@vercel/analytics/next";
import CDSBanner from "@/components/CDSBanner";
import AppInstallBanner from "@/components/AppInstallBanner";
import { APP_STORE_ID } from "@/lib/app-store";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
});

// Viewport configuration - separate export as required by Next.js
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // Extend into safe areas on iOS
};

export const metadata: Metadata = {
  metadataBase: new URL('https://eatunc.com'),
  title: {
    default: "UNC Dining Menus Today — Chase, Lenoir & 40 Campus Spots",
    // Page titles carry their own descriptive tail, so the template adds the brand only.
    // It previously appended "| UNC Dining" on top of a suffix each page already had,
    // shipping titles like "Chase Dining Hall Menu Today | UNC Campus Dining | UNC Dining".
    template: "%s | Eat UNC"
  },
  description: "Today's menus, hours and calories for every UNC Chapel Hill dining location — Chase, Top of Lenoir, the Beach Cafe, Bottom of Lenoir and 38 more. Filter by protein, calories, allergens and diet. Updated nightly.",
  keywords: [
    // Primary target keywords
    "unc menu",
    "unc dining menu",
    "chase dining hall menu",
    "lenoir dining hall menu",
    "lenoir",
    "chase",
    "unc dining today",
    "unc campus dining",
    // Secondary keywords
    "UNC dining hall menu",
    "top of lenoir menu",
    "chase menu unc",
    "lenoir menu unc",
    "UNC Chapel Hill dining",
    "unc food menu",
    "Carolina dining halls",
    "UNC nutrition",
    "UNC meal plan"
  ],
  authors: [{ name: "Eat UNC" }],
  creator: "Eat UNC",
  publisher: "Eat UNC",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://eatunc.com',
    siteName: 'Eat UNC',
    title: 'UNC Dining Menus Today — Chase, Lenoir & 40 Campus Spots',
    description: "Today's menus, hours and calories for every UNC Chapel Hill dining location. Filter by protein, calories, allergens and diet.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNC Dining Menus Today — Chase, Lenoir & 40 Campus Spots',
    description: "Today's menus, hours and calories for every UNC Chapel Hill dining location. Filter by protein, calories, allergens and diet.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-for-app/icon1.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-for-app/icon1.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-for-app/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/favicon-for-app/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/favicon-for-app/icon1.png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/favicon-for-app/icon1.png',
      },
    ],
  },
  manifest: '/site.webmanifest',
  // Native Safari-on-iOS "Smart App Banner" for the Eat UNC iOS app.
  itunes: {
    appId: APP_STORE_ID,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <PostHogProvider>
          <ThemeProvider>
            <CDSBanner />
            <AppInstallBanner />
            {children}
            <Footer />
          </ThemeProvider>
          <CookieConsent />
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
