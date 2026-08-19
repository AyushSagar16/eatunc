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
    children,
}: Pick<HomeSnapshot, 'today' | 'halls'> & { catchphrase: string; children: React.ReactNode }) {
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

            <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-[clamp(0.5rem,1.8vh,1.25rem)] px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
                <motion.header
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="flex shrink-0 flex-col items-center text-center"
                >
                    {/*
                        The app's own wordmark (`LogoText`), not the site's old `*_text_logo_*`
                        files — despite their filenames those are the bare Old Well mark with no
                        text in them at all, which is why the header used to read as an icon in a
                        pill. Copied from the app's asset catalog and trimmed to its own bounds,
                        because `object-contain` cannot tell transparent padding from ink.
                    */}
                    <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-[clamp(1rem,3vh,2.25rem)] py-[clamp(0.5rem,1.5vh,1rem)] shadow-lg shadow-black/20 backdrop-blur-md">
                        <Image
                            src="/eat_unc_wordmark_white.png"
                            alt="Eat UNC"
                            width={837}
                            height={221}
                            priority
                            className="h-[clamp(1.75rem,6vh,3.5rem)] w-auto"
                        />
                    </div>

                    {/*
                        The keyword line stays inside the h1 and the catchphrase joins it, rather
                        than replacing it. The phrase is drawn fresh on every request, so an h1
                        made only of "Time to eat." would leave the page carrying 60% of the
                        site's impressions with no stable heading at all.
                    */}
                    <h1 className="mt-[clamp(0.5rem,2vh,1.25rem)]">
                        <span className="block text-[clamp(0.6rem,1.6vh,0.875rem)] font-semibold uppercase tracking-[0.25em] text-blue-200/80">
                            UNC Chapel Hill Dining Menus
                        </span>
                        <span className="mt-1 block bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-[clamp(1.5rem,min(7.5vw,8vh),4rem)] font-black leading-[1.05] tracking-tighter text-transparent drop-shadow-2xl [@media(forced-colors:active)]:text-white sm:mt-2">
                            {catchphrase}
                        </span>
                    </h1>
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
