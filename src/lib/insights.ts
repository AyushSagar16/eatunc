import type { LocalMealLog, LocalUserGoal } from '@/lib/dexie'

export interface DailyTotals {
    date: string
    calories: number
    protein: number
    fat: number
    carbs: number
}

export function dailyTotals(logs: LocalMealLog[]): DailyTotals[] {
    const byDate = new Map<string, DailyTotals>()
    for (const log of logs) {
        const d = log.logged_date
        const existing = byDate.get(d) ?? { date: d, calories: 0, protein: 0, fat: 0, carbs: 0 }
        existing.calories += log.calories_kcal || 0
        existing.protein += log.protein_g || 0
        existing.fat += log.fat_g || 0
        existing.carbs += log.carbohydrates_g || 0
        byDate.set(d, existing)
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export function fillMissingDays(
    totals: DailyTotals[],
    startDate: string,
    endDate: string,
): DailyTotals[] {
    const map = new Map(totals.map((t) => [t.date, t]))
    const out: DailyTotals[] = []
    const cur = isoToDate(startDate)
    const end = isoToDate(endDate)
    while (cur <= end) {
        const key = dateToIso(cur)
        out.push(map.get(key) ?? { date: key, calories: 0, protein: 0, fat: 0, carbs: 0 })
        cur.setUTCDate(cur.getUTCDate() + 1)
    }
    return out
}

export function applicableGoal(
    date: string,
    goals: LocalUserGoal[],
): LocalUserGoal | null {
    if (!goals.length) return null
    const cutoff = `${date}T23:59:59.999Z`
    const eligible = goals.filter((g) => g.effective_from <= cutoff)
    if (eligible.length === 0) return null
    return [...eligible].sort((a, b) => b.effective_from.localeCompare(a.effective_from))[0]
}

export interface StreakResult {
    name: string
    days: number
    description: string
}

export function computeStreaks(
    totals: DailyTotals[],
    goals: LocalUserGoal[],
): StreakResult[] {
    const sorted = [...totals].sort((a, b) => b.date.localeCompare(a.date))
    let proteinStreak = 0
    let calorieStreak = 0
    let logStreak = 0
    let stillProtein = true
    let stillCalorie = true
    let stillLog = true

    for (const day of sorted) {
        const goal = applicableGoal(day.date, goals)
        const hadAnyLog = day.calories > 0
        if (stillLog && hadAnyLog) logStreak++
        else stillLog = false

        if (goal?.protein_goal_g) {
            if (stillProtein && day.protein >= goal.protein_goal_g) proteinStreak++
            else stillProtein = false
        } else {
            stillProtein = false
        }
        if (goal?.calorie_goal) {
            const upper = goal.calorie_goal * 1.05
            const lower = goal.calorie_goal * 0.85
            if (stillCalorie && day.calories >= lower && day.calories <= upper) calorieStreak++
            else stillCalorie = false
        } else {
            stillCalorie = false
        }
    }

    const out: StreakResult[] = []
    if (logStreak > 0) {
        out.push({
            name: 'Logging',
            days: logStreak,
            description: logStreak === 1 ? 'Logged today.' : `${logStreak} days in a row.`,
        })
    }
    if (proteinStreak > 0) {
        out.push({
            name: 'Protein goal',
            days: proteinStreak,
            description: `${proteinStreak} day${proteinStreak === 1 ? '' : 's'} hitting your protein target.`,
        })
    }
    if (calorieStreak > 0) {
        out.push({
            name: 'Calorie target',
            days: calorieStreak,
            description: `${calorieStreak} day${calorieStreak === 1 ? '' : 's'} in your calorie window.`,
        })
    }
    return out
}

export interface HallSplit {
    chase: number
    lenoir: number
    custom: number
}

export function hallSplit(logs: LocalMealLog[]): HallSplit {
    const out: HallSplit = { chase: 0, lenoir: 0, custom: 0 }
    for (const l of logs) {
        if (l.source === 'custom') out.custom++
        else if ((l.dining_hall ?? '').toLowerCase().includes('chase')) out.chase++
        else if ((l.dining_hall ?? '').toLowerCase().includes('lenoir')) out.lenoir++
    }
    return out
}

export interface TopFood {
    name: string
    count: number
    totalCalories: number
}

export function topFoods(logs: LocalMealLog[], limit = 5): TopFood[] {
    const map = new Map<string, TopFood>()
    for (const l of logs) {
        const key = l.food_name
        const existing = map.get(key) ?? { name: key, count: 0, totalCalories: 0 }
        existing.count += 1
        existing.totalCalories += l.calories_kcal || 0
        map.set(key, existing)
    }
    return Array.from(map.values())
        .sort((a, b) => b.count - a.count || b.totalCalories - a.totalCalories)
        .slice(0, limit)
}

export function averagePerMeal(logs: LocalMealLog[], period: string): number {
    const periodLogs = logs.filter((l) => l.meal_period === period)
    const days = new Set(periodLogs.map((l) => l.logged_date))
    if (days.size === 0) return 0
    const total = periodLogs.reduce((acc, l) => acc + (l.calories_kcal || 0), 0)
    return total / days.size
}

function isoToDate(s: string): Date {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d))
}
function dateToIso(d: Date): string {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
}
