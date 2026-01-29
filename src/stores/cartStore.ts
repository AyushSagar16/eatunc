/**
 * Cart Store
 * 
 * Zustand store for managing the meal cart with localStorage persistence.
 * Tracks food items, servings, and calculates running macro totals.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Individual cart item with macro information
 */
export interface CartItem {
    recipe_number: number
    food_name: string
    servings: number
    calories_per_serving: number
    protein_per_serving: number
    carbs_per_serving: number
    fat_per_serving: number
}

/**
 * Macro totals calculated from cart items
 */
export interface MacroTotals {
    calories: number
    protein: number
    carbs: number
    fat: number
}

/**
 * Cart store state and actions
 */
interface CartStore {
    // State
    items: CartItem[]
    isOpen: boolean

    // Actions
    addItem: (item: Omit<CartItem, 'servings'>) => void
    removeItem: (recipe_number: number) => void
    updateServings: (recipe_number: number, servings: number) => void
    incrementServings: (recipe_number: number) => void
    decrementServings: (recipe_number: number) => void
    clearCart: () => void
    setIsOpen: (open: boolean) => void
    toggleCart: () => void

    // Computed
    getTotals: () => MacroTotals
    getItemCount: () => number
    hasItem: (recipe_number: number) => boolean
    getItem: (recipe_number: number) => CartItem | undefined
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (item) => set((state) => {
                const existing = state.items.find(i => i.recipe_number === item.recipe_number)

                if (existing) {
                    // Increment servings of existing item
                    return {
                        items: state.items.map(i =>
                            i.recipe_number === item.recipe_number
                                ? { ...i, servings: i.servings + 1 }
                                : i
                        )
                    }
                }

                // Add new item with 1 serving
                return {
                    items: [...state.items, { ...item, servings: 1 }]
                }
            }),

            removeItem: (recipe_number) => set((state) => ({
                items: state.items.filter(i => i.recipe_number !== recipe_number)
            })),

            updateServings: (recipe_number, servings) => set((state) => {
                if (servings <= 0) {
                    // Remove item if servings drops to 0 or below
                    return {
                        items: state.items.filter(i => i.recipe_number !== recipe_number)
                    }
                }

                return {
                    items: state.items.map(i =>
                        i.recipe_number === recipe_number
                            ? { ...i, servings }
                            : i
                    )
                }
            }),

            incrementServings: (recipe_number) => set((state) => ({
                items: state.items.map(i =>
                    i.recipe_number === recipe_number
                        ? { ...i, servings: i.servings + 1 }
                        : i
                )
            })),

            decrementServings: (recipe_number) => set((state) => {
                const item = state.items.find(i => i.recipe_number === recipe_number)

                if (item && item.servings <= 1) {
                    // Remove item if this would make servings 0
                    return {
                        items: state.items.filter(i => i.recipe_number !== recipe_number)
                    }
                }

                return {
                    items: state.items.map(i =>
                        i.recipe_number === recipe_number
                            ? { ...i, servings: i.servings - 1 }
                            : i
                    )
                }
            }),

            clearCart: () => set({ items: [] }),

            setIsOpen: (open) => set({ isOpen: open }),

            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

            getTotals: () => {
                const { items } = get()
                return items.reduce(
                    (totals, item) => ({
                        calories: totals.calories + Math.round(item.calories_per_serving * item.servings),
                        protein: totals.protein + Math.round(item.protein_per_serving * item.servings * 10) / 10,
                        carbs: totals.carbs + Math.round(item.carbs_per_serving * item.servings * 10) / 10,
                        fat: totals.fat + Math.round(item.fat_per_serving * item.servings * 10) / 10,
                    }),
                    { calories: 0, protein: 0, carbs: 0, fat: 0 }
                )
            },

            getItemCount: () => {
                const { items } = get()
                return items.reduce((count, item) => count + item.servings, 0)
            },

            hasItem: (recipe_number) => {
                const { items } = get()
                return items.some(i => i.recipe_number === recipe_number)
            },

            getItem: (recipe_number) => {
                const { items } = get()
                return items.find(i => i.recipe_number === recipe_number)
            },
        }),
        {
            name: 'unc-dining-cart',
            storage: createJSONStorage(() => localStorage),
            // Only persist items, not UI state like isOpen
            partialize: (state) => ({ items: state.items }),
        }
    )
)

/**
 * Selector hooks for specific parts of the store
 */
export const useCartItems = () => useCartStore((state) => state.items)
export const useCartIsOpen = () => useCartStore((state) => state.isOpen)
export const useCartItemCount = () => useCartStore((state) => state.getItemCount())
export const useCartTotals = () => useCartStore((state) => state.getTotals())
