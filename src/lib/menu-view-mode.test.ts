import { beforeEach, describe, expect, it } from 'vitest'

import {
    DEFAULT_MENU_VIEW_MODE,
    MENU_VIEW_MODE_STORAGE_KEY,
    loadMenuViewMode,
    saveMenuViewMode,
} from '@/lib/menu-view-mode'

describe('menu view mode storage', () => {
    beforeEach(() => {
        window.localStorage.clear()
    })

    it('defaults to compact when nothing is stored', () => {
        expect(loadMenuViewMode(window.localStorage)).toBe(DEFAULT_MENU_VIEW_MODE)
    })

    it('loads a saved regular mode value', () => {
        window.localStorage.setItem(MENU_VIEW_MODE_STORAGE_KEY, 'regular')

        expect(loadMenuViewMode(window.localStorage)).toBe('regular')
    })

    it('falls back to compact for invalid stored values', () => {
        window.localStorage.setItem(MENU_VIEW_MODE_STORAGE_KEY, 'grid')

        expect(loadMenuViewMode(window.localStorage)).toBe(DEFAULT_MENU_VIEW_MODE)
    })

    it('saves the selected view mode', () => {
        saveMenuViewMode('regular', window.localStorage)

        expect(window.localStorage.getItem(MENU_VIEW_MODE_STORAGE_KEY)).toBe('regular')
    })
})
