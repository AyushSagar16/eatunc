'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Filter, X, Check, Trash2, ChevronDown } from 'lucide-react'
import type { FilterOption, DietaryPreferenceOption, AllergenOption } from '@/lib/types'
import {
    VeganIcon,
    VegetarianIcon,
    GlutenFreeIcon,
    HalalIcon,
    LocalIcon,
    OrganicIcon,
    SmartChoiceIcon,
    SustainableSeafoodIcon,
    CoolfoodIcon,
} from '@/components/icons/DietaryIcons'
import { useSearchParams } from 'next/navigation'

interface FilterSidebarProps {
    activeFilters: FilterOption[]
    onToggleFilter: (filter: FilterOption) => void
    onClearAll: () => void
    className?: string
    // Dietary preferences
    activeDietaryPreferences: DietaryPreferenceOption[]
    onToggleDietaryPreference: (pref: DietaryPreferenceOption) => void
    // Allergens
    activeAllergens: AllergenOption[]
    onToggleAllergen: (allergen: AllergenOption) => void
}

interface MacroFilterItem {
    id: FilterOption
    label: string
    description: string
    icon: React.ReactNode
}

interface DietaryPreferenceItem {
    id: DietaryPreferenceOption
    label: string
    icon: React.ComponentType<{ className?: string }>
}

interface AllergenItem {
    id: AllergenOption
    label: string
}

const macroFilters: MacroFilterItem[] = [
    {
        id: 'protein',
        label: 'High Protein',
        description: '20g+ protein per serving',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
            </svg>
        ),
    },
    {
        id: 'calories',
        label: 'Low Calorie',
        description: 'Under 350 kcal',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
    },
    {
        id: 'fat',
        label: 'Low Fat',
        description: 'Under 8g fat',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
            </svg>
        ),
    },
    {
        id: 'carbs',
        label: 'Low Carbohydrate',
        description: 'Under 15g carbs',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v18M3 12h18" />
                <circle cx="12" cy="12" r="9" />
            </svg>
        ),
    },
]

const dietaryPreferences: DietaryPreferenceItem[] = [
    { id: 'vegan', label: 'Vegan', icon: VeganIcon },
    { id: 'vegetarian', label: 'Vegetarian', icon: VegetarianIcon },
    { id: 'gluten-free', label: 'Made Without Gluten', icon: GlutenFreeIcon },
    { id: 'halal', label: 'Halal', icon: HalalIcon },
    { id: 'local', label: 'Local', icon: LocalIcon },
    { id: 'organic', label: 'Organic', icon: OrganicIcon },
    { id: 'smart-choice', label: 'Smart Choice', icon: SmartChoiceIcon },
    { id: 'sustainable-seafood', label: 'Sustainable Seafood', icon: SustainableSeafoodIcon },
    { id: 'coolfood', label: 'Coolfood', icon: CoolfoodIcon },
]

const allergens: AllergenItem[] = [
    { id: 'milk', label: 'Milk' },
    { id: 'eggs', label: 'Eggs' },
    { id: 'fish', label: 'Fish' },
    { id: 'shellfish', label: 'Shellfish' },
    { id: 'tree nuts', label: 'Tree Nuts' },
    { id: 'peanuts', label: 'Peanuts' },
    { id: 'wheat', label: 'Wheat' },
    { id: 'soy', label: 'Soy' },
    { id: 'sesame', label: 'Sesame' },
]

/**
 * FilterSidebar - Collapsible filter panel with Aceternity-style animations
 * - Desktop: Collapsible sidebar on hover
 * - Mobile: Bottom drawer overlay
 * - Multi-select toggle filters
 * - Active filter count badge
 * - Clear All button
 */
