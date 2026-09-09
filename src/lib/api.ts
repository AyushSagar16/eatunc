import { supabase } from './supabase'
import { HALL_DINING_NAMES } from './campus'
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

/** Supabase truncates any single result at exactly this many rows, and reports no error. */
const PAGE_SIZE = 1000

/**
 * One serving on a menu: where and when it is served, and nothing about the food itself.
 *
 * The food is looked up in `FoodsByRecipe` instead of being repeated on every row. A hall
 * serves the same recipe at six meal periods, so the nutrition used to be serialised six
 * times — Chase publishes 1,405 entries drawn from 307 distinct recipes.
 */
export type MenuEntryRef = {
    meal_period: string
    meal_station: string | null
    recipe_number: number
}

/**
 * `recipe_number` -> the food, resolved once per menu rather than once per serving.
 *
 * Partial because a lookup can miss: a recipe UNC has not ingested yet has no
 * `master_food_items` row, which is the same gap the nested join used to report as a null
 * `master_food_items` on the entry. Every consumer must keep dropping those entries.
 */
export type FoodsByRecipe = Partial<Record<number, MasterFoodItem>>

/** A hall's whole day, normalised: the servings, and the foods they point at. */
export type FullDayMenu = {
    id: string
    menu_date: string
    dining_hall: string
    entries: MenuEntryRef[]
    foods: FoodsByRecipe
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

/** The columns every menu surface renders — which is every column `master_food_items` has. */
const FOOD_COLUMNS = `
    recipe_number,
    food_name,
    calories_kcal,
    protein_g,
    fat_g,
    carbohydrates_g,
    amount_per_serving,
    dietary_preferences,
    allergens
`

/**
 * Read every row a query matches, one page at a time.
 *
 * Two details are load-bearing. The offset is the number of rows already held rather than a
 * multiple of `PAGE_SIZE`, and the end comes from PostgREST's own `count` rather than from a
 * page arriving short. If the project's `db.max_rows` were ever lowered below `PAGE_SIZE`,
 * striding by `PAGE_SIZE` would skip rows and a short-page test would mistake the first page
 * for the last — silently truncating a hall's menu, which is the exact failure this function
 * exists to avoid.
 */
async function fetchAllRows<T>(
    page: (from: number, to: number) => PromiseLike<{
        data: T[] | null
        error: unknown
        count: number | null
    }>,
): Promise<T[]> {
    const all: T[] = []
    let total = Infinity

    while (all.length < total) {
        const { data, error, count } = await page(all.length, all.length + PAGE_SIZE - 1)
        if (error) throw error
        if (count !== null) total = count
        // Never trusted to end the loop — only to stop it spinning if a page comes back empty
        // while `count` still claims there is more.
        if (!data?.length) break
        all.push(...data)
    }

    return all
}

/**
 * Every serving on a menu, paginated flat because a nested select cannot page past the cap.
 *
 * The `.order()` is not cosmetic. Postgres makes no promise about row order between two
 * `LIMIT/OFFSET` queries, so paginating without one can repeat a row on page two and drop
 * another entirely. `(recipe_number, meal_period, meal_station)` is the rest of the composite
 * primary key once `menu_id` is fixed, so it is unique and therefore a total order.
 */
function fetchMenuEntries(menuId: string): Promise<MenuEntryRef[]> {
    return fetchAllRows((from, to) =>
        supabase
            .from('menu_entries')
            .select('meal_period, meal_station, recipe_number', { count: 'exact' })
            .eq('menu_id', menuId)
            .order('recipe_number', { ascending: true })
            .order('meal_period', { ascending: true })
            .order('meal_station', { ascending: true })
            .range(from, to),
    )
}

/**
 * The distinct foods a menu points at, keyed by recipe number.
 *
 * `menu_entries!inner()` is a join used purely as a filter — the empty parentheses select no
 * columns from it, so this returns one row per *food*, not one per serving. That is what makes
 * it independent of the entry query above and safe to run alongside it: both need only the
 * menu id. Fetching the foods through the entries instead would mean waiting for them first
 * and then sending 300-odd recipe numbers back up as a query string.
 */
async function fetchMenuFoods(menuId: string): Promise<FoodsByRecipe> {
    const rows = await fetchAllRows((from, to) =>
        supabase
            .from('master_food_items')
            .select(`${FOOD_COLUMNS}, menu_entries!inner()`, { count: 'exact' })
            .eq('menu_entries.menu_id', menuId)
            .order('recipe_number', { ascending: true })
            .range(from, to),
    )

    const foods: FoodsByRecipe = {}
    for (const food of rows) foods[food.recipe_number] = food
    return foods
}

/**
 * A hall's full day. No caching - always fetches fresh data from Supabase.
 *
 * Three queries rather than one nested select, because the nested form cannot survive this
 * data. Supabase caps a nested relation at exactly 1000 rows and reports no error, and Chase
 * publishes ~1,405 entries a day: the old code fetched all 1000 of them *with* their nutrition,
 * noticed the cap, threw the whole 368KB result away and re-fetched everything by hand. Asking
 * for the entries and the foods separately drops the round trip that was always discarded and
 * stops the nutrition being repeated once per serving — ~880KB of JSON parsed per render
 * becomes ~200KB, and the entries and foods queries run at the same time.
 */
export async function getFullMenuByDateAndHall(
    date: string,
    diningHall: string,
): Promise<FullDayMenu | null> {
    const startTime = performance.now()
    const { data: menu, error } = await supabase
        .from('menus')
        .select('id, menu_date, dining_hall')
        .eq('menu_date', date)
        .eq('dining_hall', diningHall)
        .maybeSingle()

    if (error) throw error
    if (!menu) return null

    const [entries, foods] = await Promise.all([
        fetchMenuEntries(menu.id),
        fetchMenuFoods(menu.id),
    ])

    if (process.env.NODE_ENV === 'development') {
        const duration = Math.round(performance.now() - startTime)
        const orphans = entries.filter((entry) => !foods[entry.recipe_number])
        console.log(
            `[API] ${diningHall} ${date}: ${entries.length} entries, ` +
                `${Object.keys(foods).length} distinct foods in ${duration}ms`,
        )
        if (orphans.length > 0) {
            console.warn(
                `[API] ${orphans.length} entries reference a recipe with no master_food_items row:`,
                orphans.map((entry) => entry.recipe_number),
            )
        }
    }

    return {
        id: menu.id,
        menu_date: menu.menu_date,
        dining_hall: menu.dining_hall,
        entries,
        foods,
    }
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
 *
 * Filtered to the two dining halls: `menus` also holds a row per satellite venue per day,
 * and without the filter every caller (the hall date strip, the /[hall] redirect resolver,
 * the sitemap's dated URLs) would treat a date only a satellite venue serves as a date the
 * halls have a menu.
 */
export async function getAvailableDates() {
    const { data, error } = await supabase
        .from('menus')
        .select('menu_date')
        .in('dining_hall', HALL_DINING_NAMES)
        .order('menu_date', { ascending: false })

    if (error) throw error
    return data
}
