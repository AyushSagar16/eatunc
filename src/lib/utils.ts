import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Chapel Hill. Defined here rather than in `campus.ts` so that reading it costs nothing:
 * `campus.ts` constructs the Supabase client at module scope, and the timezone is needed by
 * pure client-side helpers. `campus.ts` re-exports it, so callers still find it where they did.
 */
export const CAMPUS_TIMEZONE = 'America/New_York'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function normalizeMealPeriod(period: string): string {
    // Stored menu labels carry a parenthetical time — "LATE NIGHT (9PM-12AM)" — while
    // location_hours labels are clean ("Late Night"). Strip the suffix so both normalize
    // identically, and keep the "late" periods distinct from their daytime namesakes:
    // Late Lunch collapsing into Lunch mixed the wrong meal into the homepage highlights.
    const p = period.toLowerCase().replace(/\s*\(.*\)\s*/g, ' ').trim();
    if (p.includes('breakfast')) return 'breakfast';
    if (p.includes('lite-lunch') || p.includes('lite lunch') || p.includes('light lunch')) return 'lite-lunch';
    if (p.includes('late-lunch') || p.includes('late lunch')) return 'late lunch';
    if (p.includes('lunch')) return 'lunch';
    if (p.includes('late-dinner') || p.includes('late dinner')) return 'late dinner';
    if (p.includes('dinner')) return 'dinner';
    if (p.includes('late-night') || p.includes('late night')) return 'late night';
    return p;
}

export function getMealPeriodLabel(period: string): string {
    switch (period) {
        case 'breakfast': return 'Breakfast';
        case 'lunch': return 'Lunch';
        case 'lite-lunch': return 'Lite Lunch';
        case 'dinner': return 'Dinner';
        default: return period.charAt(0).toUpperCase() + period.slice(1);
    }
}
/**
 * Some master_food_items rows carry case-quantity nutrition while still being labelled with a
 * per-serving amount — "Swiss Cheese, 1 Slice, 1780 kcal, 136 g protein", "Croutons, 2 Tbsp,
 * 1940 kcal". Those numbers beat every real dish on a protein or calorie sort, so left alone
 * they take over Top Picks and recommend a slice of cheese as the day's best high-protein
 * choice.
 *
 * The thresholds sit far above any genuine single serving — the largest real entrées on these
 * menus land near 900 kcal and 60 g of protein — so this only catches the bad rows. It gates
 * Top Picks alone: the items still appear on the menu with their published numbers, because
 * silently hiding food is worse than showing a number that is off.
 */
export function isImplausibleServing(item: { calories_kcal?: number | null; protein_g?: number | null }): boolean {
    return (item.calories_kcal ?? 0) > 1000 || (item.protein_g ?? 0) > 100;
}

export function calculateHealthyScore(
    item: {
        calories_kcal?: number | null
        protein_g?: number | null
        fat_g?: number | null
        carbohydrates_g?: number | null
    },
    preset: string,
): number {
    const cal = item.calories_kcal ?? 0;
    const protein = item.protein_g ?? 0;
    const fat = item.fat_g ?? 0;
    const carbs = item.carbohydrates_g ?? 0;

    switch (preset) {
        case 'protein':
            return protein * 2 - cal / 60 - fat * 1;
        case 'calories':
            return -cal + protein * 10;
        case 'fat':
            return -fat * 15 - cal + protein * 8;
        case 'carbs':
        default:
            return -carbs * 5 + protein * 5 - cal / 50;
    }
}

export function getClosestDate(availableDates: string[]): string {
    if (availableDates.length === 0) return new Date().toISOString().split('T')[0];

    const today = new Date().toISOString().split('T')[0];
    if (availableDates.includes(today)) {
        return today;
    }

    // Find closest date
    const todayTime = new Date(today).getTime();
    return availableDates.reduce((prev, curr) => {
        const prevDiff = Math.abs(new Date(prev).getTime() - todayTime);
        const currDiff = Math.abs(new Date(curr).getTime() - todayTime);
        return currDiff < prevDiff ? curr : prev;
    });
}

/**
 * Parses time ranges from meal period strings.
 * Handles formats like:
 *   - "Breakfast (7:00 AM - 10:30 AM)"
 *   - "Continental (9am-11am)"
 *   - "Brunch (11am-3pm)"
 * Returns start and end times as minutes since midnight, or null if parsing fails.
 */
