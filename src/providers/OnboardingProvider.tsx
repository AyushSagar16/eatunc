'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { stampVisit } from '@/lib/app-download-prompt'

type AppPromotionSurface = 'install-banner' | 'download-prompt'
type SurfaceVisibility = 'pending' | 'visible' | 'hidden'
type AppPromotionStatus = 'pending' | 'visible' | 'clear'
type TutorialStatus = 'idle' | 'waiting' | 'running'

interface OnboardingContextValue {
    appPromotionStatus: AppPromotionStatus
    reportAppPromotionVisibility: (
        surface: AppPromotionSurface,
        visibility: Exclude<SurfaceVisibility, 'pending'>
    ) => void
    tutorialStatus: TutorialStatus
    reportTutorialStatus: (status: TutorialStatus) => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

/**
 * Coordinates first-visit surfaces that mount in different parts of the app tree.
 *
 * Both app-promotion components begin as `pending`, so the menu tutorial cannot start during
 * hydration before either promotion has decided whether it is visible. Once both have reported
 * `hidden`, the tutorial is free to run. This turns three independent effects into one ordered
 * sequence without coupling the app prompt, banner, tutorial, or cookie consent to each other's
 * storage keys.
 */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [surfaces, setSurfaces] = useState<Record<AppPromotionSurface, SurfaceVisibility>>({
        'install-banner': 'pending',
        'download-prompt': 'pending',
    })
    const [tutorialStatus, setTutorialStatus] = useState<TutorialStatus>('idle')

    // The one known point where this visit gets recorded, above every surface that reads the
    // answer. A state initialiser rather than an effect because the readers below take their
    // snapshot during render, before any effect has run; a `let` guard inside `stampVisit`
    // makes the double invocation of Strict Mode harmless.
    useState(() => {
        if (typeof window !== 'undefined') stampVisit()
    })

    const reportAppPromotionVisibility = useCallback(
        (surface: AppPromotionSurface, visibility: Exclude<SurfaceVisibility, 'pending'>) => {
            setSurfaces((current) =>
                current[surface] === visibility ? current : { ...current, [surface]: visibility }
            )
        },
        []
    )

    const appPromotionStatus: AppPromotionStatus = Object.values(surfaces).some(
        (visibility) => visibility === 'pending'
    )
        ? 'pending'
        : Object.values(surfaces).some((visibility) => visibility === 'visible')
          ? 'visible'
          : 'clear'

    const value = useMemo(
        () => ({
            appPromotionStatus,
            reportAppPromotionVisibility,
            tutorialStatus,
            reportTutorialStatus: setTutorialStatus,
        }),
        [appPromotionStatus, reportAppPromotionVisibility, tutorialStatus]
    )

    return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
    const context = useContext(OnboardingContext)
    if (!context) throw new Error('useOnboarding must be used within OnboardingProvider')
    return context
}
