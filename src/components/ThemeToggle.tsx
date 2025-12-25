'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="p-2 w-10 h-10" /> // Placeholder to prevent layout shift
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 transition-all hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            aria-label="Toggle Theme"
        >
            <div className="relative h-5 w-5">
                <Sun
                    className={`absolute inset-0 h-5 w-5 transition-all duration-300 transform 
                        ${theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'} 
                        text-amber-500`}
                />
                <Moon
                    className={`absolute inset-0 h-5 w-5 transition-all duration-300 transform 
                        ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'} 
                        text-blue-400`}
                />
            </div>

            <div className="absolute inset-0 rounded-xl border border-zinc-200 opacity-50 group-hover:opacity-100 dark:border-zinc-700 transition-opacity" />
        </button>
    )
}
