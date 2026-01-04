import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";

import { ThemeProvider } from "@/components/ThemeProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

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
  description: "View today's UNC dining hall menus for Chase and Top of Lenoir. Check daily menus, nutrition facts, meal times, and healthy options at University of North Carolina dining halls.",
  keywords: [
    "UNC dining",
    "UNC dining hall menu",
    "UNC dining menu today",
    "Chase dining hall",
    "Lenoir dining hall",
    "Top of Lenoir",
    "UNC Chapel Hill dining",
    "UNC food menu",
    "UNC cafeteria menu",
    "Carolina dining halls",
    "UNC nutrition",
    "UNC meal plan",
    "university dining menu"
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
    description: 'View today\'s UNC dining hall menus for Chase and Top of Lenoir. Check daily menus, nutrition facts, and meal times.',
    images: [
      {
        url: '/eat_unc_text_logo_nw.svg',
        width: 1200,
        height: 630,
        alt: 'UNC Dining Menu - Eat UNC',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNC Dining Menu Today | Chase & Lenoir Dining Halls',
    description: 'View today\'s UNC dining hall menus for Chase and Top of Lenoir. Check daily menus, nutrition facts, and meal times.',
    images: ['/eat_unc_text_logo_nw.svg'],
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
        <ThemeProvider>
          {children}
          <Footer />
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
