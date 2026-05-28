import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";

import { ThemeProvider } from "@/components/ThemeProvider";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { MotionProvider } from "@/providers/MotionProvider";
import CookieConsent from "@/components/CookieConsent";
import { Analytics } from "@vercel/analytics/next";
import CDSBanner from "@/components/CDSBanner";

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
    default: "UNC Dining Menu Today | Chase & Lenoir Dining Halls",
    template: "%s | UNC Dining"
  },
  description: "Check UNC dining menus for Chase and Lenoir dining halls. View today's menu, meal times, and nutrition facts at UNC Chapel Hill's dining locations.",
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
    siteName: 'UNC Dining Menu',
    title: 'UNC Dining Menu Today | Chase & Lenoir Dining Halls',
    description: 'Check UNC dining menus for Chase and Lenoir dining halls. View today\'s menu, meal times, and nutrition facts at UNC Chapel Hill.',
    images: [
      {
        url: '/eat_unc_logo_square.png',
        width: 512,
        height: 512,
        alt: 'UNC Dining Menu - Eat UNC',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNC Dining Menu Today | Chase & Lenoir Dining Halls',
    description: 'Check UNC dining menus for Chase and Lenoir dining halls. View today\'s menu, meal times, and nutrition facts at UNC Chapel Hill.',
    images: ['/eat_unc_logo_square.png'],
    creator: '@UNC',
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
  alternates: {
    canonical: 'https://eatunc.com',
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
        <MotionProvider>
          <PostHogProvider>
            <ThemeProvider>
              <CDSBanner />
              {children}
              <Footer />
            </ThemeProvider>
            <CookieConsent />
          </PostHogProvider>
        </MotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
