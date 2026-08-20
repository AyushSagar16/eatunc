'use client'

import { Play } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * The only interactive part of /about, split out so the page itself can be a server
 * component. The page is otherwise all prose, and prose that renders on the client is prose
 * Googlebot has to work for.
 */
export default function TryTutorialButton() {
    const router = useRouter()

    const handleTryTutorial = () => {
        localStorage.removeItem('eatunc_tutorial_completed')

        const today = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date())

        router.push(`/lenoir/${today}`)
    }

    return (
        <button
            onClick={handleTryTutorial}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4B9CD3] hover:bg-[#4B9CD3]/90 text-white font-semibold transition-all shadow-md active:scale-95 shrink-0"
        >
            <Play className="w-4 h-4 fill-current" />
            Try it out
        </button>
    )
}
