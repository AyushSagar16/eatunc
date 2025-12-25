import { getMealPeriodLabel } from '@/lib/utils'

interface MealPeriodSelectorProps {
    periods: string[]
    selectedPeriod: string
    onPeriodChange: (period: string) => void
}

export default function MealPeriodSelector({ periods, selectedPeriod, onPeriodChange }: MealPeriodSelectorProps) {
    return (
        <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 ml-1">
                Meal Period
            </span>
            <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 w-fit">
                {periods.map((period) => {
                    const isActive = period === selectedPeriod
                    return (
                        <button
                            key={period}
                            onClick={() => onPeriodChange(period)}
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
                            <span className="relative z-10">{getMealPeriodLabel(period)}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
