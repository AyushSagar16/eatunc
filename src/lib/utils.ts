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
        case 'balanced':
        default:
            return protein * 1.5 - cal / 70 - fat * 1.2 - carbs / 80;
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
