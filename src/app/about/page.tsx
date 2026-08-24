import Link from "next/link";
import { Linkedin, MessageSquare, UserRound } from "lucide-react";
import { breadcrumbList, canonical, jsonLd } from "@/lib/seo";
import AboutAvatar from "@/components/AboutAvatar";
import { Breadcrumbs, CampusPage, PageHeading } from "@/components/campus/CampusChrome";

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
                <PageHeading
                    icon={<UserRound className="h-6 w-6" />}
                    iconClassName="bg-[#4B9CD3]/10 text-[#2c6f9e] dark:text-[#7cc0ec]"
                    title="About Eat UNC"
                    description="The student behind the campus dining guide."
                />

                <div className="max-w-2xl">
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-6">
                    <div className="flex items-center gap-5">
                        <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-2xl">
                            <AboutAvatar className="h-full w-full" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                Ayush Sagar
                            </p>
                            <p className="text-zinc-600 dark:text-zinc-400 mt-1">UNC student</p>
                        </div>
                    </div>
                    {/*
                        The origin story, not just a credit line. A name and a link with nothing
                        between them leaves the reader to guess what this person has to do with
                        the site they are standing on, and short beats long here since it sits
                        right under a photo, not in a full write-up.
                    */}
                    <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
                        UNC&apos;s dining hall menus used to drive me insane. Cluttered, nutrition
                        buried, and finding a high protein option felt like a scavenger hunt.
                    </p>
                    <p className="mt-3 leading-relaxed text-zinc-700 dark:text-zinc-300">
                        So I built Eat UNC: real time menus for every dining hall, one click
                        filters for calories, protein, fat and carbs, and search and sort by
                        macros.
                    </p>
                    <p className="mt-3 leading-relaxed text-zinc-700 dark:text-zinc-300">
                        No more guessing, no more clicking through menus. Just find what you need
                        and go.
                    </p>
                    <a
                        href="https://www.linkedin.com/in/ayush-sagar/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-[#4B9CD3] hover:underline"
                    >
                        <Linkedin className="h-4 w-4" aria-hidden />
                        LinkedIn
                    </a>
                </div>

                {/*
                    The prompt is a real control rather than a sentence with a link buried in it,
                    because it is the only thing this page asks the reader to do.
                */}
                <section className="mt-10 rounded-2xl border border-[#4B9CD3]/25 bg-[#4B9CD3]/[0.06] p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                        Suggestions or feature requests?
                    </h2>
                    <p className="mt-2 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        Got an idea, a feature you wish existed, or something that could be
                        better? I&apos;d love to hear it. Most of what&apos;s here exists because
                        someone told me what they wanted.
                    </p>
                    <Link
                        href="/feedback"
                        className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl bg-[#4B9CD3] hover:bg-[#4B9CD3]/90 text-white font-semibold transition shadow-md active:scale-95"
                    >
                        <MessageSquare className="h-4 w-4" aria-hidden />
                        Send feedback
                    </Link>
                </section>
                </div>
            </CampusPage>
        </>
    );
}
