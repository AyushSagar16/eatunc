'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'

import { CAMPUS_TIMEZONE } from '@/lib/campus'
import type { HallStatus } from '@/lib/home'

/**
 * A dining hall card on the homepage.
 *
 * The card is the link, not a button calling `router.push` — the homepage carries 60% of the
 * site's search impressions and used to ship no crawlable href to any menu at all.
 * `motion.create` keeps the stagger variants working through a real `<a>`.
 */
const MotionLink = motion.create(Link)

// Built once rather than per render.
const CLOCK = new Intl.DateTimeFormat('en-US', {
    timeZone: CAMPUS_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
})

/** The app writes "5:00 pm", not "5:00 PM". */
function clock(ms: number) {
    return CLOCK.format(new Date(ms)).replace('AM', 'am').replace('PM', 'pm')
}

/**
 * The app's status vocabulary, from `LandingView.status(for:)`.
 *
 * A hall names the service that is ending — "Late Lunch ends at 5:00 pm" answers the question
 * people actually have there, which is how long *this* menu lasts, not when the building shuts.
 *
 * Two phrasings because these cards sit two-across on a 375px screen, where the long form
 * truncated to "Late Lunch ends at …" and lost the one part of it anybody needs. The short form
 * drops the verb, never the time.
 */
function statusLine(hall: HallStatus): { tiny: string; short: string; long: string; serving: boolean } {
    if (hall.isOpen && hall.closesAt !== null) {
        const at = clock(hall.closesAt)
        return hall.currentPeriod
            ? { tiny: `Til ${at}`, short: `${hall.currentPeriod} · ${at}`, long: `${hall.currentPeriod} ends at ${at}`, serving: true }
            : { tiny: `Til ${at}`, short: `Til ${at}`, long: `Closes at ${at}`, serving: true }
    }
    if (hall.isOpen) return { tiny: 'Open', short: 'Open now', long: 'Open now', serving: true }
    if (hall.opensAt !== null) {
        const at = clock(hall.opensAt)
        return { tiny: `Opens ${at}`, short: `Opens ${at}`, long: `Opens at ${at}`, serving: false }
    }
    const idle = hall.itemCount > 0 ? 'Menu available' : 'Hours vary'
    return { tiny: idle, short: idle, long: idle, serving: false }
}

const ACCENTS = {
    blue: {
        wash: 'from-blue-500/20',
        tile: 'bg-blue-500/20 border-blue-400/20 text-blue-200',
        dot: 'bg-blue-400',
        campus: 'text-blue-200/75',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    },
    teal: {
        wash: 'from-teal-500/20',
        tile: 'bg-teal-500/20 border-teal-400/20 text-teal-200',
        dot: 'bg-teal-400',
        campus: 'text-teal-200/75',
        icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
} as const

export default function HallBentoCard({ hall, today }: { hall: HallStatus; today: string }) {
    const accent = ACCENTS[hall.accent]
    const status = statusLine(hall)
    const reduceMotion = useReducedMotion()

    return (
        <MotionLink
            href={`/${hall.slug}/${today}`}
            aria-label={`${hall.name}, ${hall.campus}, ${status.long}`}
            variants={{
                hidden: { opacity: 0, y: 24, scale: 0.94 },
                visible: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group focus-ring relative flex min-h-[clamp(7rem,19vh,11rem)] min-w-0 flex-col justify-between overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/5 p-[clamp(0.625rem,1.7vh,1.25rem)] text-left backdrop-blur-md sm:rounded-[1.5rem]"
        >
            <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.wash} via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
            />

            <div className="relative z-10 flex items-start justify-between gap-2">
                <span
                    aria-hidden
                    className={`flex size-[clamp(1.75rem,4.2vh,2.75rem)] items-center justify-center rounded-xl border sm:rounded-2xl ${accent.tile}`}
                >
                    <svg className="size-[55%]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={accent.icon} />
                    </svg>
                </span>

                <span
                    aria-hidden
                    className="flex size-[clamp(1.6rem,3.8vh,2.25rem)] items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-300 group-hover:bg-white/20"
                >
                    <svg className="size-1/2 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </span>
            </div>

            <div className="relative z-10 mt-2">
                <h3 className="truncate text-[clamp(0.95rem,min(4.6vw,3.4vh),1.875rem)] font-bold leading-tight tracking-tight text-white">
                    {hall.name}
                </h3>

                <p className={`mt-1 flex items-center gap-1.5 text-[clamp(0.66rem,min(2.9vw,2vh),1rem)] font-medium ${accent.campus}`}>
                    <motion.span
                        aria-hidden
                        animate={reduceMotion ? undefined : { scale: [1, 1.25, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: hall.accent === 'blue' ? 0.5 : 0.7 }}
                        className={`size-1.5 shrink-0 rounded-full ${accent.dot}`}
                    />
                    <span className="truncate">{hall.campus}</span>
                </p>

                {/* Live service, in the app's words. Green carries it but never alone — the two
                    states use different sentences, so colour is not the only signal. */}
                <p
                    className={`mt-0.5 truncate text-[clamp(0.6rem,min(2.7vw,1.9vh),0.875rem)] font-semibold tabular-nums ${
                        status.serving ? 'text-emerald-300' : 'text-white/70'
                    }`}
                >
                    <span className="hidden max-[374px]:inline">{status.tiny}</span>
                    <span className="hidden min-[375px]:inline sm:hidden">{status.short}</span>
                    <span className="hidden sm:inline">{status.long}</span>
                </p>
            </div>
        </MotionLink>
    )
}
