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
