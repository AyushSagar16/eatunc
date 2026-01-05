"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { HelpCircle } from "lucide-react";

function FooterContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isLanding = pathname === "/" && !searchParams.get("hall");
    const isMenuPage = pathname.includes("/chase") || pathname.includes("/lenoir");

    const handleRestartTutorial = () => {
        // Clear tutorial completion status and dispatch restart event
        localStorage.removeItem("eatunc_tutorial_completed");
        window.dispatchEvent(new CustomEvent("restartTutorial"));
    };

    return (
        <footer
            className={cn(
                "w-full py-6 mt-auto",
                isLanding
                    ? "fixed bottom-0 left-0 z-50 border-none bg-transparent"
                    : "border-t border-border bg-background mt-12"
            )}
        >
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
                <div className="flex items-center gap-2">

                    <p
                        className={cn(
                            "text-sm text-center md:text-left transition-colors",
                            isLanding ? "text-white/60" : "text-muted-foreground"
                        )}
                    >
                        &copy; {new Date().getFullYear()} Eat UNC. All rights reserved.
                    </p>
                </div>
                <div className="flex gap-4 items-center">
                    {isMenuPage && (
                        <button
                            onClick={handleRestartTutorial}
                            className={cn(
                                "text-sm font-medium transition-colors flex items-center gap-1.5 hover:text-foreground",
                                isLanding ? "text-white/60 hover:text-white" : "text-muted-foreground"
                            )}
                            aria-label="Start tutorial"
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span>Tutorial</span>
                        </button>
                    )}
                    <Link
                        href="/about"
                        className={cn(
                            "text-sm font-medium transition-colors hover:text-foreground",
                            isLanding ? "text-white/60 hover:text-white" : "text-muted-foreground"
                        )}
                    >
                        About
                    </Link>
                    <Link
                        href="/legal"
                        className={cn(
                            "text-sm font-medium transition-colors hover:text-foreground",
                            isLanding ? "text-white/60 hover:text-white" : "text-muted-foreground"
                        )}
                    >
                        Legal
                    </Link>
                </div>
            </div>
        </footer>
    );
}

export function Footer() {
    return (
        <Suspense>
            <FooterContent />
        </Suspense>
    );
}
