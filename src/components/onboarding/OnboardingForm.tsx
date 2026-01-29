'use client'

/**
 * Onboarding Form
 * 
 * Multi-step form for collecting user macro targets and dietary preferences.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { IconArrowRight, IconArrowLeft, IconLoader2, IconCheck, IconTarget, IconLeaf, IconAlertTriangle } from '@tabler/icons-react'
import { completeOnboarding } from '@/app/onboarding/actions'

interface OnboardingFormProps {
    userId: string
    userEmail: string
}

// Calorie presets for quick selection
const CALORIE_PRESETS = [
    { label: 'Weight Loss', calories: 1500, protein: 100, carbs: 150, fat: 50 },
    { label: 'Maintenance', calories: 2000, protein: 75, carbs: 250, fat: 65 },
    { label: 'Muscle Gain', calories: 2500, protein: 150, carbs: 300, fat: 80 },
    { label: 'High Activity', calories: 3000, protein: 120, carbs: 400, fat: 100 },
]

// Dietary preference options
const DIETARY_PREFERENCES = [
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'halal', label: 'Halal' },
    { id: 'kosher', label: 'Kosher' },
    { id: 'gluten-free', label: 'Gluten-Free' },
    { id: 'dairy-free', label: 'Dairy-Free' },
    { id: 'low-sodium', label: 'Low Sodium' },
    { id: 'organic', label: 'Organic' },
]

// Allergen options
const ALLERGENS = [
    { id: 'milk', label: 'Milk' },
    { id: 'egg', label: 'Eggs' },
    { id: 'fish', label: 'Fish' },
    { id: 'shellfish', label: 'Shellfish' },
    { id: 'tree-nuts', label: 'Tree Nuts' },
    { id: 'peanut', label: 'Peanuts' },
    { id: 'wheat', label: 'Wheat' },
    { id: 'soy', label: 'Soy' },
    { id: 'sesame', label: 'Sesame' },
]

export function OnboardingForm({ userId, userEmail }: OnboardingFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [step, setStep] = useState(1)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [selectedPreset, setSelectedPreset] = useState<string | null>('Maintenance')
    const [calories, setCalories] = useState(2000)
    const [protein, setProtein] = useState(75)
    const [carbs, setCarbs] = useState(250)
    const [fat, setFat] = useState(65)
    const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([])
    const [allergies, setAllergies] = useState<string[]>([])

    const handlePresetSelect = (preset: typeof CALORIE_PRESETS[0]) => {
        setSelectedPreset(preset.label)
        setCalories(preset.calories)
        setProtein(preset.protein)
        setCarbs(preset.carbs)
        setFat(preset.fat)
    }

    const toggleDietaryPreference = (id: string) => {
        setDietaryPreferences(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        )
    }

    const toggleAllergen = (id: string) => {
        setAllergies(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        )
    }

    const handleSubmit = () => {
        setError(null)

        startTransition(async () => {
            const result = await completeOnboarding({
                userId,
                calories,
                protein,
                carbs,
                fat,
                dietaryPreferences,
                allergies,
            })

            if (result.success) {
                router.push('/dashboard')
            } else {
                setError(result.error || 'Something went wrong')
            }
        })
    }

    const nextStep = () => setStep(s => Math.min(s + 1, 3))
    const prevStep = () => setStep(s => Math.max(s - 1, 1))

    return (
        <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                    Welcome to UNC Dining!
                </h1>
                <p className="text-gray-400">
                    {userEmail}
                </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map(s => (
                    <div
                        key={s}
                        className={`w-3 h-3 rounded-full transition-colors ${s === step
                                ? 'bg-blue-500'
                                : s < step
                                    ? 'bg-green-500'
                                    : 'bg-gray-600'
                            }`}
                    />
                ))}
            </div>

            {/* Step 1: Macro Targets */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-3">
                            <IconTarget className="w-6 h-6 text-blue-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Set Your Goals</h2>
                        <p className="text-sm text-gray-400 mt-1">Choose a preset or customize your targets</p>
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-2 gap-3">
                        {CALORIE_PRESETS.map(preset => (
                            <button
                                key={preset.label}
                                onClick={() => handlePresetSelect(preset)}
                                className={`p-3 rounded-xl border text-left transition-all ${selectedPreset === preset.label
                                        ? 'bg-blue-500/20 border-blue-500/50 text-white'
                                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                    }`}
                            >
                                <p className="font-medium text-sm">{preset.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{preset.calories} kcal</p>
                            </button>
                        ))}
                    </div>

                    {/* Custom Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Calories (kcal)</label>
                            <input
                                type="number"
                                value={calories}
                                onChange={e => { setCalories(Number(e.target.value)); setSelectedPreset(null) }}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Protein (g)</label>
                            <input
                                type="number"
                                value={protein}
                                onChange={e => { setProtein(Number(e.target.value)); setSelectedPreset(null) }}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Carbs (g)</label>
                            <input
                                type="number"
                                value={carbs}
                                onChange={e => { setCarbs(Number(e.target.value)); setSelectedPreset(null) }}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Fat (g)</label>
                            <input
                                type="number"
                                value={fat}
                                onChange={e => { setFat(Number(e.target.value)); setSelectedPreset(null) }}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Dietary Preferences */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-xl mb-3">
                            <IconLeaf className="w-6 h-6 text-green-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Dietary Preferences</h2>
                        <p className="text-sm text-gray-400 mt-1">Select any that apply (optional)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {DIETARY_PREFERENCES.map(pref => (
                            <button
                                key={pref.id}
                                onClick={() => toggleDietaryPreference(pref.id)}
                                className={`p-3 rounded-xl border text-left transition-all ${dietaryPreferences.includes(pref.id)
                                        ? 'bg-green-500/20 border-green-500/50 text-white'
                                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{pref.label}</span>
                                    {dietaryPreferences.includes(pref.id) && (
                                        <IconCheck className="w-4 h-4 text-green-400" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Allergies */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-xl mb-3">
                            <IconAlertTriangle className="w-6 h-6 text-orange-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Allergens to Avoid</h2>
                        <p className="text-sm text-gray-400 mt-1">We&apos;ll highlight items containing these (optional)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {ALLERGENS.map(allergen => (
                            <button
                                key={allergen.id}
                                onClick={() => toggleAllergen(allergen.id)}
                                className={`p-3 rounded-xl border text-left transition-all ${allergies.includes(allergen.id)
                                        ? 'bg-orange-500/20 border-orange-500/50 text-white'
                                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{allergen.label}</span>
                                    {allergies.includes(allergen.id) && (
                                        <IconCheck className="w-4 h-4 text-orange-400" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                {step > 1 ? (
                    <button
                        onClick={prevStep}
                        className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <IconArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                ) : (
                    <div />
                )}

                {step < 3 ? (
                    <button
                        onClick={nextStep}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                    >
                        Next
                        <IconArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                    >
                        {isPending ? (
                            <>
                                <IconLoader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <IconCheck className="w-4 h-4" />
                                Complete Setup
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}
