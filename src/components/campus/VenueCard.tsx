import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Location, OpenPeriod } from '@/lib/campus'
import { locationPath } from '@/lib/campus'
import { Badge } from './CampusChrome'
import { formatClock, kindMeta } from './campusDisplay'

/**
 * A venue on the `/locations` index.
 *
 * The whole card is one `<a>`. The homepage's hall cards are `motion.button`s that push the
 * router, which is why the site currently exposes no crawlable link to any menu at all; this
 * page must not repeat that.
 */
export function VenueCard({ location, openNow }: { location: Location; openNow?: OpenPeriod }) {
    const kind = kindMeta(location.kind)

    return (
        <Link
            href={locationPath(location)}
            className="group flex items-center gap-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm px-4 py-3.5 transition-colors hover:border-[#4B9CD3]/50 dark:hover:border-[#4B9CD3]/40"
        >
            <div className="min-w-0 flex-1">
                <div className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">{location.name}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge className={kind.badgeClass}>{kind.short}</Badge>
                    {openNow ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                            Open now · until {formatClock(openNow.period.closes_label)}
                        </Badge>
                    ) : (
                        <Badge className="bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20">
                            Closed right now
                        </Badge>
                    )}
                </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-[#4B9CD3] transition-colors" />
        </Link>
    )
}
