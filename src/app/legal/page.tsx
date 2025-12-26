import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Menu
            </Link>

            <h1 className="text-3xl font-bold tracking-tight mb-6">Legal</h1>

            <div className="prose dark:prose-invert">
                <p className="text-muted-foreground mb-6">
                    Last updated: {new Date().toLocaleDateString()}
                </p>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">Disclaimer</h2>
                    <p className="text-muted-foreground mb-4">
                        eatUNC is an independent project and is not officially affiliated with the University of North Carolina at Chapel Hill or Carolina Dining Services.
                    </p>
                    <p className="text-muted-foreground">
                        While we strive for accuracy, menu items, ingredients, and nutritional information are subject to change without notice. Please verify important dietary information directly with dining staff.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">Privacy Policy</h2>
                    <p className="text-muted-foreground mb-4">
                        We respect your privacy. eatUNC does not collect personal identifiable information. We may use anonymous analytics to improve the user experience.
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
    );
}
