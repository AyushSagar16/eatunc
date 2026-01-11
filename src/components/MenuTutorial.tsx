'use client'

import { useState, useEffect, useCallback } from 'react'
import Joyride, { CallBackProps, STATUS, ACTIONS, Step, Styles } from 'react-joyride'

// UNC Brand Colors
const UNC_NAVY = '#13294B'
const UNC_BLUE = '#4B9CD3'

// Tutorial storage key
const TUTORIAL_STORAGE_KEY = 'eatunc_tutorial_completed'

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
        target: '[data-tutorial-target="hall-switcher"]',
        content: 'Switch between Chase and Top of Lenoir',
        title: 'Dining Hall Switcher',
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
        content: 'Switch between dining halls',
        title: 'Dining Hall Switcher',
        placement: 'bottom',
        disableBeacon: true,
        spotlightPadding: 8,
    },
]

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
    const [run, setRun] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isClient, setIsClient] = useState(false)

    // iOS CRASH DEBUG: Disable react-joyride on iOS to test if it's causing crashes
    // This overlay library is known to cause memory issues on iOS Safari
    // TODO: Remove this after confirming the crash cause
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        console.log('[MenuTutorial] Disabled on iOS for crash debugging');
        return null;
    }

    // Detect client-side rendering and viewport size
    useEffect(() => {
        setIsClient(true)

        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Check if tutorial should run on mount
    useEffect(() => {
        if (!isClient) return

        const hasCompletedTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true'

        if (!hasCompletedTutorial) {
            // Delay start to ensure all elements are rendered
            const timer = setTimeout(() => {
                setRun(true)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [isClient])

    // Listen for restart event from footer help button
    useEffect(() => {
        const handleRestart = () => {
            setRun(true)
        }

        window.addEventListener('restartTutorial', handleRestart)
        return () => window.removeEventListener('restartTutorial', handleRestart)
    }, [])

    // Handle Joyride callbacks
    const handleJoyrideCallback = useCallback((data: CallBackProps) => {
        const { status, action } = data

        // Handle finish, skip, or close
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

        if (finishedStatuses.includes(status)) {
            setRun(false)
            localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
        }

        // Handle close button click
        if (action === ACTIONS.CLOSE) {
            setRun(false)
            localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
        }
    }, [])

    // Don't render on server
    if (!isClient) return null

    const steps = isMobile ? MOBILE_STEPS : DESKTOP_STEPS

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


