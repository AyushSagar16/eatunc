import { cache } from 'react'
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
 * Fetch all food items.
 */
export async function getAllFoodItems() {
    return await supabase.from('master_food_items').select('*')
}

/**
 * Fetch all unique dates from the menus table.
 */
export const getAvailableDates = cache(async () => {
    return await supabase
        .from('menus')
        .select('menu_date')
        .order('menu_date', { ascending: false })
})

/**
 * Optimized: Fetch all menus for a date including entries and food items in one query.
 */
export const getFullMenusByDate = cache(async (date: string) => {
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
})
