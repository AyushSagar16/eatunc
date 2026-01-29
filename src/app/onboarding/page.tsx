/**
 * Onboarding Page (Placeholder)
 * 
 * First-time user onboarding flow to collect macro targets and preferences.
 * Required after first login before accessing the dashboard.
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser, createClient } from '@/lib/supabase/server'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'

export const metadata: Metadata = {
    title: 'Get Started',
    description: 'Set up your meal tracking preferences for UNC Dining.',
}

export default async function OnboardingPage() {
    const user = await getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Check if already onboarded
    const supabase = await createClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

    if (profile?.onboarding_completed) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <OnboardingForm userId={user.id} userEmail={user.email || ''} />
            </div>
        </div>
    )
}
