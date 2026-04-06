import type { MenuViewMode } from '@/lib/types'

export const DEFAULT_MENU_VIEW_MODE: MenuViewMode = 'compact'
export const MENU_VIEW_MODE_STORAGE_KEY = 'eatunc_menu_view_mode'

export function isMenuViewMode(value: string | null | undefined): value is MenuViewMode {
    return value === 'compact' || value === 'regular'
}

export function loadMenuViewMode(storage?: Storage | null): MenuViewMode {
    if (!storage) return DEFAULT_MENU_VIEW_MODE

    try {
        const savedValue = storage.getItem(MENU_VIEW_MODE_STORAGE_KEY)
        return isMenuViewMode(savedValue) ? savedValue : DEFAULT_MENU_VIEW_MODE
    } catch {
        return DEFAULT_MENU_VIEW_MODE
    }
}

export function saveMenuViewMode(mode: MenuViewMode, storage?: Storage | null) {
    if (!storage) return

    try {
        storage.setItem(MENU_VIEW_MODE_STORAGE_KEY, mode)
    } catch {
        console.warn('Could not save menu view mode to localStorage')
    }
}
