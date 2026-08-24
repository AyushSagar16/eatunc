"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, Clock3, MapPinned, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";

const PRIMARY_LINKS = [
    { href: "/today", label: "Today's menu", icon: UtensilsCrossed },
    { href: "/open-now", label: "Open now", icon: Clock3 },
    { href: "/locations", label: "Locations", icon: MapPinned },
    { href: "/hours", label: "Hours", icon: CalendarClock },
] as const;

/**
 * The shared masthead for public index and information pages.
 *
 * Menu pages keep their own sticky, task-focused header (hall, date and switcher), and the
 * homepage keeps its full-screen wordmark. Everywhere else gets this same compact wayfinding
 * bar so newly added campus venues are never buried in the footer.
 */
export default function SiteHeader() {
    const pathname = usePathname();

    const isHomepage = pathname === "/";
    const isHallMenu = /^\/(chase|lenoir)(\/|$)/.test(pathname);
    const isVenueMenu = /^\/locations\/[^/]+(?:\/[^/]+)?\/?$/.test(pathname);

    if (isHomepage || isHallMenu || isVenueMenu) return null;

    return (
        <header className="sticky top-0 z-[60] w-full border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95">
            <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
                <Link
                    href="/"
                    className="focus-ring flex shrink-0 items-center gap-2.5 rounded-xl text-zinc-900 dark:text-zinc-50"
                    aria-label="Eat UNC home"
                >
                    <Image
                        src="/eat_unc_logo_square.png"
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-[10px] border border-zinc-200 object-cover dark:border-zinc-800"
                        unoptimized
                    />
                    <span className="text-lg font-black tracking-tight sm:text-xl">Eat UNC</span>
                </Link>

                <nav aria-label="Primary navigation" className="min-w-0 overflow-x-auto no-visible-scrollbar">
                    <ul className="flex items-center gap-1">
                        {PRIMARY_LINKS.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href || pathname.startsWith(`${href}/`);

                            return (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        aria-current={active ? "page" : undefined}
                                        className={cn(
                                            "focus-ring flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors sm:px-3.5",
                                            active
                                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
                                        )}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                                        <span className="hidden md:inline">{label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </header>
    );
}
