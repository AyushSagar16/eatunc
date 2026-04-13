'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getFavorites, MasterFoodItem, removeFavorite } from '@/lib/api'
import FoodCard from '@/components/FoodCard'
import FoodModal from '@/components/FoodModal'
import LoadingScreen from '@/components/LoadingScreen'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { ArrowLeft, Heart, Search } from 'lucide-react'
import Image from 'next/image'

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [selectedItem, setSelectedItem] = useState<MasterFoodItem | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchFavs = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                try {
                    const data = await getFavorites(user.id)
                    setFavorites(data || [])
                } catch (err) {
                    console.error('Error fetching favorites:', err)
                }
            }
            setIsLoading(false)
        }
        fetchFavs()
    }, [])

    const toggleFavorite = async (recipeNumber: number) => {
        if (!userId) return

        try {
            await removeFavorite(userId, recipeNumber)
            setFavorites(prev => prev.filter(f => f.recipe_number !== recipeNumber))
            if (selectedItem?.recipe_number === recipeNumber) {
                setSelectedItem(null)
            }
        } catch (err) {
            console.error('Error removing favorite:', err)
        }
    }

    const filteredFavorites = favorites.filter(f => 
        f.master_food_items?.food_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (isLoading) return <LoadingScreen isLoading={true} />

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex flex-col gap-8 mb-12">
                    <div className="flex items-center justify-between">
                        <Link 
                            href="/"
                            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-bold uppercase tracking-widest text-xs"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Menu
                        </Link>
                        <div className="relative w-32 h-10 sm:w-48 sm:h-16">
                             <Image
                                src="/eat_unc_text_logo_nw.svg"
                                alt="Eat UNC Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 mb-2">
                                My <span className="text-rose-500">Favorites</span>
                            </h1>
                            <p className="text-zinc-500 font-medium">
                                {favorites.length} items you&apos;ve saved for later
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search favorites..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {!userId ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none p-8">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center mb-6">
                            <Heart className="w-10 h-10 text-rose-500 fill-current" />
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-2">Please Log In</h2>
                        <p className="text-zinc-500 mb-8 max-w-sm">
                            You need to be logged in to view and manage your favorite items.
                        </p>
                        <Link 
                            href="/"
                            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                        >
                            Back to Home
                        </Link>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none p-8">
                        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mb-6 text-zinc-400">
                            <Heart className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-2">No Favorites Yet</h2>
                        <p className="text-zinc-500 mb-8 max-w-sm">
                            Items you favorite from the dining hall menus will appear here for quick access.
                        </p>
                        <Link 
                            href="/"
                            className="px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-2xl hover:opacity-90 transition-all"
                        >
                            Explore Menus
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredFavorites.map((fav) => (
                                <motion.div
                                    key={fav.recipe_number}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <FoodCard
                                        item={fav.master_food_items}
                                        station="Saved Item"
                                        mealPeriod="Favorite"
                                        isFavorited={true}
                                        onClick={() => setSelectedItem(fav.master_food_items)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {selectedItem && (
                <FoodModal
                    item={selectedItem}
                    station="Saved Item"
                    mealPeriod="Favorite"
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    isFavorited={true}
                    onToggleFavorite={toggleFavorite}
                />
            )}
        </main>
    )
}
