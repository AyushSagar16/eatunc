/**
 * Login Page
 * 
 * Authentication page for UNC students to sign in with their @unc.edu email.
 * Uses Supabase magic link authentication for passwordless sign-in.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IconArrowLeft, IconSchool } from '@tabler/icons-react'
import { LoginForm } from '@/components/auth/LoginForm'
import { getUser } from '@/lib/supabase/server'

export const metadata: Metadata = {
    title: 'Sign In',
    description: 'Sign in to UNC Dining with your UNC email to track your meals and macros.',
}

export default async function LoginPage() {
    // Redirect if already logged in
    const user = await getUser()
    if (user) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex flex-col">
            {/* Header */}
            <header className="p-4 sm:p-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <IconArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Back to Home</span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-md">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-2xl mb-4">
                            <IconSchool className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                            Sign in to UNC Dining
                        </h1>
                        <p className="text-gray-400">
                            Track your meals, hit your macros, eat better on campus.
                        </p>
                    </div>

                    {/* Login Form */}
                    <LoginForm />

                    {/* UNC Email Notice */}
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
                            <IconSchool className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-gray-400">
                                Only <span className="text-white font-medium">@unc.edu</span> emails allowed
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-4 sm:p-6 text-center">
                <p className="text-sm text-gray-500">
                    By signing in, you agree to our{' '}
                    <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
                        Privacy Policy
                    </Link>
                </p>
            </footer>
        </div>
    )
}
