'use client'

import { useState, useMemo } from 'react'
import { m, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarPickerProps {
    selectedDate: string          // ISO format (YYYY-MM-DD)
    availableDates: string[]      // Array of dates with menu data
    onDateSelect: (date: string) => void
    onClose: () => void
    minDate?: Date                // Earliest selectable date
    maxDate?: Date                // Latest selectable date
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarPicker({
    selectedDate,
    availableDates,
    onDateSelect,
    onClose,
    minDate,
    maxDate
}: CalendarPickerProps) {
    // Parse selected date to get initial month/year
    const selected = new Date(selectedDate)
    const [viewMonth, setViewMonth] = useState(() => selected.getMonth())
    const [viewYear, setViewYear] = useState(() => selected.getFullYear())

    // Get today's date for highlighting
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Convert availableDates to a Set for O(1) lookup
    const availableDatesSet = useMemo(() => new Set(availableDates), [availableDates])

    // Generate calendar grid for current view month
    const calendarDays = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1)
        const lastDay = new Date(viewYear, viewMonth + 1, 0)
        const startPadding = firstDay.getDay() // 0 = Sunday
        const totalDays = lastDay.getDate()

        const days: Array<{ date: Date | null; dateStr: string | null }> = []

        // Add empty cells for padding
        for (let i = 0; i < startPadding; i++) {
            days.push({ date: null, dateStr: null })
        }

        // Add actual days
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(viewYear, viewMonth, day)
            const dateStr = date.toISOString().split('T')[0]
            days.push({ date, dateStr })
        }

        return days
    }, [viewMonth, viewYear])

    // Navigation handlers
    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11)
            setViewYear(prev => prev - 1)
        } else {
            setViewMonth(prev => prev - 1)
        }
    }

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0)
            setViewYear(prev => prev + 1)
        } else {
            setViewMonth(prev => prev + 1)
        }
    }

    const handleDateClick = (dateStr: string) => {
        onDateSelect(dateStr)
    }

    // Check if a date is selectable
    const isDateSelectable = (date: Date | null, dateStr: string | null): boolean => {
        if (!date || !dateStr) return false
        if (minDate && date < minDate) return false
        if (maxDate && date > maxDate) return false
        return true
    }

    return (
        <m.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full mt-2 right-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-zinc-900/10 dark:shadow-black/50 p-4 min-w-[320px]"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
        >
            {/* Header: Month/Year with navigation */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <m.button
                    onClick={handlePrevMonth}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    aria-label="Previous month"
                >
                    <ChevronLeft className="size-5 text-zinc-600 dark:text-zinc-400" />
                </m.button>

                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {MONTHS[viewMonth]} {viewYear}
                </h3>

                <m.button
                    onClick={handleNextMonth}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    aria-label="Next month"
                >
                    <ChevronRight className="size-5 text-zinc-600 dark:text-zinc-400" />
                </m.button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 py-1"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    const { date, dateStr } = day

                    // Empty cell for padding
                    if (!date || !dateStr) {
                        return <div key={`empty-${index}`} className="aspect-square" />
                    }

                    const isToday = dateStr === todayStr
                    const isSelected = dateStr === selectedDate
                    const isAvailable = availableDatesSet.has(dateStr)
                    const isSelectable = isDateSelectable(date, dateStr)

                    return (
                        <m.button
                            key={dateStr}
                            onClick={() => isSelectable && handleDateClick(dateStr)}
                            disabled={!isSelectable}
                            whileHover={isSelectable ? { scale: 1.05 } : {}}
                            whileTap={isSelectable ? { scale: 0.95 } : {}}
                            className={`
                                aspect-square rounded-lg text-sm font-semibold transition-all
                                ${isSelected
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : isToday
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-500'
                                        : isAvailable
                                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                                            : isSelectable
                                                ? 'text-zinc-400 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                                : 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-40'
                                }
                                ${!isSelectable ? 'pointer-events-none' : ''}
                            `}
                        >
                            {date.getDate()}
                        </m.button>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="size-3 rounded bg-blue-600" />
                    <span className="text-zinc-600 dark:text-zinc-400">Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="size-3 rounded border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/30" />
                    <span className="text-zinc-600 dark:text-zinc-400">Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="size-3 rounded bg-zinc-100 dark:bg-zinc-800" />
                    <span className="text-zinc-600 dark:text-zinc-400">Menu Available</span>
                </div>
            </div>
        </m.div>
    )
}
