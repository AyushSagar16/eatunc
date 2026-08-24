'use client'

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'
import Joyride, { CallBackProps, STATUS, ACTIONS, Step, Styles } from 'react-joyride'
import { usePostHog } from 'posthog-js/react'
import { isIOSDevice } from '@/lib/platform'
import { useOnboarding } from '@/providers/OnboardingProvider'

// UNC Brand Colors
const UNC_NAVY = '#13294B'
const UNC_BLUE = '#4B9CD3'

// Tutorial storage key
const TUTORIAL_STORAGE_KEY = 'eatunc_tutorial_completed'
const neverChanges = () => () => { }
const readIsClient = () => true

// Desktop Tutorial Steps (6 steps - removed search bar as it was unreliable)
const DESKTOP_STEPS: Step[] = [
    {
        target: '[data-tutorial-target="meal-tabs"]',
        content: 'Select your meal time (auto-selected based on current time)',
        title: 'Meal Periods',
        placement: 'bottom',
        disableBeacon: true,
        spotlightPadding: 8,
    },
    {
        target: '[data-tutorial-target="food-card"]',
        content: 'Click on any food card to view detailed nutritional facts including calories, protein, carbs, fats, and allergen information',
        title: 'View Nutrition Details',
        placement: 'right',
        disableBeacon: true,
        spotlightPadding: 8,
    },
    {
        target: '[data-tutorial-target="filter-button"]',
        content: 'Filter by nutrition goals like High Protein or Low Calorie',
        title: 'Nutrition Filters',
        placement: 'top',
        disableBeacon: true,
        spotlightPadding: 8,
    },
    {
        target: '[data-tutorial-target="sort-dropdown"]',
        content: 'Sort items by calories, protein, or alphabetically',
        title: 'Sorting',
        placement: 'bottom',
        disableBeacon: true,
        spotlightPadding: 8,
    },
    {
        target: '[data-tutorial-target="date-nav"]',
        content: 'View menus for past or future dates',
        title: 'Date Navigation',
        placement: 'bottom',
        disableBeacon: true,
        spotlightPadding: 8,
    },
    {
        // Generic wording: the same tutorial runs on the campus venue pages, where this button
        // reads "All venues" rather than naming the other hall.
        target: '[data-tutorial-target="hall-switcher"]',
        content: 'Jump to the other dining hall, or to every campus venue',
        title: 'Switch Where You Are Eating',
        placement: 'bottom',
        disableBeacon: true,
        spotlightPadding: 8,
    },
]

// Mobile Tutorial Steps (6 steps - no search bar in mobile)
const MOBILE_STEPS: Step[] = [
    {
        target: '[data-tutorial-target="meal-dropdown"]',
        content: 'Select your meal time from the dropdown',
        title: 'Meal Periods',
        placement: 'bottom',
        disableBeacon: true,
        spotlightPadding: 8,
    },
    {
        target: '[data-tutorial-target="food-card"]',
        content: 'Tap on any food card to view detailed nutritional facts including calories, protein, carbs, fats, and allergen information',
        title: 'View Nutrition Details',
        placement: 'bottom',
        disableBeacon: true,
        spotlightPadding: 8,
    },
    {
        target: '[data-tutorial-target="filter-button"]',
        content: 'Filter by nutrition goals',
        title: 'Nutrition Filters',
        placement: 'top',
        disableBeacon: true,
        spotlightPadding: 8,
    },
    {
        target: '[data-tutorial-target="sort-dropdown"]',
        content: 'Sort items by calories, protein, or name',
        title: 'Sorting',
        placement: 'bottom',
        disableBeacon: true,
        spotlightPadding: 8,
    },
    {
        target: '[data-tutorial-target="date-nav"]',
        content: 'View menus for different dates',
        title: 'Date Navigation',
        placement: 'bottom',
        disableBeacon: true,
        spotlightPadding: 8,
    },
    {
        target: '[data-tutorial-target="hall-switcher"]',
        content: 'Jump to the other dining hall, or to every campus venue',
        title: 'Switch Where You Are Eating',
        placement: 'bottom',
        disableBeacon: true,
        spotlightPadding: 8,
    },
]

/**
 * The steps this page can actually show, read off the DOM when the tour opens.
 *
 * Not every menu page mounts every target: a venue whose only service period is `Open` has no
 * meal tabs and no meal dropdown, and a brand venue has no date stepper either. react-joyride
 * cannot find a target that is not there — it warns and parks the tour on a step with nothing
 * under it — so the tour is built from what is on screen rather than from a fixed list.
 */
function stepsOnScreen(): Step[] {
    const base = window.innerWidth < 768 ? MOBILE_STEPS : DESKTOP_STEPS
    return base.filter((step) => typeof step.target === 'string' && document.querySelector(step.target))
}

// Glassmorphic tooltip styles matching Eat UNC aesthetic
const joyrideStyles: Partial<Styles> = {
    options: {
        arrowColor: '#ffffff',
        backgroundColor: '#ffffff',
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        primaryColor: UNC_BLUE,
        textColor: UNC_NAVY,
        zIndex: 10000,
    },
    tooltip: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: 20,
        maxWidth: 320,
    },
    tooltipContainer: {
        textAlign: 'left',
    },
    tooltipTitle: {
        fontSize: 18,
        fontWeight: 800,
        color: UNC_NAVY,
        marginBottom: 8,
    },
    tooltipContent: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 1.6,
    },
    buttonNext: {
        backgroundColor: UNC_BLUE,
        borderRadius: 12,
        color: '#fff',
        fontSize: 14,
        fontWeight: 600,
        padding: '10px 20px',
    },
    buttonBack: {
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        color: '#374151',
        fontSize: 14,
        fontWeight: 600,
        marginRight: 8,
        padding: '10px 20px',
    },
    buttonSkip: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        color: '#6b7280',
        fontSize: 13,
        fontWeight: 500,
        padding: '10px 16px',
    },
    buttonClose: {
        color: '#9ca3af',
        height: 14,
        width: 14,
        padding: 12,
    },
    spotlight: {
        borderRadius: 16,
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
}

