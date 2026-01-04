import { supabase } from './supabase'
import { Database } from '@/lib/database.types'

export type Menu = Database['public']['Tables']['menus']['Row']
export type MenuEntry = Database['public']['Tables']['menu_entries']['Row']
export type MasterFoodItem = Database['public']['Tables']['master_food_items']['Row']

export type MenuEntryWithFood = MenuEntry & {
    master_food_items: MasterFoodItem | null
}

export type FullMenu = Menu & {
    menu_entries: MenuEntryWithFood[]
}

/**
 * Fetch all menus, optionally filtered by date and dining hall.
 */
export async function getMenus(date?: string, diningHall?: string) {
    let query = supabase.from('menus').select('*')

    if (date) {
        query = query.eq('menu_date', date)
    }
    if (diningHall) {
        query = query.eq('dining_hall', diningHall)
    }

    return await query
}

/**
 * Fetch a specific menu by ID, including all its entries and associated food details.
 */
export async function getMenuById(menuId: string) {
    return await supabase
        .from('menus')
        .select(`
      *,
      menu_entries (
        *,
        master_food_items (*)
      )
    `)
        .eq('id', menuId)
        .single()
}

/**
 * Fetch a menu by date and dining hall, including all entries and food details.
 */
export async function getMenuByDateAndHall(date: string, diningHall: string) {
    return await supabase
        .from('menus')
        .select(`
      *,
      menu_entries (
        *,
        master_food_items (*)
      )
    `)
        .eq('menu_date', date)
        .eq('dining_hall', diningHall)
        .maybeSingle()
}

/**
 * Fetch a full menu by date and dining hall with selective field fetching.
 * No caching - always fetches fresh data from Supabase.
 */
export async function getFullMenuByDateAndHall(date: string, diningHall: string) {
    const { data, error } = await supabase
        .from('menus')
        .select(`
            id,
            menu_date,
            dining_hall,
            menu_entries (
                meal_period,
                meal_station,
                recipe_number,
                master_food_items (
                    recipe_number,
                    food_name,
                    calories_kcal,
                    protein_g,
                    fat_g,
                    carbohydrates_g,
                    amount_per_serving
                )
            )
        `)
        .eq('menu_date', date)
        .eq('dining_hall', diningHall)
        .maybeSingle()

    if (error) throw error
    return data
}

/**
 * Fetch all food items.
 */
export async function getAllFoodItems() {
    return await supabase.from('master_food_items').select('*')
}

/**
 * Fetch unique available menu dates.
 * No caching - always fetches fresh data from Supabase.
 */
export async function getAvailableDates() {
    const { data, error } = await supabase
        .from('menus')
        .select('menu_date')
        .order('menu_date', { ascending: false })

    if (error) throw error
    return data
}
