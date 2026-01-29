/**
 * Dashboard Page (Placeholder)
 * 
 * Protected page showing user's meal tracking dashboard.
 * Requires authentication and completed onboarding.
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { IconSettings, IconChartBar, IconPlus, IconToolsKitchen2 } from '@tabler/icons-react'
import { getUser, createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
    title: 'Dashboard',
    description: 'Track your daily meals and macros at UNC dining halls.',
}

export default async function DashboardPage() {
    const user = await getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch user profile
    const supabase = await createClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile?.onboarding_completed) {
        redirect('/onboarding')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
            {/* Header */}
            <header className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white">Dashboard</h1>
                            <p className="text-sm text-gray-400">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    timeZone: 'America/New_York'
                                })}
                            </p>
                        </div>
                        <Link
                            href="/dashboard/settings"
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <IconSettings className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Today's Summary - Placeholder */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">Today&apos;s Progress</h2>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Calories */}
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">0</p>
                                <p className="text-sm text-gray-400">of {profile.daily_calories_target} kcal</p>
                                <p className="text-xs text-blue-400 mt-1">Calories</p>
                            </div>
                            {/* Protein */}
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">0g</p>
                                <p className="text-sm text-gray-400">of {profile.daily_protein_target}g</p>
                                <p className="text-xs text-green-400 mt-1">Protein</p>
                            </div>
                            {/* Carbs */}
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">0g</p>
                                <p className="text-sm text-gray-400">of {profile.daily_carbs_target}g</p>
                                <p className="text-xs text-yellow-400 mt-1">Carbs</p>
                            </div>
                            {/* Fat */}
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">0g</p>
                                <p className="text-sm text-gray-400">of {profile.daily_fat_target}g</p>
                                <p className="text-xs text-orange-400 mt-1">Fat</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link
                            href="/chase"
                            className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
                        >
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <IconToolsKitchen2 className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                    Browse Menus
                                </p>
                                <p className="text-sm text-gray-400">Add items to your meal cart</p>
                            </div>
                        </Link>
                        <button
                            disabled
                            className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl opacity-50 cursor-not-allowed"
                        >
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                <IconPlus className="w-6 h-6 text-green-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-white">Log Quick Meal</p>
                                <p className="text-sm text-gray-400">Coming soon</p>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Today's Meals - Empty State */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">Today&apos;s Meals</h2>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <IconChartBar className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-white font-medium mb-2">No meals logged yet</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Start by browsing the dining hall menus and adding items to your cart.
                        </p>
                        <Link
                            href="/chase"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <IconToolsKitchen2 className="w-4 h-4" />
                            Browse Menus
                        </Link>
                    </div>
                </section>

                {/* User Info Card */}
                <section>
                    <h2 className="text-lg font-semibold text-white mb-4">Your Profile</h2>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <p className="text-sm text-gray-400 mb-1">Email</p>
                                <p className="text-white">{profile.email}</p>
                            </div>
                            {profile.dietary_preferences.length > 0 && (
                                <div className="flex-1 min-w-[200px]">
                                    <p className="text-sm text-gray-400 mb-1">Dietary Preferences</p>
                                    <div className="flex flex-wrap gap-1">
                                        {profile.dietary_preferences.map((pref: string) => (
                                            <span
                                                key={pref}
                                                className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full"
                                            >
                                                {pref}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {profile.allergies.length > 0 && (
                                <div className="flex-1 min-w-[200px]">
                                    <p className="text-sm text-gray-400 mb-1">Avoiding</p>
                                    <div className="flex flex-wrap gap-1">
                                        {profile.allergies.map((allergy: string) => (
                                            <span
                                                key={allergy}
                                                className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full"
                                            >
                                                {allergy}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
