'use client'

import React from 'react'

export type HealthyPreset = 'balanced' | 'protein' | 'calories' | 'fat'

interface HealthyPicksSelectorProps {
    showHealthy: boolean
    onToggleHealthy: (show: boolean) => void
    preset: HealthyPreset
    onPresetChange: (preset: HealthyPreset) => void
    strictness: number
    onStrictnessChange: (val: number) => void
}

export default function HealthyPicksSelector({
    showHealthy,
    onToggleHealthy,
    preset,
    onPresetChange,
    strictness,
    onStrictnessChange
}: HealthyPicksSelectorProps) {
    const presets: { id: HealthyPreset; label: string }[] = [
        { id: 'balanced', label: 'Balanced' },
        { id: 'protein', label: 'High Protein' },
        { id: 'calories', label: 'Low Calorie' },
        { id: 'fat', label: 'Low Fat' },
    ]

    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 mb-12 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                {/* Left Side: Toggle & Preset Chips */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={showHealthy}
                                    onChange={(e) => onToggleHealthy(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-11 h-6 transition-colors rounded-full border border-zinc-200 dark:border-zinc-800 ${showHealthy ? 'bg-green-500' : 'bg-zinc-100 dark:bg-zinc-800/50'}`} />
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showHealthy ? 'translate-x-5' : 'translate-x-0'} shadow-sm`} />
                            </div>
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-green-600 transition-colors">
                                Show Healthy Picks
                            </span>
                        </label>
                    </div>

                    {showHealthy && (
                        <div className="flex flex-wrap gap-2">
                            {presets.map((p) => {
                                const isActive = preset === p.id
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => onPresetChange(p.id)}
                                        className={`
                                            px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 border
                                            ${isActive
                                                ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-black shadow-lg shadow-zinc-900/10'
                                                : 'bg-transparent border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300'
                                            }
                                        `}
                                    >
                                        {p.label}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Right Side: Strictness Slider (Stored but not used in logic yet) */}
                {showHealthy && (
                    <div className="flex flex-col gap-3 min-w-[200px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                                Strictness
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500">
                                {strictness < 33 ? 'Relaxed' : strictness < 66 ? 'Moderate' : 'Strict'}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={strictness}
                            onChange={(e) => onStrictnessChange(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
