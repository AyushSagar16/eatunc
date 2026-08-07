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
                "w-full",
                isLanding
                    ? "bg-[#13294B] text-white border-t border-white/5"
                    : "bg-background border-t border-border mt-auto"
            )}
        >
            <div className="container mx-auto px-6 py-6 md:py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-8">
                    {/* Brand & Description Column */}
                    <div className="col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                            {/* Simple text logo or icon if available */}
                            <span className="text-xl font-bold tracking-tight">Eat UNC</span>
                        </div>
                        <p className={cn(
                            "text-sm leading-relaxed max-w-md",
                            isLanding ? "text-blue-100/70" : "text-muted-foreground"
                        )}>
                            {isLanding
                                ? "View today's dining menu at UNC Chapel Hill. Eat UNC provides real-time menus for Chase Dining Hall on South Campus and Top of Lenoir on North Campus."
                                : "Making UNC dining menus eager to explore. Real-time updates, nutrition facts, and dietary filters for Chapel Hill students."
                            }
                        </p>
                        <p className={cn("text-xs pt-2", isLanding ? "text-blue-100/40" : "text-muted-foreground")}>
                            &copy; {new Date().getFullYear()} Eat UNC. All rights reserved.
                        </p>
                    </div>

                    {/* Dining Halls Column */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80">
                            Dining Halls
                        </h4>
                        <ul className="space-y-1.5 text-sm">
                            <li>
                                <Link
                                    href="/chase-menu"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    Chase Dining Hall
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/lenoir-menu"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    Top of Lenoir
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/today"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    Today's Menu
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources Column */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80">
                            Resources
                        </h4>
                        <ul className="space-y-1.5 text-sm">
                            <li>
                                <Link
                                    href="/about"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/feedback"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    Feedback
                                </Link>
                            </li>
                            {isMenuPage && (
                                <li>
                                    <button
                                        onClick={handleRestartTutorial}
                                        className={cn(
                                            "flex items-center gap-2 transition-colors",
                                            isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <HelpCircle className="w-3.5 h-3.5" />
                                        Tutorial
                                    </button>
                                </li>
                            )}
                            <li>
                                <Link
                                    href="/legal"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    Legal
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy/ios"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    App Privacy
                                </Link>
                            </li>
                        </ul>
                    </div>
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
