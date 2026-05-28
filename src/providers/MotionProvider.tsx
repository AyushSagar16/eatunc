'use client'

import { LazyMotion, domMax } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Loads Motion's animation features once via LazyMotion so components can use
 * the lightweight `m` primitives instead of `motion`, trimming the bundle.
 * domMax is required because tabs use layoutId (layout projection).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
    return <LazyMotion features={domMax}>{children}</LazyMotion>
}
