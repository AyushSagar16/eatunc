'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, ChevronDown, X, ArrowUpDown } from 'lucide-react'

export type SortOption = 'recommended' | 'calories' | 'protein' | 'fat' | 'alphabetical'

interface SearchAndSortProps {
    searchQuery: string
    onSearchChange: (query: string) => void
    sortBy: SortOption
    onSortChange: (sort: SortOption) => void
    placeholder?: string
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'recommended', label: 'Best Match' },
    { value: 'calories', label: 'Lowest Calorie' },
    { value: 'protein', label: 'Highest Protein' },
    { value: 'fat', label: 'Lowest Fat' },
    { value: 'alphabetical', label: 'A → Z' },
]

/**
 * SearchAndSort - Search input with sorting dropdown
 * Features:
 * - Search input with icon and clear button
 * - Animated dropdown for sorting options
 * - Keyboard navigation support
 * - Focus states and transitions
 */
export default function SearchAndSort({
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    placeholder = 'Search food items...',
}: SearchAndSortProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Cmd/Ctrl + K to focus search
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault()
                inputRef.current?.focus()
            }
            // Escape to clear search
            if (event.key === 'Escape' && document.activeElement === inputRef.current) {
                onSearchChange('')
                inputRef.current?.blur()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onSearchChange])

    const currentSort = SORT_OPTIONS.find(opt => opt.value === sortBy) || SORT_OPTIONS[0]

    return (
        <div className="flex flex-row items-center justify-end sm:justify-start gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 hidden sm:block" data-tutorial-target="search-bar">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-zinc-400" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    aria-label="Search food items"
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
                <AnimatePresence>
                    {searchQuery && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => onSearchChange('')}
                            aria-label="Clear search"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </motion.button>
                    )}
                </AnimatePresence>
                {/* Keyboard hint */}
                <div className="hidden sm:flex absolute inset-y-0 right-3 items-center pointer-events-none">
                    {!searchQuery && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                            ⌘K
                        </kbd>
                    )}
                </div>
            </div>

            {/* Sort Dropdown */}
            <div ref={dropdownRef} className="relative flex-shrink-0" data-tutorial-target="sort-dropdown">
                <motion.button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-label="Sort options"
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                        flex items-center gap-2 px-4 h-14 sm:h-auto sm:py-2.5 rounded-2xl sm:rounded-xl border text-base sm:text-sm font-bold sm:font-medium transition-all
                        ${isDropdownOpen
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-lg shadow-zinc-200/20 sm:shadow-none'
                        }
                    `}
                >
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="hidden sm:inline">{currentSort.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div
                            role="menu"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50"
                        >
                            {SORT_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    role="menuitemradio"
                                    aria-checked={sortBy === option.value}
                                    onClick={() => {
                                        onSortChange(option.value)
                                        setIsDropdownOpen(false)
                                    }}
                                    className={`
                                        w-full px-4 py-2.5 text-left text-sm transition-colors
                                        ${sortBy === option.value
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                        }
                                    `}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
