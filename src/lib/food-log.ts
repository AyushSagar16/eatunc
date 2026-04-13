import { MasterFoodItem } from '@/lib/api'

export interface FoodLogEntry {
    id: string
    userId: string
    recipeNumber: number
    foodName: string
    caloriesKcal: number | null
    proteinG: number | null
    carbsG: number | null
    fatG: number | null
    servings: number
    mealPeriod: string
    diningHall: string
    loggedAt: string // ISO date string
    date: string // YYYY-MM-DD
}

export interface DailyNutritionSummary {
    date: string
    totalCalories: number
    totalProtein: number
    totalCarbs: number
    totalFat: number
    totalItems: number
    entries: FoodLogEntry[]
}

const STORAGE_KEY = 'eatunc-food-logs'

function getStoredLogs(): FoodLogEntry[] {
    if (typeof window === 'undefined') return []
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

function setStoredLogs(logs: FoodLogEntry[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function logFood(
    userId: string,
    item: MasterFoodItem,
    mealPeriod: string,
    diningHall: string,
    servings: number = 1
): FoodLogEntry {
    const now = new Date()
    const entry: FoodLogEntry = {
        id: generateId(),
        userId,
        recipeNumber: item.recipe_number,
        foodName: item.food_name || 'Unknown Item',
        caloriesKcal: item.calories_kcal,
        proteinG: item.protein_g,
        carbsG: item.carbohydrates_g,
        fatG: item.fat_g,
        servings,
        mealPeriod,
        diningHall,
        loggedAt: now.toISOString(),
        date: now.toISOString().split('T')[0],
    }

    const logs = getStoredLogs()
    logs.push(entry)
    setStoredLogs(logs)

    // Dispatch custom event so other components can react
    window.dispatchEvent(new CustomEvent('foodLogUpdated'))

    return entry
}

export function removeLogEntry(entryId: string): void {
    const logs = getStoredLogs().filter(l => l.id !== entryId)
    setStoredLogs(logs)
    window.dispatchEvent(new CustomEvent('foodLogUpdated'))
}

export function updateLogServings(entryId: string, servings: number): void {
    const logs = getStoredLogs()
    const entry = logs.find(l => l.id === entryId)
    if (entry) {
        entry.servings = servings
        setStoredLogs(logs)
        window.dispatchEvent(new CustomEvent('foodLogUpdated'))
    }
}

export function getLogsForDate(userId: string, date: string): FoodLogEntry[] {
    return getStoredLogs().filter(l => l.userId === userId && l.date === date)
}

export function getLogsForDateRange(userId: string, startDate: string, endDate: string): FoodLogEntry[] {
    return getStoredLogs().filter(l => l.userId === userId && l.date >= startDate && l.date <= endDate)
}

export function getAllLogs(userId: string): FoodLogEntry[] {
    return getStoredLogs().filter(l => l.userId === userId).sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
}

export function getDailyNutritionSummary(userId: string, date: string): DailyNutritionSummary {
    const entries = getLogsForDate(userId, date)
    return {
        date,
        totalCalories: entries.reduce((sum, e) => sum + (e.caloriesKcal ?? 0) * e.servings, 0),
        totalProtein: entries.reduce((sum, e) => sum + (e.proteinG ?? 0) * e.servings, 0),
        totalCarbs: entries.reduce((sum, e) => sum + (e.carbsG ?? 0) * e.servings, 0),
        totalFat: entries.reduce((sum, e) => sum + (e.fatG ?? 0) * e.servings, 0),
        totalItems: entries.length,
        entries,
    }
}

export function getWeeklySummaries(userId: string): DailyNutritionSummary[] {
    const today = new Date()
    const summaries: DailyNutritionSummary[] = []
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        summaries.push(getDailyNutritionSummary(userId, dateStr))
    }
    return summaries
}

export function clearAllLogs(userId: string): void {
    const logs = getStoredLogs().filter(l => l.userId !== userId)
    setStoredLogs(logs)
    window.dispatchEvent(new CustomEvent('foodLogUpdated'))
}