export default function FilterSidebar({
    activeFilters,
    onToggleFilter,
    onClearAll,
    className,
    activeDietaryPreferences,
    onToggleDietaryPreference,
    activeAllergens,
    onToggleAllergen,
}: FilterSidebarProps) {
    const searchParams = useSearchParams()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [announcement, setAnnouncement] = useState('')

    // Auto-open filter modal if openFilter=true query param is present
    useEffect(() => {
        if (searchParams.get('openFilter') === 'true') {
            setIsModalOpen(true)
        }
    }, [searchParams])

    // ========================================
    // COLLAPSIBLE SECTIONS (localStorage)
    // ========================================
    const SECTION_COLLAPSED_KEY = 'eatunc_filter_sections_collapsed'

    type SectionKey = 'macro' | 'dietary' | 'allergens'

    const loadCollapsedFromStorage = useCallback((): Record<SectionKey, boolean> => {
        try {
            if (typeof window === 'undefined') return { macro: false, dietary: false, allergens: false }
            const saved = localStorage.getItem(SECTION_COLLAPSED_KEY)
            if (!saved) return { macro: false, dietary: false, allergens: false }
            const parsed = JSON.parse(saved)
            return {
                macro: Boolean(parsed.macro),
                dietary: Boolean(parsed.dietary),
                allergens: Boolean(parsed.allergens),
            }
        } catch {
            return { macro: false, dietary: false, allergens: false }
        }
    }, [])

    const saveCollapsedToStorage = useCallback((collapsed: Record<SectionKey, boolean>) => {
        try {
            if (typeof window === 'undefined') return
            localStorage.setItem(SECTION_COLLAPSED_KEY, JSON.stringify(collapsed))
        } catch {
            console.warn('Could not save section collapsed state to localStorage')
        }
    }, [])

    // All sections open by default (false = not collapsed)
    const [collapsedSections, setCollapsedSections] = useState<Record<SectionKey, boolean>>({
        macro: false,
        dietary: false,
        allergens: false,
    })

    // Load collapsed state from localStorage on mount
    useEffect(() => {
        const savedCollapsed = loadCollapsedFromStorage()
        setCollapsedSections(savedCollapsed)
    }, [loadCollapsedFromStorage])

    // Save when collapsed state changes
    const toggleSection = (section: SectionKey) => {
        setCollapsedSections(prev => {
            const newState = { ...prev, [section]: !prev[section] }
            saveCollapsedToStorage(newState)
            return newState
        })
    }

    // Total count of all active filters
    const activeCount = activeFilters.length + activeDietaryPreferences.length + activeAllergens.length

    // Announce filter changes to screen readers
    const announceFilterChange = (filterLabel: string, isActive: boolean) => {
        setAnnouncement(`${filterLabel} filter ${isActive ? 'removed' : 'applied'}`)
        // Clear after announcement
        setTimeout(() => setAnnouncement(''), 1000)
    }

    const handleToggleMacroFilter = (filter: MacroFilterItem) => {
        const isActive = activeFilters.includes(filter.id)
        announceFilterChange(filter.label, isActive)
        onToggleFilter(filter.id)
    }

    const handleToggleDietaryPreference = (pref: DietaryPreferenceItem) => {
        const isActive = activeDietaryPreferences.includes(pref.id)
        announceFilterChange(pref.label, isActive)
        onToggleDietaryPreference(pref.id)
    }

    const handleToggleAllergen = (allergen: AllergenItem) => {
        const isActive = activeAllergens.includes(allergen.id)
        announceFilterChange(allergen.label, isActive)
        onToggleAllergen(allergen.id)
    }

    const handleClearAll = () => {
        setAnnouncement('All filters cleared')
        setTimeout(() => setAnnouncement(''), 1000)
        onClearAll()
    }

    return (
        <>
            {/* Screen reader announcements */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {announcement}
            </div>

            {/* Floating Filter Button - Visible on all screen sizes */}
            <motion.button
                data-tutorial-target="filter-button"
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Open filters"
                className="fixed bottom-6 right-6 z-50 w-14 h-14 min-w-[56px] min-h-[56px] bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 transition-all touch-manipulation"
            >
                <Filter className="w-6 h-6" />
                {activeCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-white text-blue-600 text-xs font-bold rounded-full flex items-center justify-center border-2 border-blue-600"
                    >
                        {activeCount}
                    </motion.div>
                )}
            </motion.button>

            {/* Right-Side Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        />

                        {/* Right-Side Modal Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-96 sm:max-w-md bg-white dark:bg-zinc-900 z-[101] overflow-auto shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                        <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-xl text-zinc-900 dark:text-zinc-100">
                                            Filters
                                        </h2>
                                        {activeCount > 0 && (
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {activeCount} active filter{activeCount !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="min-h-[44px] min-w-[44px] p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 rounded-xl transition-colors touch-manipulation"
                                    aria-label="Close filters"
                                >
                                    <X className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                                </button>
                            </div>

                            {/* Filter Sections */}
                            <div className="p-6 flex flex-col gap-4">
                                {/* Section 1: Macro Filters */}
                                <section>
                                    <button
                                        onClick={() => toggleSection('macro')}
                                        className="w-full flex items-center justify-between py-2 group"
                                        aria-expanded={!collapsedSections.macro}
                                    >
                                        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                                            Macro Filters
                                        </h3>
                                        <motion.div
                                            animate={{ rotate: collapsedSections.macro ? -90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-zinc-400 dark:text-zinc-500"
                                        >
                                            <ChevronDown className="w-5 h-5" />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {!collapsedSections.macro && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    {macroFilters.map((filter) => {
                                                        const isActive = activeFilters.includes(filter.id)
                                                        return (
                                                            <motion.button
                                                                key={filter.id}
                                                                onClick={() => handleToggleMacroFilter(filter)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault()
                                                                        handleToggleMacroFilter(filter)
                                                                    }
                                                                }}
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                role="checkbox"
                                                                aria-checked={isActive}
                                                                aria-label={`${filter.label}: ${filter.description}${isActive ? ', currently selected' : ''}`}
                                                                tabIndex={0}
                                                                className={cn(
                                                                    'flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all min-h-[80px]',
                                                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                                                                    isActive
                                                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500 dark:border-blue-600'
                                                                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700'
                                                                )}
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                                                                        isActive
                                                                            ? 'bg-blue-100 dark:bg-blue-800'
                                                                            : 'bg-zinc-100 dark:bg-zinc-700'
                                                                    )}
                                                                >
                                                                    {isActive ? (
                                                                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                                                    ) : (
                                                                        <span className="text-zinc-500 dark:text-zinc-400 [&>svg]:w-4 [&>svg]:h-4">
                                                                            {filter.icon}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-bold text-center leading-tight">{filter.label}</span>
                                                            </motion.button>
                                                        )
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>

                                {/* Divider */}
                                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                                {/* Section 2: Dietary Preferences */}
                                <section>
                                    <button
                                        onClick={() => toggleSection('dietary')}
                                        className="w-full flex items-center justify-between py-2 group"
                                        aria-expanded={!collapsedSections.dietary}
                                    >
                                        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                                            Dietary Preferences
                                        </h3>
                                        <motion.div
                                            animate={{ rotate: collapsedSections.dietary ? -90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-zinc-400 dark:text-zinc-500"
                                        >
                                            <ChevronDown className="w-5 h-5" />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {!collapsedSections.dietary && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="grid grid-cols-3 gap-2 pt-2">
                                                    {dietaryPreferences.map((pref) => {
                                                        const isActive = activeDietaryPreferences.includes(pref.id)
                                                        const IconComponent = pref.icon
                                                        return (
                                                            <motion.button
                                                                key={pref.id}
                                                                onClick={() => handleToggleDietaryPreference(pref)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault()
                                                                        handleToggleDietaryPreference(pref)
                                                                    }
                                                                }}
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                role="checkbox"
                                                                aria-checked={isActive}
                                                                aria-label={`${pref.label}${isActive ? ', currently selected' : ''}`}
                                                                tabIndex={0}
                                                                className={cn(
                                                                    'flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all min-h-[72px]',
                                                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
                                                                    isActive
                                                                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500 dark:border-emerald-600'
                                                                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700'
                                                                )}
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                                                                        isActive
                                                                            ? 'bg-emerald-100 dark:bg-emerald-800'
                                                                            : 'bg-white dark:bg-zinc-700'
                                                                    )}
                                                                >
                                                                    {isActive ? (
                                                                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                                                                    ) : (
                                                                        <IconComponent className="w-5 h-5" />
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">{pref.label}</span>
                                                            </motion.button>
                                                        )
                                                    })}
                                                </div>
                                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pt-2">
                                                    Items matching selected preferences will be highlighted in green.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>

                                {/* Divider */}
                                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                                {/* Section 3: Allergen Filters */}
                                <section>
                                    <button
                                        onClick={() => toggleSection('allergens')}
                                        className="w-full flex items-center justify-between py-2 group"
                                        aria-expanded={!collapsedSections.allergens}
                                    >
                                        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                                            Avoid Allergens
                                        </h3>
                                        <motion.div
                                            animate={{ rotate: collapsedSections.allergens ? -90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-zinc-400 dark:text-zinc-500"
                                        >
                                            <ChevronDown className="w-5 h-5" />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {!collapsedSections.allergens && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pt-1 pb-2">
                                                    Items with selected allergens will appear grayed out. These filters do not guarantee complete accuracy—please verify in person.
                                                </p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {allergens.map((allergen) => {
                                                        const isActive = activeAllergens.includes(allergen.id)
                                                        return (
                                                            <motion.button
                                                                key={allergen.id}
                                                                onClick={() => handleToggleAllergen(allergen)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault()
                                                                        handleToggleAllergen(allergen)
                                                                    }
                                                                }}
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                role="checkbox"
                                                                aria-checked={isActive}
                                                                aria-label={`Avoid ${allergen.label}${isActive ? ', currently selected' : ''}`}
                                                                tabIndex={0}
                                                                className={cn(
                                                                    'flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all min-h-[56px]',
                                                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                                                                    isActive
                                                                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-2 border-amber-500 dark:border-amber-600'
                                                                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700'
                                                                )}
                                                            >
                                                                {isActive && (
                                                                    <Check className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                                                                )}
                                                                <span className="text-xs font-bold text-center leading-tight">{allergen.label}</span>
                                                            </motion.button>
                                                        )
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>
                            </div>


                            {/* Footer Actions */}
                            <div className="p-6 pt-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col gap-3 sticky bottom-0 bg-gradient-to-t from-white dark:from-zinc-900 via-white dark:via-zinc-900 to-transparent pt-4">
                                {activeCount > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        className="w-full py-3 min-h-[52px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-base rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 dark:active:bg-zinc-600 transition-colors touch-manipulation flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Clear All Filters
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full py-4 min-h-[52px] bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation shadow-lg"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
