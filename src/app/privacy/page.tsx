'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function PrivacyPage() {
    const [cleared, setCleared] = useState(false)

    const handleClearData = () => {
        // Clear all Eat UNC localStorage data
        const keysToRemove = [
            'cookie_consent',
            'eatunc_active_filters',
            'eatunc_dietary_prefs',
            'eatunc_allergens',
            'eatunc_tutorial_completed',
            'theme',
        ]

        keysToRemove.forEach(key => {
            localStorage.removeItem(key)
        })

        // Also clear any collapsed station states
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('collapsed_')) {
                localStorage.removeItem(key)
            }
        })

        setCleared(true)
        setTimeout(() => setCleared(false), 3000)
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
            <div className="container mx-auto px-6 py-12 max-w-3xl">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 mb-8"
                >
                    ← Back to Home
                </Link>

                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
                    Privacy Policy
                </h1>

                <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                        Last updated: January 11, 2026
                    </p>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Overview
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Eat UNC is committed to protecting your privacy. This policy explains how we collect,
                            use, and safeguard information when you use our website to view UNC dining hall menus.
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-400 mt-4">
                            Looking for the iOS app? It collects nothing at all — no analytics, no tracking —
                            so it has its own{' '}
                            <Link href="/privacy/ios" className="underline hover:text-zinc-900 dark:hover:text-zinc-200">
                                app privacy policy
                            </Link>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Information We Collect
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            We use analytics to understand how students use Eat UNC and improve the experience.
                            This includes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400">
                            <li><strong>Usage data:</strong> Pages visited, features used (filters, search, meal periods)</li>
                            <li><strong>Device info:</strong> Browser type, screen size, operating system</li>
                            <li><strong>Session recordings:</strong> Anonymous recordings of how users interact with the site to identify bugs and improve UX</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            What We Don&apos;t Collect
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-600 dark:text-zinc-400">
                            <li>Personal information (name, email, student ID)</li>
                            <li>Location data</li>
                            <li>Login credentials</li>
                            <li>Payment information</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Cookies &amp; Local Storage
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Eat UNC uses cookies and localStorage to remember your preferences (like filter settings
                            and theme) and to collect anonymous analytics data. This data is stored in your browser
                            and is never shared with third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Analytics Provider
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            We use <a href="https://posthog.com" className="underline hover:text-zinc-900 dark:hover:text-zinc-200" target="_blank" rel="noopener noreferrer">PostHog</a> for
                            analytics and session recordings. PostHog is privacy-focused and allows us to understand
                            user behavior without collecting personal information. All input fields in session
                            recordings are automatically masked for privacy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Your Choices
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            You can clear all locally stored data (preferences, filters, consent) at any time
                            using the button below. This will reset all your settings.
                        </p>
                        <button
                            onClick={handleClearData}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${cleared
                                    ? 'bg-green-500 text-white'
                                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                                }`}
                        >
                            {cleared ? '✓ Data Cleared' : 'Clear All Local Data'}
                        </button>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Data Retention
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Analytics data is retained for 90 days and then automatically deleted. Session
                            recordings are retained for 30 days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                            Contact
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            If you have questions about this privacy policy, please contact us through our{' '}
                            <Link href="/feedback" className="underline hover:text-zinc-900 dark:hover:text-zinc-200">
                                feedback page
                            </Link>.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    )
}
