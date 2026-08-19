import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import TryTutorialButton from "@/components/TryTutorialButton";
import { getBrands, getLocations } from "@/lib/campus";
import { breadcrumbList, canonical, jsonLd } from "@/lib/seo";

export const revalidate = 86400;

export default async function AboutPage() {
    const [locations, brands] = await Promise.all([
        getLocations().catch(() => []),
        getBrands().catch(() => []),
    ]);

    const buildings = new Set(locations.map((l) => l.venue_group)).size;

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "AboutPage",
                "@id": `${canonical("/about")}#about`,
                name: "About Eat UNC",
                url: canonical("/about"),
                about: { "@id": `${canonical("/")}#organization` },
            },
            breadcrumbList([
                { name: "Eat UNC", path: "/" },
                { name: "About", path: "/about" },
            ]),
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
            />
            <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Menu
                </Link>

                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800 shrink-0">
                            <Image
                                src="/eat_unc_logo_square.png"
                                alt="Eat UNC"
                                fill
                                sizes="56px"
                                className="object-cover"
                            />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">About Eat UNC</h1>
                    </div>
                    <TryTutorialButton />
                </div>

                <div className="space-y-8 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    <p className="text-lg">
                        Eat UNC is an independent guide to eating on the UNC Chapel Hill campus. It
                        shows what is being served today, when each place is open, and what is
                        actually in the food — calories, protein, fat, carbs, allergens and dietary
                        labels — for {locations.length} dining locations across {buildings}{" "}
                        buildings.
                    </p>

                    <section>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                            Not affiliated with UNC
                        </h2>
                        <p>
                            Eat UNC is not run by the University of North Carolina at Chapel Hill or
                            by Carolina Dining Services. It is a student-built project. CDS is the
                            university&apos;s official dining operator, and its own site is at{" "}
                            <a
                                href="https://dining.unc.edu"
                                className="text-[#4B9CD3] hover:underline"
                                rel="noopener"
                            >
                                dining.unc.edu
                            </a>
                            . Anything about meal plans, billing or dining policy is theirs to
                            answer, not ours.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                            Where the data comes from
                        </h2>
                        <p className="mb-3">
                            Menus, service periods and dietary labels are read from the pages
                            Carolina Dining Services publishes, once a night at about 1:00 am
                            Eastern. Nutrition for UNC recipes comes from UNC&apos;s own recipe
                            data. Nothing here is typed in by hand, so what you see is what CDS
                            published — including its mistakes.
                        </p>
                        <p>
                            The {brands.length} third-party restaurants on campus — Chick-fil-A,
                            Bojangles, Subway, Bento Sushi and the rest — do not publish through
                            CDS. Their nutrition is gathered from each operator&apos;s own materials
                            and is credited on{" "}
                            <Link href="/brands" className="text-[#4B9CD3] hover:underline">
                                each brand&apos;s page
                            </Link>
                            .
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                            Published numbers and estimated ones
                        </h2>
                        <p>
                            Every macro is marked either <strong>published</strong> — the operator
                            disclosed it — or <strong>estimated</strong>, meaning we derived it and
                            said how. Estimated does not mean worse; it records how we know. Where a
                            vendor never filed nutrition, UNC&apos;s system returns zeroes that look
                            identical to black coffee, and those are researched and labelled rather
                            than passed along as fact.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                            Allergens
                        </h2>
                        <p>
                            Allergen filters dim matching dishes instead of hiding them, so nothing
                            disappears from a menu without you seeing it. Where an operator&apos;s
                            dietary claim contradicts its own allergen list, the allergen list is
                            kept and the dietary flag is dropped. Treat all of it as a guide, not a
                            guarantee: recipes and preparation change, and if an allergy is serious,
                            ask the staff at the station.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                            Found something wrong?
                        </h2>
                        <p>
                            Wrong menu, missing venue, a number that looks off —{" "}
                            <Link href="/feedback" className="text-[#4B9CD3] hover:underline">
                                tell us
                            </Link>
                            . There is also an{" "}
                            <Link href="/unc-dining-app" className="text-[#4B9CD3] hover:underline">
                                iPhone app
                            </Link>{" "}
                            with favorites, a meal log and menu notifications.
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}
