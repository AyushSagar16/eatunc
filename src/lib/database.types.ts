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
                }
                Insert: {
                    id?: string
                    menu_date: string
                    dining_hall: string
                }
                Update: {
                    id?: string
                    menu_date?: string
                    dining_hall?: string
                }
                Relationships: []
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
            favorites: {
                Row: {
                    user_id: string
                    recipe_number: number
                    created_at: string
                }
                Insert: {
                    user_id: string
                    recipe_number: number
                    created_at?: string
                }
                Update: {
                    user_id?: string
                    recipe_number?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "favorites_recipe_number_fkey"
                        columns: ["recipe_number"]
                        referencedRelation: "master_food_items"
                        referencedColumns: ["recipe_number"]
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
