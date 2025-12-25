'use client'

import { useRouter } from 'next/navigation'

export default function LandingScreen() {
    const router = useRouter()

    const handleSelect = (hall: string) => {
        router.push(`/?hall=${hall}`)
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-blue-500/10 blur-[120px] pointer-events-none -z-10 dark:bg-blue-600/5 transition-opacity" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/5 blur-[100px] pointer-events-none -z-10 transition-opacity" />

            <div className="max-w-5xl w-full flex flex-col gap-12 relative z-10">
                <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                        Where are you <span className="text-blue-600 dark:text-blue-400">dining</span> today?
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                        Select a dining hall to view the current menu, nutritional information, and healthy recommendations.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Chase Dining Hall Card */}
                    <button
                        onClick={() => handleSelect('chase')}
                        className="group relative flex flex-col items-center text-center p-12 rounded-[40px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 animate-in fade-in slide-in-from-left-8 duration-700 delay-200 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Decorative Icon Wrapper */}
                        <div className="w-24 h-24 mb-8 rounded-3xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>

                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-3 tracking-tight">Chase</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">South Campus Dining</p>

                        <div className="mt-8 px-8 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm tracking-wider uppercase group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            Explore Menu
                        </div>
                    </button>

                    {/* Top of Lenoir Card */}
                    <button
                        onClick={() => handleSelect('lenoir')}
                        className="group relative flex flex-col items-center text-center p-12 rounded-[40px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-700 delay-400 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-bl from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Decorative Icon Wrapper */}
                        <div className="w-24 h-24 mb-8 rounded-3xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <svg className="w-12 h-12 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-3 tracking-tight">Top of Lenoir</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">North Campus Dining</p>

                        <div className="mt-8 px-8 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm tracking-wider uppercase group-hover:bg-teal-600 dark:group-hover:bg-teal-400 group-hover:text-white transition-colors">
                            Explore Menu
                        </div>
                    </button>
                </div>

                <p className="text-center text-zinc-400 text-sm font-medium animate-in fade-in duration-1000 delay-700">
                    Menus are dynamically updated from UNC Dining services.
                </p>
            </div>
        </div>
    )
}
