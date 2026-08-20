'use client'

import Image from 'next/image'
import { motion } from 'motion/react'

import AppStoreBadge from './AppStoreBadge'
import DitherShader from './ui/dither-shader'
import HallBentoCard from './home/HallBentoCard'
import type { HomeSnapshot } from '@/lib/home'

/**
 * The homepage hero: one screen, everything visible without scrolling.
 *
 * `h-[100dvh]` rather than `min-h-`, so the sitewide footer sits just under the fold and is
 * reached by scrolling while nothing above it ever needs to be. Every size below is responsive
 * down to a 375x667 phone — the screen scales, it does not clip.
 *
 * `children` is the open-now band. It arrives as a slot rather than an import because this file
 * is a client component and `OpenNowRail` is a server one; passing it through keeps the venue
 * list off the client bundle while still rendering it inside this layout.
 */
export default function LandingScreen({
    today,
    halls,
    catchphrase,
    campusStatus,
    children,
}: Pick<HomeSnapshot, 'today' | 'halls'> & {
    catchphrase: string
    /** Live line under the headline — how many places are serving, or what opens next. */
    campusStatus: string
    children: React.ReactNode
}) {
    return (
        <div className="relative flex h-[100dvh] flex-col overflow-hidden" style={{ backgroundColor: '#3a4f5f' }}>
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
                <DitherShader
                    src="/old-well-optimized.jpg"
                    ditherMode="bayer"
                    colorMode="duotone"
                    primaryColor="#13294B" // UNC Navy
                    secondaryColor="#4B9CD3" // UNC Blue
                    threshold={0.7}
                    pixelRatio={1}
                    className="opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-zinc-950/40" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-[clamp(0.75rem,2.8vh,2.25rem)] px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
                <motion.header
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex shrink-0 flex-col"
                >
                    {/*
                        The wordmark centres; everything under it is left-aligned on the same axis
                        as the cards. The mark reads as the site's signature at the top of the
                        screen, and the headline reads as the start of the content.
                    */}
                    <Image
                        src="/eat_unc_wordmark_white.png"
                        alt="Eat UNC"
                        width={837}
                        height={221}
                        priority
                        className="mx-auto h-[clamp(1.75rem,5.5vh,3.25rem)] w-auto drop-shadow-lg"
                    />

                    <h1 className="mt-[clamp(1rem,4vh,2.75rem)] bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-[clamp(1.75rem,min(8vw,9vh),4.5rem)] font-black leading-[1] tracking-tighter text-transparent drop-shadow-2xl [@media(forced-colors:active)]:text-white">
                        {catchphrase}
                    </h1>

                    {/*
                        Replaces the static uppercase eyebrow that used to sit above the headline.
                        It is drawn from the same snapshot the cards below use, so it is true at
                        the minute it renders rather than being a slogan.
                    */}
                    <p className="mt-[clamp(0.375rem,1.4vh,0.75rem)] text-[clamp(0.75rem,1.9vh,1rem)] font-medium text-blue-200/75">
                        {campusStatus}
                    </p>
                </motion.header>

                <motion.section
                    aria-label="Dining halls"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
                    }}
                    className="grid shrink-0 grid-cols-2 gap-[clamp(0.5rem,1.8vh,1.25rem)]"
                >
                    {halls.map((hall) => (
                        <HallBentoCard key={hall.slug} hall={hall} today={today} />
                    ))}
                </motion.section>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    {children}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:justify-between"
                >
                    {/* White lockup: the hero sits on the dark dithered image. */}
                    <AppStoreBadge source="landing" variant="white" />
                    <p className="text-center text-[11px] font-medium text-blue-200/70 sm:text-xs">
                        Menus are updated nightly from UNC Dining Services.
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
