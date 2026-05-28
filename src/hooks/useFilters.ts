'use client'

import { useEffect, useReducer } from 'react'
import type { FilterOption, DietaryPreferenceOption, AllergenOption } from '@/lib/types'

const FILTERS_STORAGE_KEY = 'eatunc_active_filters'
const VALID_FILTERS: FilterOption[] = ['protein', 'calories', 'fat', 'carbs']
const DIETARY_PREFS_STORAGE_KEY = 'eatunc_dietary_prefs'
const VALID_DIETARY_PREFS: DietaryPreferenceOption[] = [
    'vegan', 'vegetarian', 'gluten-free', 'halal', 'local',
    'organic', 'smart-choice', 'sustainable-seafood', 'coolfood'
]
const ALLERGENS_STORAGE_KEY = 'eatunc_allergens'
const VALID_ALLERGENS: AllergenOption[] = [
    'milk', 'egg', 'fish', 'shellfish', 'tree nuts',
    'peanut', 'wheat', 'soy', 'sesame'
]

function readStored<T>(key: string, valid: readonly T[]): T[] {
    try {
        if (typeof window === 'undefined') return []
        const saved = localStorage.getItem(key)
        if (!saved) return []
        const parsed = JSON.parse(saved)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((f): f is T => (valid as readonly unknown[]).includes(f))
    } catch {
        return []
    }
}

function writeStored<T>(key: string, values: T[]) {
    try {
        if (typeof window === 'undefined') return
        localStorage.setItem(key, JSON.stringify(values))
    } catch {
        // localStorage unavailable (e.g., Safari private mode)
        console.warn(`Could not save ${key} to localStorage`)
    }
}

interface FiltersState {
    macro: FilterOption[]
    dietary: DietaryPreferenceOption[]
    allergens: AllergenOption[]
}

type FiltersAction =
    | { type: 'load'; state: FiltersState }
    | { type: 'setMacro'; value: FilterOption[] }
    | { type: 'setDietary'; value: DietaryPreferenceOption[] }
    | { type: 'setAllergens'; value: AllergenOption[] }
    | { type: 'clear' }

const EMPTY_FILTERS: FiltersState = { macro: [], dietary: [], allergens: [] }

function filtersReducer(state: FiltersState, action: FiltersAction): FiltersState {
    switch (action.type) {
        case 'load': return action.state
        case 'setMacro': return { ...state, macro: action.value }
        case 'setDietary': return { ...state, dietary: action.value }
        case 'setAllergens': return { ...state, allergens: action.value }
        case 'clear': return EMPTY_FILTERS
        default: return state
    }
}

type ToggleType = 'macro' | 'dietary_preference' | 'allergen'

interface UseFiltersOptions {
    onToggle?: (type: ToggleType, name: string, action: 'added' | 'removed') => void
    onClear?: (counts: { macro: number; dietary: number; allergens: number }) => void
}

/**
 * Manages the persisted macro / dietary / allergen filter selections.
 * State lives in a reducer; every change is mirrored to localStorage from the
 * handler that made it (no save-on-change effect), and restored once on mount.
 */
export function useFilters({ onToggle, onClear }: UseFiltersOptions = {}) {
    const [filters, dispatch] = useReducer(filtersReducer, EMPTY_FILTERS)

    // Restore persisted selections on mount (client-only).
    useEffect(() => {
        dispatch({
            type: 'load',
            state: {
                macro: readStored(FILTERS_STORAGE_KEY, VALID_FILTERS),
                dietary: readStored(DIETARY_PREFS_STORAGE_KEY, VALID_DIETARY_PREFS),
                allergens: readStored(ALLERGENS_STORAGE_KEY, VALID_ALLERGENS),
            },
        })
    }, [])

    const toggleFilter = (filter: FilterOption) => {
        const isAdding = !filters.macro.includes(filter)
        onToggle?.('macro', filter, isAdding ? 'added' : 'removed')
        const next = isAdding ? [...filters.macro, filter] : filters.macro.filter(f => f !== filter)
        writeStored(FILTERS_STORAGE_KEY, next)
        dispatch({ type: 'setMacro', value: next })
    }

    const toggleDietaryPreference = (pref: DietaryPreferenceOption) => {
        const isAdding = !filters.dietary.includes(pref)
        onToggle?.('dietary_preference', pref, isAdding ? 'added' : 'removed')
        const next = isAdding ? [...filters.dietary, pref] : filters.dietary.filter(p => p !== pref)
        writeStored(DIETARY_PREFS_STORAGE_KEY, next)
        dispatch({ type: 'setDietary', value: next })
    }

    const toggleAllergen = (allergen: AllergenOption) => {
        const isAdding = !filters.allergens.includes(allergen)
        onToggle?.('allergen', allergen, isAdding ? 'added' : 'removed')
        const next = isAdding ? [...filters.allergens, allergen] : filters.allergens.filter(a => a !== allergen)
        writeStored(ALLERGENS_STORAGE_KEY, next)
        dispatch({ type: 'setAllergens', value: next })
    }

    const clearMacroFilters = () => {
        filters.macro.forEach(f => onToggle?.('macro', f, 'removed'))
        writeStored(FILTERS_STORAGE_KEY, [])
        dispatch({ type: 'setMacro', value: [] })
    }

    const clearAllFilters = () => {
        onClear?.({ macro: filters.macro.length, dietary: filters.dietary.length, allergens: filters.allergens.length })
        dispatch({ type: 'clear' })
        try {
            localStorage.removeItem(FILTERS_STORAGE_KEY)
            localStorage.removeItem(DIETARY_PREFS_STORAGE_KEY)
            localStorage.removeItem(ALLERGENS_STORAGE_KEY)
        } catch {
            // Ignore errors
        }
    }

    return {
        activeFilters: filters.macro,
        activeDietaryPreferences: filters.dietary,
        activeAllergens: filters.allergens,
        toggleFilter,
        toggleDietaryPreference,
        toggleAllergen,
        clearMacroFilters,
        clearAllFilters,
    }
}