export function parseMealPeriodTimes(period: string): { startMinutes: number; endMinutes: number } | null {
    // More flexible regex to match various time formats:
    // - Optional colons and minutes (:00)
    // - Optional spaces around AM/PM
    // - Handles both "7:00 AM" and "7am"
    const timeRangeMatch = period.match(/\((\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\)/i)

    if (!timeRangeMatch) return null

    const [, startHour, startMin = '0', startPeriod, endHour, endMin = '0', endPeriod] = timeRangeMatch

    // Convert to 24-hour format (minutes since midnight)
    const toMinutes = (hour: string, min: string, period: string): number => {
        let h = parseInt(hour, 10)
        const m = parseInt(min, 10)
        const isPM = period.toUpperCase() === 'PM'

        // Handle 12 AM (midnight) = 0, 12 PM (noon) = 12
        if (h === 12) {
            h = isPM ? 12 : 0
        } else if (isPM) {
            h += 12
        }

        return h * 60 + m
    }

    return {
        startMinutes: toMinutes(startHour, startMin, startPeriod),
        endMinutes: toMinutes(endHour, endMin, endPeriod)
    }
}

function getMealPeriodSortWeight(period: string): number {
    const lower = period.toLowerCase().trim()

    if (lower.includes('continental')) return 0
    if (lower.includes('breakfast')) return 1
    if (lower.includes('brunch')) return 2
    if (lower.includes('lite-lunch') || lower.includes('lite lunch') || lower.includes('light lunch')) return 4
    if (lower.includes('late-lunch') || lower.includes('late lunch')) return 5
    if (lower.includes('lunch')) return 3
    if (lower.includes('late-dinner') || lower.includes('late dinner')) return 7
    if (lower.includes('dinner')) return 6
    if (lower.includes('late-night') || lower.includes('late night')) return 8

    return 99
}

export function compareMealPeriods(a: string, b: string): number {
    const aTimes = parseMealPeriodTimes(a)
    const bTimes = parseMealPeriodTimes(b)

    if (aTimes && bTimes && aTimes.startMinutes !== bTimes.startMinutes) {
        return aTimes.startMinutes - bTimes.startMinutes
    }

    if (aTimes && !bTimes) return -1
    if (!aTimes && bTimes) return 1

    const weightDiff = getMealPeriodSortWeight(a) - getMealPeriodSortWeight(b)
    if (weightDiff !== 0) {
        return weightDiff
    }

    return a.localeCompare(b)
}

/**
 * Minutes since midnight in Chapel Hill, for an instant.
 *
 * `Date.getHours()` reads the *server's* clock, which is not Chapel Hill's: Vercel functions run
 * UTC, four or five hours ahead depending on the season. Anything comparing an instant against a
 * meal period has to convert first, because the periods are campus wall-clock by definition —
 * "lunch (11AM-3PM)" is 11am in Chapel Hill whatever the machine thinks the time is.
 *
 * `hourCycle: 'h23'` rather than `hour12: false`, which renders midnight as "24" in some engines.
 */
export function campusMinutesSinceMidnight(at: Date): number {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: CAMPUS_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(at)

    const hour = Number(parts.find((part) => part.type === 'hour')?.value)
    const minute = Number(parts.find((part) => part.type === 'minute')?.value)
    if (Number.isNaN(hour) || Number.isNaN(minute)) return 0

    return hour * 60 + minute
}

/**
 * Finds which meal period is currently active based on the given time.
 * Falls back to the first available period if no match is found.
 *
 * The instant is read in Chapel Hill's timezone, never the server's — see
 * `campusMinutesSinceMidnight`. Rendered server-side this decides which meal tab a visitor
 * lands on, and on a UTC server it used to open Chase on Late-night all evening.
 */
export function getActiveMealPeriod(periods: string[], currentTime: Date): string {
    if (periods.length === 0) return ''

    const currentMinutes = campusMinutesSinceMidnight(currentTime)

    for (const period of periods) {
        const times = parseMealPeriodTimes(period)
        if (times) {
            const { startMinutes, endMinutes } = times

            // Handle normal case: start < end (e.g., 7:00 AM - 10:30 AM)
            if (startMinutes <= endMinutes) {
                if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
                    return period
                }
            } else {
                // Handle overnight case: end < start (e.g., 10:00 PM - 2:00 AM)
                if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
                    return period
                }
            }
        }
    }

    // No active period found - fall back to first period
    return periods[0]
}
