interface DiningHallSelectorProps {
    halls: string[]
    selectedHall: string
    onHallChange: (hall: string) => void
}

export default function DiningHallSelector({ halls, selectedHall, onHallChange }: DiningHallSelectorProps) {
    const getHallLabel = (hall: string) => {
        if (hall === 'Top of Lenoir') return 'Lenoir'
        return hall
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 w-fit">
                {halls.map((hall) => {
                    const isActive = hall === selectedHall
                    return (
                        <button
                            key={hall}
                            onClick={() => onHallChange(hall)}
                            className={`
                                relative px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300
                                ${isActive
                                    ? 'text-zinc-900 dark:text-zinc-50'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }
                            `}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200/50 dark:border-zinc-700/50" />
                            )}
                            <span className="relative z-10">{getHallLabel(hall)}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
