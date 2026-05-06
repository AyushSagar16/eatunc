import Dexie, { type Table } from 'dexie'

export type MealSource = 'menu' | 'custom'

export interface LocalMealLog {
  id: string
  user_id: string | null
  device_id: string
  logged_at: string
  logged_date: string
  meal_period: string
  dining_hall: string | null
  source: MealSource
  recipe_number: number | null
  custom_food_id: string | null
  food_name: string
  calories_kcal: number
  protein_g: number
  fat_g: number
  carbohydrates_g: number
  fiber_g: number | null
  sodium_mg: number | null
  servings: number
  photo_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
  is_synced: boolean
}

export interface LocalCustomFood {
  id: string
  user_id: string | null
  device_id: string
  name: string
  calories_kcal: number
  protein_g: number
  fat_g: number
  carbohydrates_g: number
  fiber_g: number | null
  sodium_mg: number | null
  default_serving: number
  created_at: string
  updated_at: string
  is_synced: boolean
}

export interface LocalUserGoal {
  id: string
  user_id: string | null
  device_id: string
  effective_from: string
  calorie_goal: number | null
  protein_goal_g: number | null
  fat_goal_g: number | null
  carb_goal_g: number | null
  created_at: string
  is_synced: boolean
}

class EatUncDB extends Dexie {
  meal_logs!: Table<LocalMealLog, string>
  custom_foods!: Table<LocalCustomFood, string>
  user_goals!: Table<LocalUserGoal, string>

  constructor() {
    super('eatunc')
    this.version(1).stores({
      meal_logs: 'id, user_id, device_id, logged_date, logged_at, [user_id+logged_date], [device_id+logged_date], is_synced',
      custom_foods: 'id, user_id, device_id, name, is_synced',
      user_goals: 'id, user_id, device_id, effective_from, is_synced',
    })
  }
}

export const db = new EatUncDB()

const DEVICE_ID_KEY = 'eatunc_device_id'

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server'
  let id = window.localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

const EST_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function getDiningDate(date: Date = new Date()): string {
  return EST_FORMATTER.format(date)
}

export function nowIso(): string {
  return new Date().toISOString()
}

export async function getActiveGoal(
  date: string,
  userId: string | null,
  deviceId: string,
): Promise<LocalUserGoal | undefined> {
  const cutoff = `${date}T23:59:59.999Z`
  const ownerKey = userId ?? deviceId
  const ownerField = userId ? 'user_id' : 'device_id'

  const candidates = await db.user_goals
    .where(ownerField)
    .equals(ownerKey)
    .filter((goal) => goal.effective_from <= cutoff)
    .toArray()

  if (candidates.length === 0) return undefined
  candidates.sort((a, b) => b.effective_from.localeCompare(a.effective_from))
  return candidates[0]
}

export async function getLogsForDate(
  date: string,
  userId: string | null,
  deviceId: string,
): Promise<LocalMealLog[]> {
  if (userId) {
    return db.meal_logs
      .where('[user_id+logged_date]')
      .equals([userId, date])
      .reverse()
      .sortBy('logged_at')
  }
  return db.meal_logs
    .where('[device_id+logged_date]')
    .equals([deviceId, date])
    .reverse()
    .sortBy('logged_at')
}

export async function getLogsBetween(
  startDate: string,
  endDate: string,
  userId: string | null,
  deviceId: string,
): Promise<LocalMealLog[]> {
  const matches = userId
    ? await db.meal_logs.where('user_id').equals(userId).toArray()
    : await db.meal_logs.where('device_id').equals(deviceId).toArray()
  return matches.filter(
    (log) => log.logged_date >= startDate && log.logged_date <= endDate,
  )
}

export interface DayTotals {
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number | null
  sodium: number | null
}

export function sumLogs(logs: LocalMealLog[]): DayTotals {
  let calories = 0
  let protein = 0
  let fat = 0
  let carbs = 0
  let fiber = 0
  let sodium = 0
  let hasFiber = false
  let hasSodium = false

  for (const log of logs) {
    calories += log.calories_kcal ?? 0
    protein += log.protein_g ?? 0
    fat += log.fat_g ?? 0
    carbs += log.carbohydrates_g ?? 0
    if (log.fiber_g != null) {
      fiber += log.fiber_g
      hasFiber = true
    }
    if (log.sodium_mg != null) {
      sodium += log.sodium_mg
      hasSodium = true
    }
  }

  return {
    calories,
    protein,
    fat,
    carbs,
    fiber: hasFiber ? fiber : null,
    sodium: hasSodium ? sodium : null,
  }
}
