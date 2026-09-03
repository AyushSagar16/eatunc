import Link from "next/link";
import { ArrowRight, Linkedin, MessageSquare } from "lucide-react";
import { breadcrumbList, canonical, jsonLd } from "@/lib/seo";
import AboutAvatar from "@/components/AboutAvatar";
import DitherShader from "@/components/ui/dither-shader";
import { Breadcrumbs, CampusPage } from "@/components/campus/CampusChrome";

/** One node id for the person, shared by the `author` and `founder` references below. */
const AUTHOR_ID = `${canonical("/about")}#ayush-sagar`;

/**
 * Who built this, and where to tell him it is broken. That is the whole page.
 *
 * It used to carry the site's data provenance too — the nightly scrape, the published-versus-
 * estimated rule, the allergen policy. Those were moved off rather than kept alongside: the
 * disclaimer and the allergen warning live on /legal, which is where a reader looking for them
 * goes, and mixing them in here left the page answering two unrelated questions at once.
 *
 * No longer async, because nothing on it is fetched any more.
 */
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "AboutPage",
            "@id": `${canonical("/about")}#about`,
            name: "About Eat UNC",
            url: canonical("/about"),
            about: { "@id": `${canonical("/")}#organization` },
            author: { "@id": AUTHOR_ID },
        },
        {
            "@type": "Person",
            "@id": AUTHOR_ID,
            name: "Ayush Sagar",
            url: canonical("/about"),
            affiliation: {
                "@type": "CollegeOrUniversity",
                name: "University of North Carolina at Chapel Hill",
                url: "https://www.unc.edu",
            },
            // The one external profile that verifies this is a real person. `sameAs` is how a
            // search engine reconciles the name on this page with the account over there;
            // without it "Ayush Sagar" is a string, not an entity.
            sameAs: ["https://www.linkedin.com/in/ayush-sagar/"],
        },
        // Declared elsewhere in full — the homepage owns the Organization node. Repeating the
        // `@id` with one new property merges into it rather than declaring a rival
        // organisation, which is how JSON-LD graphs are meant to be extended across pages.
        {
            "@type": "Organization",
            "@id": `${canonical("/")}#organization`,
            founder: { "@id": AUTHOR_ID },
        },
        breadcrumbList([
            { name: "Eat UNC", path: "/" },
            { name: "About", path: "/about" },
        ]),
    ],
};

export default function AboutPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
            />
            <CampusPage>
                <Breadcrumbs crumbs={[{ name: "Eat UNC", path: "/" }, { name: "About", path: "/about" }]} />

                {/*
                    The hero is the page's one piece of art, and it is the homepage's treatment
                    rather than a new one: the Old Well under the same navy/blue Bayer duotone,
                    a gradient wordline over it. A bordered grey card here read as a settings
                    panel — this is the only page on the site whose subject is a person, so it
                    is the only one that can afford a full-bleed portrait.
                */}
                <section
                    className="relative isolate overflow-hidden rounded-3xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-500"
                    style={{ backgroundColor: "#13294B" }}
                >
                    <div aria-hidden className="pointer-events-none absolute inset-0">
                        <DitherShader
                            src="/old-well-optimized.jpg"
                            ditherMode="bayer"
                            colorMode="duotone"
                            primaryColor="#13294B" // UNC Navy
                            secondaryColor="#4B9CD3" // UNC Blue
                            threshold={0.7}
                            pixelRatio={1}
                            className="h-full w-full opacity-50"
                        />
                        {/*
                            Diagonal rather than vertical: the copy sits bottom-left and the
                            portrait top-left, so the image is only allowed to stay legible in
                            the corner nothing is written into.
                        */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#13294B]/95 via-[#13294B]/85 to-[#13294B]/45" />
                        {/*
                            A second scrim along the bottom, for the phone. There the panel is
                            one narrow column, so the last paragraph lands in the corner the
                            diagonal deliberately left bright and the dither reads through it.
                        */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#13294B]/85 via-transparent to-transparent" />
                    </div>

                    <div className="relative p-6 sm:p-10">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                            {/*
                                A pale Carolina tile behind the portrait, not the navy panel.
                                `AboutAvatar` inks the photo in a five-stop ramp whose darkest
                                stop *is* #13294B and whose transparent background shows the
                                card through — dropped straight onto navy, the hair and the
                                shaded side of the face would dissolve into it.
                            */}
                            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#DCEEF9] to-[#8FCBEB] shadow-lg ring-1 ring-white/25 sm:h-32 sm:w-32">
                                <AboutAvatar className="h-full w-full" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8FCBEB]">
                                    Built by
                                </p>
                                <p className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                    Ayush Sagar
                                </p>
                                <p className="mt-0.5 text-sm text-blue-100/70">UNC student</p>
                                <a
                                    href="https://www.linkedin.com/in/ayush-sagar/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="focus-ring mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                                >
                                    <Linkedin className="h-4 w-4" aria-hidden />
                                    LinkedIn
                                </a>
                            </div>
                        </div>

                        <h1 className="mt-8 bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text pb-[0.1em] text-4xl font-black leading-[1.12] tracking-tighter text-transparent drop-shadow-2xl sm:mt-10 sm:text-5xl [@media(forced-colors:active)]:text-white">
                            About Eat UNC
                        </h1>

                        {/*
                            The origin story, not a credit line. A name and a link with nothing
                            between them leaves the reader guessing what this person has to do
                            with the site they are standing on.
                        */}
                        <div className="mt-5 max-w-2xl space-y-3 text-[15px] leading-relaxed text-blue-50/85 sm:text-base">
                            <p>
                                UNC&apos;s dining menus drove me insane. Cluttered pages, nutrition buried
                                three clicks deep, and finding a high-protein option was a scavenger hunt.
                            </p>
                            <p>
                                So I built Eat UNC: live menus for every dining hall, one-click filters for
                                calories, protein, fat and carbs, and search and sort by macros.
                            </p>
                            <p className="font-semibold text-white">Find what you need, go eat.</p>
                        </div>
                    </div>
                </section>

                {/*
                    The prompt is a real control rather than a sentence with a link buried in it,
                    because it is the only thing this page asks the reader to do.
                */}
                <section className="group relative mt-6 overflow-hidden rounded-3xl border border-[#4B9CD3]/25 bg-[#4B9CD3]/[0.07] p-6 sm:p-8">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#4B9CD3]/15 blur-3xl"
                    />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-xl">
                            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                                Suggestions or feature requests?
                            </h2>
                            <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-300">
                                Got an idea, or found something broken? Tell me. Most of what&apos;s here
                                exists because someone asked for it.
                            </p>
                        </div>
                        <Link
                            href="/feedback"
                            className="focus-ring inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-[#4B9CD3] px-4 py-2.5 font-semibold text-white shadow-md transition hover:bg-[#4B9CD3]/90 active:scale-95 sm:self-auto"
                        >
                            <MessageSquare className="h-4 w-4" aria-hidden />
                            Send feedback
                            <ArrowRight
                                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                aria-hidden
                            />
                        </Link>
                    </div>
                </section>
            </CampusPage>
        </>
    );
}
