'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

interface PostHogProviderProps {
    children: React.ReactNode
}

export function PostHogProvider({ children }: PostHogProviderProps) {
    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[PostHog] API key not found')
            }
            return
        }

        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',

            // Session replay settings
            session_recording: {
                maskAllInputs: true,
                maskTextSelector: '.private',
            },

            // Autocapture settings
            autocapture: {
                dom_event_allowlist: ['click'],
                url_allowlist: ['eatunc.com'],
            },

            // Capture settings
            capture_pageview: true,
            capture_pageleave: true,

            // Persistence
            persistence: 'localStorage',

            // Privacy - start opted out, cookie consent will opt in
            opt_out_capturing_by_default: true,

            loaded: (posthog) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[PostHog] Initialized')
                }
            }
        })
    }, [])

    return <PHProvider client={posthog}>{children}</PHProvider>
}
