import { db, getActiveGoal, getDeviceId, nowIso, type LocalUserGoal } from '@/lib/dexie'

export interface GoalInput {
  calorie_goal: number | null
  protein_goal_g: number | null
  fat_goal_g: number | null
  carb_goal_g: number | null
  user_id?: string | null
}

export async function setGoal({
  calorie_goal,
  protein_goal_g,
  fat_goal_g,
  carb_goal_g,
  user_id = null,
}: GoalInput): Promise<LocalUserGoal> {
  const device_id = getDeviceId()
  const now = nowIso()
  const row: LocalUserGoal = {
    id: crypto.randomUUID(),
    user_id,
    device_id,
    effective_from: now,
    calorie_goal,
    protein_goal_g,
    fat_goal_g,
    carb_goal_g,
    created_at: now,
    is_synced: false,
  }
  await db.user_goals.put(row)
  return row
}

export async function loadGoalForDate(
  date: string,
  user_id: string | null = null,
): Promise<LocalUserGoal | null> {
  const device_id = getDeviceId()
  const goal = await getActiveGoal(date, user_id, device_id)
  return goal ?? null
}

export async function hasAnyGoal(user_id: string | null = null): Promise<boolean> {
  const device_id = getDeviceId()
  if (user_id) {
    const c = await db.user_goals.where('user_id').equals(user_id).count()
    if (c > 0) return true
  }
  const c2 = await db.user_goals.where('device_id').equals(device_id).count()
  return c2 > 0
}
