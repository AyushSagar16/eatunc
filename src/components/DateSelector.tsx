'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface DateSelectorProps {
    dates: string[]
    selectedDate: string
}

export default function DateSelector({ dates, selectedDate }: DateSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleDateChange = (date: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('date', date)
        params.delete('period') // Reset to default meal period on date change
        router.push(`/?${params.toString()}`)
    }

    return (
        <div className="flex flex-col gap-4 mb-8">
            <label className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Select Date
            </label>
            <div className="flex flex-wrap gap-2">
                {dates.map((date) => {
                    const isActive = date === selectedDate
                    return (
                        <button
                            key={date}
                            onClick={() => handleDateChange(date)}
                            className={`
                                px-4 py-2 rounded-xl text-sm font-semibold tabular-nums active:scale-[0.96] transition-[transform,color,background-color,box-shadow] duration-150 ease-out
                                ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-white text-zinc-600 shadow-border hover:text-blue-600 hover:shadow-border-hover dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-blue-400'
                                }
                            `}
                        >
                            {new Date(date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                timeZone: 'UTC',
                            })}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
