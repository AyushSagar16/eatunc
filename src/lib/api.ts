import { supabase } from './supabase'
import { Database } from './database.types'

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
    const startTime = performance.now()

    // IMPORTANT: Supabase has a default limit of 1000 rows for nested relations.
    // We need to explicitly set a higher limit to fetch all menu entries.
    // The menu_entries!inner syntax with limit ensures we get all items.
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
                    amount_per_serving,
                    dietary_preferences,
                    allergens
                )
            )
        `)
        .eq('menu_date', date)
        .eq('dining_hall', diningHall)
        .maybeSingle()

    // If we hit the 1000 row limit, fetch menu_entries using pagination
    // Supabase enforces a max of 1000 rows per query, so we must paginate
    if (data && data.menu_entries?.length === 1000) {
        console.warn('[API] Hit 1000 row limit on menu_entries, fetching all entries with pagination...')

        const allEntries: typeof data.menu_entries = []
        const PAGE_SIZE = 1000
        let offset = 0
        let hasMore = true

        while (hasMore) {
            const { data: pageData, error: pageError } = await supabase
                .from('menu_entries')
                .select(`
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
                        amount_per_serving,
                        dietary_preferences,
                        allergens
                    )
                `)
                .eq('menu_id', data.id)
                .range(offset, offset + PAGE_SIZE - 1)

            if (pageError) {
                console.error('[API] Error fetching page:', pageError)
                break
            }

            if (pageData && pageData.length > 0) {
                allEntries.push(...pageData)
                offset += PAGE_SIZE
                hasMore = pageData.length === PAGE_SIZE
                console.log(`[API] Fetched page: ${allEntries.length} total entries so far`)
            } else {
                hasMore = false
            }
        }

        data.menu_entries = allEntries
        console.log(`[API] Pagination complete: ${allEntries.length} total entries`)
    }

    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)

    if (process.env.NODE_ENV === 'development') {
        console.log(`[API] Fetched menu for ${diningHall} on ${date} in ${duration}ms`)
        console.log(`[API] Total menu_entries returned:`, data?.menu_entries?.length || 0)

        // Log any entries with null master_food_items
        const nullItems = data?.menu_entries?.filter(e => !e.master_food_items) || []
        if (nullItems.length > 0) {
            console.warn(`[API] ${nullItems.length} entries have null master_food_items:`,
                nullItems.map(e => ({ recipe_number: e.recipe_number, station: e.meal_station, period: e.meal_period })))
        }

        // Log recipe numbers by station for each period
        const byPeriodAndStation: Record<string, Record<string, number[]>> = {}
        data?.menu_entries?.forEach(e => {
            const period = e.meal_period || 'Unknown'
            const station = e.meal_station || 'Unknown'
            if (!byPeriodAndStation[period]) byPeriodAndStation[period] = {}
            if (!byPeriodAndStation[period][station]) byPeriodAndStation[period][station] = []
            byPeriodAndStation[period][station].push(e.recipe_number)
        })
        console.log('[API] Recipe numbers by period and station:', byPeriodAndStation)
    }

    if (error) throw error
    return data
}

/**
 * Fetch favorite food items for a user.
 */
export async function getFavorites(userId: string) {
    const { data, error } = await (supabase as any)
        .from('favorites')
        .select(`
            recipe_number,
            master_food_items (*)
        `)
        .eq('user_id', userId)

    if (error) throw error
    return data as { recipe_number: number, master_food_items: MasterFoodItem }[]
}

/**
 * Add a food item to favorites.
 */
export async function addFavorite(userId: string, recipeNumber: number) {
    const { data, error } = await (supabase as any)
        .from('favorites')
        .insert({
            user_id: userId,
            recipe_number: recipeNumber
        })

    if (error) throw error
    return data
}

/**
 * Remove a food item from favorites.
 */
export async function removeFavorite(userId: string, recipeNumber: number) {
    const { data, error } = await (supabase as any)
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_number', recipeNumber)

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
