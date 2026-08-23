import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import type { ExternalBrand } from '@/lib/campus'
import type { SourceSplit } from './nutrition'

export interface BrandCardProps {
    brand: ExternalBrand
    split: SourceSplit
    /** Buildings the brand operates in, deduplicated — "Lenoir Hall", "Food Trucks". */
    venueGroups: string[]
}

/**
 * One brand on the index. The published/estimated split is on the card rather than only on the
 * detail page, so the shape of the data set is visible before anyone clicks — a brand with 108
 * published rows and a brand with 102 estimated ones should not look identical in a grid.
 */
export default function BrandCard({ brand, split, venueGroups }: BrandCardProps) {
    const publishedPct = split.total > 0 ? Math.round((split.published / split.total) * 100) : 0

    return (
        <Link
            href={`/brands/${brand.slug}`}
            className="group flex flex-col p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-[#4B9CD3] hover:shadow-md transition-all"
        >
            <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
                    {brand.name}
                </h3>
                <ArrowRight
                    className="w-4 h-4 text-zinc-300 group-hover:text-[#4B9CD3] shrink-0 mt-1.5 transition-colors"
                    aria-hidden="true"
                />
            </div>

            {venueGroups.length > 0 && (
                <p className="flex items-start gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{venueGroups.join(' · ')}</span>
                </p>
            )}

            <div className="mt-auto space-y-2">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {split.total} {split.total === 1 ? 'item' : 'items'} with nutrition
                </p>

                {split.total > 0 && (
                    <>
                        <div
                            className="h-1.5 w-full rounded-full overflow-hidden bg-amber-500/30 flex"
                            role="presentation"
                        >
                            <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${publishedPct}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {split.published > 0 && (
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                    {split.published} published
                                </span>
                            )}
                            {split.published > 0 && split.estimated > 0 && ' · '}
                            {split.estimated > 0 && (
                                <span className="text-amber-700 dark:text-amber-400 font-medium">
                                    {split.estimated} estimated
                                </span>
                            )}
                        </p>
                    </>
                )}
            </div>
        </Link>
    )
}
