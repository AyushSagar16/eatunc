import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function normalizeMealPeriod(period: string): string {
    const p = period.toLowerCase().trim();
    if (p.includes('breakfast')) return 'breakfast';
    if (p.includes('lite-lunch') || p.includes('lite lunch') || p.includes('light lunch')) return 'lite-lunch';
    if (p.includes('lunch')) return 'lunch';
    if (p.includes('dinner')) return 'dinner';
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
export function calculateHealthyScore(item: any, preset: string): number {
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

/**
 * Finds which meal period is currently active based on the given time.
 * Falls back to the first available period if no match is found.
 */
export function getActiveMealPeriod(periods: string[], currentTime: Date): string {
    if (periods.length === 0) return ''

    // Get current time as minutes since midnight
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()

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
