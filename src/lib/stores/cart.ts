import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItemSource = 'menu' | 'custom'

export interface CartItem {
  cart_id: string
  source: CartItemSource
  recipe_number: number | null
  custom_food_id: string | null
  food_name: string
  calories_kcal: number
  protein_g: number
  fat_g: number
  carbohydrates_g: number
  fiber_g: number | null
  sodium_mg: number | null
  amount_per_serving: string | null
  servings: number
  dining_hall: string | null
  added_at: string
}

export type CartContext = {
  date: string
  meal_period: string
  dining_hall: string | null
}

interface CartTotals {
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number | null
  sodium: number | null
}

interface CartState {
  date: string | null
  meal_period: string | null
  dining_hall: string | null
  items: CartItem[]
  isOpen: boolean
  pendingItem: { item: Omit<CartItem, 'cart_id' | 'added_at'>; context: CartContext } | null

  setOpen: (open: boolean) => void
  toggleOpen: () => void

  add: (
    item: Omit<CartItem, 'cart_id' | 'added_at' | 'servings'> & { servings?: number },
    context: CartContext,
  ) => { ok: true } | { ok: false; reason: 'context-mismatch' }

  forceReplaceContext: () => void
  cancelPending: () => void

  remove: (cart_id: string) => void
  setServings: (cart_id: string, servings: number) => void
  setMealPeriod: (period: string) => void
  setDate: (date: string) => void
  clear: () => void

  totals: () => CartTotals
}

const STORAGE_KEY = 'eatunc_cart_v1'

function genCartId(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

function sameContext(state: CartState, ctx: CartContext): boolean {
  if (state.items.length === 0) return true
  return state.date === ctx.date && state.meal_period === ctx.meal_period
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      date: null,
      meal_period: null,
      dining_hall: null,
      items: [],
      isOpen: false,
      pendingItem: null,

      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),

      add: (item, context) => {
        const state = get()
        if (!sameContext(state, context)) {
          set({
            pendingItem: {
              item: { ...item, servings: item.servings ?? 1 },
              context,
            },
          })
          return { ok: false, reason: 'context-mismatch' }
        }
        const cart_id = genCartId()
        const newItem: CartItem = {
          ...item,
          cart_id,
          servings: item.servings ?? 1,
          added_at: nowIso(),
        }
        set({
          date: context.date,
          meal_period: context.meal_period,
          dining_hall: context.dining_hall,
          items: [...state.items, newItem],
          isOpen: true,
        })
        return { ok: true }
      },

      forceReplaceContext: () => {
        const pending = get().pendingItem
        if (!pending) return
        const cart_id = genCartId()
        const newItem: CartItem = {
          ...pending.item,
          cart_id,
          servings: pending.item.servings ?? 1,
          added_at: nowIso(),
        }
        set({
          date: pending.context.date,
          meal_period: pending.context.meal_period,
          dining_hall: pending.context.dining_hall,
          items: [newItem],
          pendingItem: null,
          isOpen: true,
        })
      },

      cancelPending: () => set({ pendingItem: null }),

      remove: (cart_id) =>
        set((s) => {
          const items = s.items.filter((i) => i.cart_id !== cart_id)
          if (items.length === 0) {
            return { items, date: null, meal_period: null, dining_hall: null }
          }
          return { items }
        }),

      setServings: (cart_id, servings) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.cart_id === cart_id ? { ...i, servings: Math.max(0.25, servings) } : i,
          ),
        })),

      setMealPeriod: (period) => set({ meal_period: period }),
      setDate: (date) => set({ date }),

      clear: () =>
        set({
          items: [],
          date: null,
          meal_period: null,
          dining_hall: null,
          pendingItem: null,
        }),

      totals: () => {
        const { items } = get()
        let calories = 0
        let protein = 0
        let fat = 0
        let carbs = 0
        let fiber = 0
        let sodium = 0
        let hasFiber = false
        let hasSodium = false
        for (const i of items) {
          const s = i.servings || 1
          calories += (i.calories_kcal || 0) * s
          protein += (i.protein_g || 0) * s
          fat += (i.fat_g || 0) * s
          carbs += (i.carbohydrates_g || 0) * s
          if (i.fiber_g != null) {
            fiber += i.fiber_g * s
            hasFiber = true
          }
          if (i.sodium_mg != null) {
            sodium += i.sodium_mg * s
            hasSodium = true
          }
        }
        return {
          calories,
          protein,
          fat,
          carbs,
          fiber: hasFiber ? fiber : null,
          sodium: hasSodium ? sodium : null,
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        date: state.date,
        meal_period: state.meal_period,
        dining_hall: state.dining_hall,
        items: state.items,
      }),
    },
  ),
)
