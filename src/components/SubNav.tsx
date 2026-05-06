'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, CalendarDays, LineChart, UserCircle } from 'lucide-react'

interface NavItem {
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
}

const ITEMS: NavItem[] = [
    { href: '/log', label: 'Today', icon: ClipboardList },
    { href: '/history', label: 'History', icon: CalendarDays },
    { href: '/trends', label: 'Trends', icon: LineChart },
    { href: '/profile', label: 'You', icon: UserCircle },
]

export default function SubNav() {
    const pathname = usePathname()
    return (
        <nav className="flex items-center justify-center gap-1 rounded-full border border-ink-200 bg-white p-1 shadow-sm dark:border-ink-800 dark:bg-ink-900">
            {ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                            active
                                ? 'bg-navy-900 text-white shadow-sm dark:bg-carolina-500 dark:text-navy-900'
                                : 'text-ink-600 hover:text-navy-900 dark:text-ink-300 dark:hover:text-ink-50'
                        }`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </Link>
                )
            })}
        </nav>
    )
}
