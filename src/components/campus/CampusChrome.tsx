import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Crumb } from '@/lib/seo'

/** The site's page background and container, so every campus page frames identically. */
export function CampusPage({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</div>
        </main>
    )
}

/**
 * Visible breadcrumbs. Real `<Link>` elements, never a button with a router push — a crawler
 * follows an anchor and nothing else.
 */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                {crumbs.map((crumb, i) => (
                    <li key={crumb.path} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />}
                        {i === crumbs.length - 1 ? (
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">{crumb.name}</span>
                        ) : (
                            <Link
                                href={crumb.path}
                                className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                            >
                                {crumb.name}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm ${className}`}
        >
            {children}
        </div>
    )
}

export function IconTile({
    children,
    className = 'bg-[#4B9CD3]/10 text-[#2c6f9e] dark:text-[#7cc0ec]',
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${className}`}>{children}</div>
    )
}

export function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
        >
            {children}
        </span>
    )
}

/** A short stat, used in the row under an H1. */
export function Stat({ value, label }: { value: string | number; label: string }) {
    return (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm px-4 py-3">
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</div>
        </div>
    )
}

export function Prose({ children }: { children: React.ReactNode }) {
    return <div className="space-y-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">{children}</div>
}
