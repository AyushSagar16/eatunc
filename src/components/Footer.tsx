"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import AppStoreBadge from "@/components/AppStoreBadge";
import { Suspense } from "react";
import { HelpCircle } from "lucide-react";

function FooterContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isLanding = pathname === "/" && !searchParams.get("hall");
    // Every page that mounts <MenuTutorial />, which is the only listener for the restart
    // event the Tutorial button dispatches. Anchored rather than `.includes`, which also
    // matched anything with "chase" anywhere in the path.
    const isMenuPage =
        /^\/(chase|lenoir)(\/|$)/.test(pathname) || /^\/locations\/[^/]+/.test(pathname);

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
            <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-8">
                    {/* Brand & Description Column */}
                    <div className="col-span-2 space-y-4">
                        <Link
                            href="/"
                            aria-label="Eat UNC home"
                            className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3] focus-visible:ring-offset-4"
                        >
                            {isLanding ? (
                                <Image
                                    src="/eat_unc_wordmark_white.png"
                                    alt="Eat UNC"
                                    width={837}
                                    height={221}
                                    className="h-10 w-auto sm:h-12"
                                />
                            ) : (
                                <span
                                    role="img"
                                    aria-label="Eat UNC"
                                    className="block h-10 w-[152px] bg-[#4B9CD3] sm:h-12 sm:w-[182px]"
                                    style={{
                                        WebkitMask: "url('/eat_unc_wordmark_white.png') center / contain no-repeat",
                                        mask: "url('/eat_unc_wordmark_white.png') center / contain no-repeat",
                                    }}
                                />
                            )}
                        </Link>
                        <p className={cn(
                            "text-sm leading-relaxed max-w-md",
                            isLanding ? "text-blue-100/70" : "text-muted-foreground"
                        )}>
                            {isLanding
                                ? "See what UNC Chapel Hill is serving now: dining-hall menus, live hours, and every campus food counter in one place."
                                : "Making UNC dining easier to explore, with live hours, campus-wide locations, nutrition facts, and dietary filters."
                            }
                        </p>
                        {/* The landing hero carries its own badge, so showing one here
                            too would stack two of them within a screen of each other. */}
                        {!isLanding && <AppStoreBadge source="footer" />}

                        <p className={cn("text-xs pt-2", isLanding ? "text-blue-100/40" : "text-muted-foreground")}>
                            &copy; {new Date().getFullYear()} Eat UNC. All rights reserved.
                        </p>
                    </div>

                    {/* Dining Halls Column */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold opacity-80">
                            Where to Eat
                        </h4>
                        <ul className="space-y-1.5 text-sm">
                            <li>
                                <Link
                                    href="/chase"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    Chase Dining Hall
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/lenoir"
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
                                    Today&apos;s Menu
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/open-now"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    What&apos;s Open Now
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/hours"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    Dining Hours
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/locations"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    All Campus Locations
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/brands"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    Restaurant Nutrition
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources Column */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold opacity-80">
                            Resources
                        </h4>
                        <ul className="space-y-1.5 text-sm">
                            <li>
                                <Link
                                    href="/faq"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    UNC Dining FAQ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/unc-dining-app"
                                    className={cn("transition-colors", isLanding ? "text-blue-100/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
                                >
                                    iPhone App
                                </Link>
                            </li>
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
