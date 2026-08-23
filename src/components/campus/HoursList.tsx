import type { LocationHours } from '@/lib/campus'
import { formatHoursRange, periodLabel } from './campusDisplay'

/**
 * One location's service periods for one day.
 *
 * Both the period name and the times are printed verbatim from the row UNC published — the
 * only transformation anywhere in this file is upper-casing `am`/`pm`. A dining site that
 * guesses a closing time is worse than one that says it does not know.
 */
export function PeriodRows({
    rows,
    empty = 'No hours published for this day.',
}: {
    rows: LocationHours[]
    empty?: string
}) {
    if (rows.length === 0) {
        return <p className="text-sm text-zinc-500 dark:text-zinc-400">{empty}</p>
    }

    return (
        <dl className="space-y-1.5">
            {rows.map((row) => (
                <div key={row.id} className="flex items-baseline justify-between gap-4 text-sm">
                    <dt className="text-zinc-600 dark:text-zinc-400">{periodLabel(row.period_name)}</dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-100 tabular-nums whitespace-nowrap">
                        {formatHoursRange(row)}
                    </dd>
                </div>
            ))}
        </dl>
    )
}

/** The same rows rendered inline, for dense lists like `/hours`. */
export function PeriodSummary({ rows, empty = 'Closed' }: { rows: LocationHours[]; empty?: string }) {
    if (rows.length === 0) {
        return <span className="text-sm text-zinc-400 dark:text-zinc-500">{empty}</span>
    }

    return (
        <span className="text-sm text-zinc-900 dark:text-zinc-100">
            {rows.map((row, i) => (
                <span key={row.id} className="whitespace-nowrap">
                    {i > 0 && <span className="text-zinc-300 dark:text-zinc-600">{' · '}</span>}
                    {row.period_name.toLowerCase() !== 'open' && (
                        <span className="text-zinc-500 dark:text-zinc-400">{periodLabel(row.period_name)} </span>
                    )}
                    <span className="font-medium tabular-nums">{formatHoursRange(row)}</span>
                </span>
            ))}
        </span>
    )
}
