import { BadgeCheck, Calculator, ShieldAlert } from 'lucide-react'

/**
 * The one explanation both brand pages lean on.
 *
 * Kept in a component rather than repeated as prose so the index and the 18 detail pages can
 * never end up describing the same two words differently.
 */
export default function NutritionSourceLegend({
    showAllergenNote = true,
}: {
    showAllergenNote?: boolean
}) {
    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                How to read these numbers
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
                Every figure on these pages is labelled with where it came from. There are exactly
                two labels, and the difference is not a quality score — it records how we know.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <BadgeCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                        </div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Published</h3>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        The operator disclosed the number itself — a nutrition PDF, a wall sign, or
                        the brand&apos;s own nutrition site. We transcribed it and did not adjust it.
                        Each brand page links the exact document we read.
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Calculator className="w-4 h-4 text-amber-600" aria-hidden="true" />
                        </div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Estimated</h3>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        The operator publishes nothing for that item, so we built the number up from
                        the ingredients the menu names, using USDA reference data. Every estimated
                        row carries its own derivation — open &ldquo;How this was estimated&rdquo; on
                        the row to read exactly what was assumed.
                    </p>
                </div>
            </div>

            {showAllergenNote && (
                <div className="mt-4 flex gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        <strong className="text-zinc-900 dark:text-zinc-100">
                            Allergen lists are never estimated.
                        </strong>{' '}
                        Where an operator publishes allergens we keep the list verbatim; where it does
                        not, the row says so. A blank allergen list means we have not verified one —
                        it never means the item is free of anything. If you have a food allergy,
                        confirm with the operator before you eat.
                    </p>
                </div>
            )}
        </div>
    )
}
