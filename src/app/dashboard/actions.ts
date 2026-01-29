'use server'

/**
 * Dashboard Actions
 * 
 * Server actions for meal logging and dashboard data.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface MealLogItem {
    recipe_number: number
    food_name: string
    servings: number
    calories_per_serving: number
    protein_per_serving: number
    carbs_per_serving: number
    fat_per_serving: number
}

interface SaveMealLogData {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    items: MealLogItem[]
    notes?: string
}

interface ActionResult {
    success: boolean
    error?: string
    mealLogId?: string
}

/**
 * Get today's date in Eastern Time (America/New_York)
 */
function getTodayET(): string {
    return new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/New_York'
    }) // Returns YYYY-MM-DD
}

/**
 * Save cart items as a meal log entry
 */
export async function saveMealLog(data: SaveMealLogData): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Not authenticated' }
        }

        // Validate inputs
        if (!data.items || data.items.length === 0) {
            return { success: false, error: 'No items to save' }
        }

        const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
        if (!validMealTypes.includes(data.mealType)) {
            return { success: false, error: 'Invalid meal type' }
        }

        const today = getTodayET()

        // Create meal log entry
        const { data: mealLog, error: mealLogError } = await supabase
            .from('meal_logs')
            .insert({
                user_id: user.id,
                log_date: today,
                meal_type: data.mealType,
                notes: data.notes || null,
            })
            .select('id')
            .single()

        if (mealLogError) {
            console.error('Error creating meal log:', mealLogError)
            return { success: false, error: 'Failed to create meal log' }
        }

        // Insert meal log items
        const mealLogItems = data.items.map(item => ({
            meal_log_id: mealLog.id,
            recipe_number: item.recipe_number,
            servings: item.servings,
            food_name: item.food_name,
            calories_per_serving: item.calories_per_serving,
            protein_per_serving: item.protein_per_serving,
            carbs_per_serving: item.carbs_per_serving,
            fat_per_serving: item.fat_per_serving,
        }))

        const { error: itemsError } = await supabase
            .from('meal_log_items')
            .insert(mealLogItems)

        if (itemsError) {
            console.error('Error creating meal log items:', itemsError)
            // Try to clean up the meal log
            await supabase.from('meal_logs').delete().eq('id', mealLog.id)
            return { success: false, error: 'Failed to save meal items' }
        }

        // Revalidate dashboard to show new data
        revalidatePath('/dashboard')

        return { success: true, mealLogId: mealLog.id }
    } catch (error) {
        console.error('Save meal log error:', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Delete a meal log entry and its items
 */
export async function deleteMealLog(mealLogId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Not authenticated' }
        }

        // Delete meal log (items will cascade delete)
        const { error } = await supabase
            .from('meal_logs')
            .delete()
            .eq('id', mealLogId)
            .eq('user_id', user.id) // Ensure user owns this log

        if (error) {
            console.error('Error deleting meal log:', error)
            return { success: false, error: 'Failed to delete meal' }
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Delete meal log error:', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Get today's meal logs with items
 */
export async function getTodaysMealLogs() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Not authenticated', logs: [] }
        }

        const today = getTodayET()

        const { data: logs, error } = await supabase
            .from('meal_logs')
            .select(`
        id,
        log_date,
        meal_type,
        notes,
        created_at,
        meal_log_items (
          id,
          recipe_number,
          servings,
          food_name,
          calories_per_serving,
          protein_per_serving,
          carbs_per_serving,
          fat_per_serving
        )
      `)
            .eq('user_id', user.id)
            .eq('log_date', today)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching meal logs:', error)
            return { success: false, error: 'Failed to load meal logs', logs: [] }
        }

        return { success: true, logs: logs || [] }
    } catch (error) {
        console.error('Get meal logs error:', error)
        return { success: false, error: 'An unexpected error occurred', logs: [] }
    }
}

/**
 * Get daily totals for a specific date
 */
export async function getDailyTotals(date?: string) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated',
                totals: { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 }
            }
        }

        const targetDate = date || getTodayET()

        // Get all meal log items for the date
        const { data: logs, error } = await supabase
            .from('meal_logs')
            .select(`
        id,
        meal_log_items (
          servings,
          calories_per_serving,
          protein_per_serving,
          carbs_per_serving,
          fat_per_serving
        )
      `)
            .eq('user_id', user.id)
            .eq('log_date', targetDate)

        if (error) {
            console.error('Error fetching daily totals:', error)
            return {
                success: false,
                error: 'Failed to load daily totals',
                totals: { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 }
            }
        }

        // Calculate totals
        let calories = 0
        let protein = 0
        let carbs = 0
        let fat = 0

        logs?.forEach(log => {
            log.meal_log_items?.forEach((item: {
                servings: number
                calories_per_serving: number
                protein_per_serving: number
                carbs_per_serving: number
                fat_per_serving: number
            }) => {
                calories += Math.round(item.calories_per_serving * item.servings)
                protein += item.protein_per_serving * item.servings
                carbs += item.carbs_per_serving * item.servings
                fat += item.fat_per_serving * item.servings
            })
        })

        return {
            success: true,
            totals: {
                calories,
                protein: Math.round(protein * 10) / 10,
                carbs: Math.round(carbs * 10) / 10,
                fat: Math.round(fat * 10) / 10,
                mealCount: logs?.length || 0
            }
        }
    } catch (error) {
        console.error('Get daily totals error:', error)
        return {
            success: false,
            error: 'An unexpected error occurred',
            totals: { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 }
        }
    }
}
