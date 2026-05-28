'use client'

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Play } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AboutPage() {
    const { push } = useRouter();

    const handleTryTutorial = () => {
        // Clear tutorial flag
        localStorage.removeItem('eatunc_tutorial_completed');

        // Get today's date in YYYY-MM-DD format (local time)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Redirect specifically to Lenoir for the tutorial
        push(`/lenoir/${dateStr}`);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ArrowLeft className="mr-2 size-4" />
                Back to Menu
            </Link>

            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative size-14 rounded-xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800 shrink-0">
                        <Image
                            src="/eat_unc_logo_square.png"
                            alt="Eat UNC Logo"
                            fill
                            sizes="56px"
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">About Eat UNC</h1>
                </div>

                <button
                    type="button"
                    onClick={handleTryTutorial}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4B9CD3] hover:bg-[#4B9CD3]/90 text-white font-semibold transition-all shadow-md active:scale-95"
                >
                    <Play className="size-4 fill-current" />
                    Try it out
                </button>
            </div>

            <div className="prose dark:prose-invert">
                <p className="text-lg text-muted-foreground mb-6">
                    Eat UNC is a premium dining dashboard designed for UNC students. We provide standard menu information with a focus on nutrition and clarity.
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
