import { cache } from 'react'
import { unstable_cache } from 'next/cache'
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
 * Optimized: Cached version with Next.js unstable_cache for persistent caching.
 * Uses selective field fetching to reduce payload size.
 */
export const getFullMenuByDateAndHall = unstable_cache(
    async (date: string, diningHall: string) => {
        // Only select fields we actually use to reduce payload size
        return await supabase
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
    },
    ['menu-by-date-hall'],
    {
        revalidate: 3600, // Cache for 1 hour
        tags: ['menus']
    }
)

/**
 * Fetch all food items.
 */
export async function getAllFoodItems() {
    return await supabase.from('master_food_items').select('*')
}

/**
 * Optimized: Fetch unique dates with persistent caching.
 */
export const getAvailableDates = unstable_cache(
    async () => {
        return await supabase
            .from('menus')
            .select('menu_date')
            .order('menu_date', { ascending: false })
    },
    ['available-dates'],
    {
        revalidate: 1800, // Cache for 30 minutes
        tags: ['menus', 'dates']
    }
)

/**
 * Optimized: Fetch all menus for a date with field selection.
 */
export const getFullMenusByDate = cache(async (date: string) => {
    return await supabase
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
})
