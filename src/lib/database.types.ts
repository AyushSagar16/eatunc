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
            profiles: {
                Row: {
                    id: string
                    email: string
                    daily_calories_target: number
                    daily_protein_target: number
                    daily_carbs_target: number
                    daily_fat_target: number
                    dietary_preferences: string[]
                    allergies: string[]
                    onboarding_completed: boolean
                    timezone: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    daily_calories_target?: number
                    daily_protein_target?: number
                    daily_carbs_target?: number
                    daily_fat_target?: number
                    dietary_preferences?: string[]
                    allergies?: string[]
                    onboarding_completed?: boolean
                    timezone?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    daily_calories_target?: number
                    daily_protein_target?: number
                    daily_carbs_target?: number
                    daily_fat_target?: number
                    dietary_preferences?: string[]
                    allergies?: string[]
                    onboarding_completed?: boolean
                    timezone?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            meal_logs: {
                Row: {
                    id: string
                    user_id: string
                    log_date: string
                    meal_type: string
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    log_date: string
                    meal_type: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    log_date?: string
                    meal_type?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "meal_logs_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            meal_log_items: {
                Row: {
                    id: string
                    meal_log_id: string
                    recipe_number: number
                    servings: number
                    food_name: string
                    calories_per_serving: number
                    protein_per_serving: number
                    carbs_per_serving: number
                    fat_per_serving: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    meal_log_id: string
                    recipe_number: number
                    servings?: number
                    food_name: string
                    calories_per_serving: number
                    protein_per_serving: number
                    carbs_per_serving: number
                    fat_per_serving: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    meal_log_id?: string
                    recipe_number?: number
                    servings?: number
                    food_name?: string
                    calories_per_serving?: number
                    protein_per_serving?: number
                    carbs_per_serving?: number
                    fat_per_serving?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "meal_log_items_meal_log_id_fkey"
                        columns: ["meal_log_id"]
                        referencedRelation: "meal_logs"
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
