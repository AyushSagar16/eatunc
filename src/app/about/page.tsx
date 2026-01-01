import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Menu
            </Link>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800 shrink-0">
                    <Image
                        src="/unc-food-logo.png"
                        alt="Eat UNC Logo"
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">About eatUNC</h1>
            </div>

            <div className="prose dark:prose-invert">
                <p className="text-lg text-muted-foreground mb-6">
                    eatUNC is a premium dining dashboard designed for UNC students. We provide standard menu information with a focus on nutrition and clarity.
                </p>

                <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
                <p className="text-muted-foreground mb-6">
                    To help students make informed dining choices by presenting menu data in a clean, accessible, and beautiful interface.
                </p>

                <h2 className="text-xl font-semibold mb-3">Features</h2>
                <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
                    <li>Real-time menu updates from UNC Dining</li>
                    <li>Detailed nutritional information</li>
                    <li>Dietary preference filtering</li>
                    <li>Mobile-friendly design</li>
                </ul>
            </div>
        </div>
    );
}
