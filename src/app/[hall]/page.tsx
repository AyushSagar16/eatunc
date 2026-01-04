
import { getAvailableDates } from "@/lib/api";
import { redirect, notFound } from "next/navigation";

// Dynamic rendering - no caching
export const dynamic = 'force-dynamic';

const HALL_MAP: Record<string, string> = {
    chase: 'Chase',
    lenoir: 'Top of Lenoir',
};

export default async function Page({ params }: { params: Promise<{ hall: string }> }) {
    const { hall } = await params;

    // Validate Hall
    if (!Object.keys(HALL_MAP).includes(hall)) {
        notFound();
    }

    // TRUE parallel data fetching - fetch dates first to determine default date
    const dateData = await getAvailableDates();

    const availableDates = Array.from(new Set(dateData?.map(d => d.menu_date) || [])).sort();

    // Default date logic: Try to find today, otherwise find closest
    let defaultDate = availableDates[0];
    if (availableDates.length > 0) {
        const now = new Date();
        const today = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(now);

        if (availableDates.includes(today)) {
            defaultDate = today;
        } else {
            // Find closest date
            const todayTime = new Date(today).getTime();
            defaultDate = availableDates.reduce((prev, curr) => {
                const prevDiff = Math.abs(new Date(prev).getTime() - todayTime);
                const currDiff = Math.abs(new Date(curr).getTime() - todayTime);
                return currDiff < prevDiff ? curr : prev;
            });
        }
    }

    if (!defaultDate) {
        // Fallback if no dates whatsoever (unlikely but safe)
        const now = new Date();
        defaultDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(now);
    }

    redirect(`/${hall}/${defaultDate}`);
}
