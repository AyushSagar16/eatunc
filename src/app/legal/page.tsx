import { Scale } from "lucide-react";
import type { Metadata } from "next";
import { Breadcrumbs, CampusPage, PageHeading } from "@/components/campus/CampusChrome";

export const metadata: Metadata = {
    title: "Legal & Privacy",
    description: "Legal information, privacy policy, and terms of use for Eat UNC - the unofficial UNC dining hall menu dashboard.",
    openGraph: {
        title: "Legal & Privacy",
        description: "Legal information, privacy policy, and terms of use for Eat UNC.",
        url: "https://eatunc.com/legal",
        siteName: "Eat UNC",
        type: "website",
    },
    alternates: {
        canonical: "https://eatunc.com/legal",
    },
};

export default function LegalPage() {
    return (
        <CampusPage>
            <Breadcrumbs crumbs={[{ name: "Eat UNC", path: "/" }, { name: "Legal", path: "/legal" }]} />
            <PageHeading
                icon={<Scale className="h-6 w-6" />}
                iconClassName="bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
                title="Legal"
                description="How Eat UNC sources dining information and the limits of that information."
            />
            <div className="max-w-2xl">
            <div className="prose dark:prose-invert">
                <p className="text-muted-foreground mb-6">
                    Last updated: {new Date().toLocaleDateString()}
                </p>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">Disclaimer</h2>
                    <p className="text-muted-foreground mb-4">
                        Eat UNC is an independent project and is not officially affiliated with the University of North Carolina at Chapel Hill or Carolina Dining Services.
                    </p>
                    <p className="text-muted-foreground mb-4">
                        This website provides menu information sourced from the <a href="https://dining.unc.edu/menu-hours/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4 decoration-primary/30">official UNC Dining website</a>.
                    </p>
                    <p className="text-muted-foreground">
                        While we strive for accuracy, menu items, ingredients, and nutritional information are subject to change without notice. <strong>Eat UNC does not guarantee the accuracy of allergy information or nutritional data.</strong> All food selections and allergy concerns should be double-checked in person with dining hall staff before consumption.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">Privacy Policy</h2>
                    <p className="text-muted-foreground mb-4">
                        We respect your privacy. Eat UNC does not collect personal identifiable information. We may use anonymous analytics to improve the user experience.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">Terms of Use</h2>
                    <p className="text-muted-foreground">
                        By using this website, you agree to use it for personal, non-commercial purposes only.
                    </p>
                </section>
            </div>
            </div>
        </CampusPage>
    );
}
