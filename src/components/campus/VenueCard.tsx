import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Location } from '@/lib/campus'
import { locationPath } from '@/lib/campus'
import { Badge } from './CampusChrome'
import { kindMeta } from './campusDisplay'
import { VenueOpenBadge } from './VenueStatus'
import type { StatusRow } from '@/lib/venueStatus'

/**
 * A venue on the `/locations` index.
 *
 * The whole card is one `<a>`. The homepage's hall cards are `motion.button`s that push the
 * router, which is why the site currently exposes no crawlable link to any menu at all; this
 * page must not repeat that.
 */
export function VenueCard({
    location,
    rows,
    today,
}: {
    location: Location
    rows: StatusRow[]
    today: string
}) {
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
                    <VenueOpenBadge rows={rows} today={today} />
                </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-[#4B9CD3] transition-colors" />
        </Link>
    )
}
