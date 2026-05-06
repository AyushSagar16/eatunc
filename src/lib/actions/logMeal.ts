import { db, getDeviceId, nowIso, type LocalMealLog } from '@/lib/dexie'
import type { CartItem } from '@/lib/stores/cart'

export interface LogMealInput {
  date: string
  meal_period: string
  items: CartItem[]
  user_id?: string | null
}

export async function logMeal({
  date,
  meal_period,
  items,
  user_id = null,
}: LogMealInput): Promise<LocalMealLog[]> {
  const device_id = getDeviceId()
  const now = nowIso()

  const rows: LocalMealLog[] = items.map((item) => {
    const servings = item.servings || 1
    return {
      id: crypto.randomUUID(),
      user_id,
      device_id,
      logged_at: now,
      logged_date: date,
      meal_period,
      dining_hall: item.dining_hall,
      source: item.source,
      recipe_number: item.recipe_number,
      custom_food_id: item.custom_food_id,
      food_name: item.food_name,
      calories_kcal: round((item.calories_kcal || 0) * servings),
      protein_g: round((item.protein_g || 0) * servings),
      fat_g: round((item.fat_g || 0) * servings),
      carbohydrates_g: round((item.carbohydrates_g || 0) * servings),
      fiber_g: item.fiber_g != null ? round(item.fiber_g * servings) : null,
      sodium_mg: item.sodium_mg != null ? round(item.sodium_mg * servings) : null,
      servings,
      photo_url: null,
      notes: null,
      created_at: now,
      updated_at: now,
      is_synced: false,
    }
  })

  await db.meal_logs.bulkPut(rows)
  return rows
}

export async function updateLogServings(id: string, servings: number): Promise<void> {
  const log = await db.meal_logs.get(id)
  if (!log) return
  const oldServings = log.servings || 1
  const ratio = servings / oldServings
  await db.meal_logs.update(id, {
    servings,
    calories_kcal: round(log.calories_kcal * ratio),
    protein_g: round(log.protein_g * ratio),
    fat_g: round(log.fat_g * ratio),
    carbohydrates_g: round(log.carbohydrates_g * ratio),
    fiber_g: log.fiber_g != null ? round(log.fiber_g * ratio) : null,
    sodium_mg: log.sodium_mg != null ? round(log.sodium_mg * ratio) : null,
    updated_at: nowIso(),
    is_synced: false,
  })
}

export async function deleteLog(id: string): Promise<void> {
  await db.meal_logs.delete(id)
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}