/**
 * MenuTutorial - Interactive onboarding tutorial for first-time users
 * 
 * Features:
 * - Auto-starts on first visit (checks localStorage)
 * - Different steps for mobile vs desktop
 * - Glassmorphic styling matching Eat UNC aesthetic
 * - Listens for "restartTutorial" custom event to restart
 * 
 * Testing Notes:
 * - To reset: localStorage.removeItem("eatunc_tutorial_completed")
 * - To trigger manually: window.dispatchEvent(new CustomEvent("restartTutorial"))
 */
export default function MenuTutorial() {
    const posthog = usePostHog()
    const { appPromotionStatus, reportTutorialStatus } = useOnboarding()
    const [run, setRun] = useState(false)
    const [steps, setSteps] = useState<Step[]>([])
    const restartPendingRef = useRef(false)
    const isClient = useSyncExternalStore(neverChanges, readIsClient, () => false)
    const isIOS = useSyncExternalStore(neverChanges, isIOSDevice, () => false)

    // iOS CRASH DEBUG: Disable react-joyride on iOS to test if it's causing crashes.
    // `isIOSDevice` also catches iPadOS, whose user agent identifies itself as Macintosh.
    // This overlay library is known to cause memory issues on iOS Safari
    // TODO: Remove this after confirming the crash cause
    const startTutorial = useCallback(() => {
        restartPendingRef.current = false
        const mounted = stepsOnScreen()
        setSteps(mounted)
        setRun(mounted.length > 0)
        reportTutorialStatus(mounted.length > 0 ? 'running' : 'idle')
    }, [reportTutorialStatus])

    // Register an incomplete automatic tutorial before any of the delayed surfaces can open.
    // Cookie consent uses `waiting` as a blocker too, so it cannot win a one-second timer race.
    useEffect(() => {
        if (!isClient || isIOS) {
            reportTutorialStatus('idle')
            return
        }

        const hasCompletedTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true'
        reportTutorialStatus(hasCompletedTutorial ? 'idle' : 'waiting')

        return () => reportTutorialStatus('idle')
    }, [isClient, isIOS, reportTutorialStatus])

    // The two app CTAs hydrate independently. Wait until both have explicitly resolved and are
    // hidden before arming the tutorial, so Joyride never measures targets while a banner is
    // entering or opens its overlay on top of the app-download prompt.
    useEffect(() => {
        if (!isClient || isIOS || appPromotionStatus !== 'clear') return

        const hasCompletedTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true'

        if (!hasCompletedTutorial || restartPendingRef.current) {
            // Delay start to ensure all elements are rendered
            const timer = setTimeout(startTutorial, 1000)
            return () => clearTimeout(timer)
        }
    }, [appPromotionStatus, isClient, isIOS, startTutorial])

    // Listen for restart event from footer help button
    useEffect(() => {
        const handleRestart = () => {
            if (isIOS) return
            if (appPromotionStatus !== 'clear') {
                restartPendingRef.current = true
                reportTutorialStatus('waiting')
                return
            }
            startTutorial()
        }

        window.addEventListener('restartTutorial', handleRestart)
        return () => window.removeEventListener('restartTutorial', handleRestart)
    }, [appPromotionStatus, isIOS, reportTutorialStatus, startTutorial])

    // Handle Joyride callbacks
    const handleJoyrideCallback = useCallback((data: CallBackProps) => {
        const { status, action, type, index } = data
        const deviceType = window.innerWidth < 768 ? 'mobile' : 'desktop'

        // Track step completion
        if (type === 'step:after') {
            posthog.capture('tutorial_step_completed', {
                step_index: index,
                step_count: steps.length,
                device_type: deviceType,
            })
        }

        // Handle finish, skip, or close
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

        if (finishedStatuses.includes(status)) {
            if (status === STATUS.FINISHED) {
                posthog.capture('tutorial_completed', {
                    device_type: deviceType,
                    total_steps: steps.length,
                })
            } else if (status === STATUS.SKIPPED) {
                posthog.capture('tutorial_skipped', {
                    skipped_at_step: index,
                    device_type: deviceType,
                })
            }
            setRun(false)
            reportTutorialStatus('idle')
            localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
        }

        // Handle close button click
        if (action === ACTIONS.CLOSE) {
            posthog.capture('tutorial_closed', {
                closed_at_step: index,
                device_type: deviceType,
            })
            setRun(false)
            reportTutorialStatus('idle')
            localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
        }
    }, [steps, posthog, reportTutorialStatus])

    // Don't render on server
    if (!isClient || isIOS) return null

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress={false}
            showSkipButton
            scrollToFirstStep
            scrollOffset={100}
            disableOverlayClose={false}
            disableScrolling={false}
            spotlightClicks
            styles={joyrideStyles}
            callback={handleJoyrideCallback}
            locale={{
                back: 'Back',
                close: 'Close',
                last: 'Done',
                next: 'Next',
                skip: 'Skip',
            }}
            floaterProps={{
                styles: {
                    floater: {
                        filter: 'none',
                    },
                },
                disableAnimation: false,
            }}
        />
    )
}
