export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            master_food_items: {
                Row: {
                    recipe_number: number
                    food_name: string | null
                    calories_kcal: number | null
                    protein_g: number | null
                    carbohydrates_g: number | null
                    amount_per_serving: string | null
                    fat_g: number | null
                    dietary_preferences: string | null
                    allergens: string | null
                }
                Insert: {
                    recipe_number: number
                    food_name?: string | null
                    calories_kcal?: number | null
                    protein_g?: number | null
                    carbohydrates_g?: number | null
                    amount_per_serving?: string | null
                    fat_g?: number | null
                    dietary_preferences?: string | null
                    allergens?: string | null
                }
                Update: {
                    recipe_number?: number
                    food_name?: string | null
                    calories_kcal?: number | null
                    protein_g?: number | null
                    carbohydrates_g?: number | null
                    amount_per_serving?: string | null
                    fat_g?: number | null
                    dietary_preferences?: string | null
                    allergens?: string | null
                }
                Relationships: []
            }
            menus: {
                Row: {
                    id: string
                    menu_date: string
                    dining_hall: string
                    location_id: string | null
                }
                Insert: {
                    id?: string
                    menu_date: string
                    dining_hall: string
                    location_id?: string | null
                }
                Update: {
                    id?: string
                    menu_date?: string
                    dining_hall?: string
                    location_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "menus_location_id_fkey"
                        columns: ["location_id"]
                        referencedRelation: "locations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            menu_entries: {
                Row: {
                    menu_id: string
                    recipe_number: number
                    meal_period: string
                    meal_station: string
                }
                Insert: {
                    menu_id: string
                    recipe_number: number
                    meal_period: string
                    meal_station: string
                }
                Update: {
                    menu_id?: string
                    recipe_number?: number
                    meal_period?: string
                    meal_station?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "menu_entries_menu_id_fkey"
                        columns: ["menu_id"]
                        referencedRelation: "menus"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "menu_entries_recipe_number_fkey"
                        columns: ["recipe_number"]
                        referencedRelation: "master_food_items"
                        referencedColumns: ["recipe_number"]
                    }
                ]
            }
            locations: {
                Row: {
                    id: string
                    location_key: string
                    slug: string
                    name: string
                    venue_group: string
                    unc_slug: string | null
                    menu_url: string | null
                    external_url: string | null
                    brand_id: string | null
                    kind: string
                    has_menu: boolean
                    display_label: string
                    active: boolean
                    first_seen_at: string
                    last_seen_at: string
                }
                Insert: {
                    id?: string
                    location_key: string
                    slug: string
                    name: string
                    venue_group: string
                    unc_slug?: string | null
                    menu_url?: string | null
                    external_url?: string | null
                    brand_id?: string | null
                    kind: string
                    has_menu?: boolean
                    display_label: string
                    active?: boolean
                    first_seen_at?: string
                    last_seen_at?: string
                }
                Update: {
                    id?: string
                    location_key?: string
                    slug?: string
                    name?: string
                    venue_group?: string
                    unc_slug?: string | null
                    menu_url?: string | null
                    external_url?: string | null
                    brand_id?: string | null
                    kind?: string
                    has_menu?: boolean
                    display_label?: string
                    active?: boolean
                    first_seen_at?: string
                    last_seen_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "locations_brand_id_fkey"
                        columns: ["brand_id"]
                        referencedRelation: "external_brands"
                        referencedColumns: ["id"]
                    }
                ]
            }
            location_hours: {
                Row: {
                    id: string
                    location_id: string
                    service_date: string
                    period_name: string
                    sort_order: number
                    opens_at: string
                    closes_at: string
                    opens_label: string
                    closes_label: string
                    hours_revision: number
                    first_seen_at: string
                    changed_at: string
                    last_scraped_at: string
                }
                Insert: {
                    id?: string
                    location_id: string
                    service_date: string
                    period_name: string
                    sort_order?: number
                    opens_at: string
                    closes_at: string
                    opens_label: string
                    closes_label: string
                    hours_revision?: number
                    first_seen_at?: string
                    changed_at?: string
                    last_scraped_at?: string
                }
                Update: {
                    id?: string
                    location_id?: string
                    service_date?: string
                    period_name?: string
                    sort_order?: number
                    opens_at?: string
                    closes_at?: string
                    opens_label?: string
                    closes_label?: string
                    hours_revision?: number
                    first_seen_at?: string
                    changed_at?: string
                    last_scraped_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "location_hours_location_id_fkey"
                        columns: ["location_id"]
                        referencedRelation: "locations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            external_brands: {
                Row: {
                    id: string
                    slug: string
                    name: string
                    source_url: string
                    coverage_note: string
                    scraped_at: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    slug: string
                    name: string
                    source_url: string
                    coverage_note: string
                    scraped_at?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    name?: string
                    source_url?: string
                    coverage_note?: string
                    scraped_at?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            external_food_items: {
                Row: {
                    id: string
                    brand_id: string
                    item_name: string
                    category: string
                    serving_description: string
                    calories_kcal: number | null
                    protein_g: number | null
                    fat_g: number | null
                    carbohydrates_g: number | null
                    allergens: string | null
                    dietary_preferences: string | null
                    nutrition_source: string
                    nutrition_basis: string | null
                    item_key: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    brand_id: string
                    item_name: string
                    category: string
                    serving_description: string
                    calories_kcal?: number | null
                    protein_g?: number | null
                    fat_g?: number | null
                    carbohydrates_g?: number | null
                    allergens?: string | null
                    dietary_preferences?: string | null
                    nutrition_source: string
                    nutrition_basis?: string | null
                    item_key: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    brand_id?: string
                    item_name?: string
                    category?: string
                    serving_description?: string
                    calories_kcal?: number | null
                    protein_g?: number | null
                    fat_g?: number | null
                    carbohydrates_g?: number | null
                    allergens?: string | null
                    dietary_preferences?: string | null
                    nutrition_source?: string
                    nutrition_basis?: string | null
                    item_key?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "external_food_items_brand_id_fkey"
                        columns: ["brand_id"]
                        referencedRelation: "external_brands"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
