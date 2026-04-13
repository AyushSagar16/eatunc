'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { Mail, Lock, User, ArrowRight, Loader2, UtensilsCrossed, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const { user, isLoading, signIn, signUp } = useAuth()

    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Inline validation errors
    const [emailError, setEmailError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [nameError, setNameError] = useState('')

    // Redirect if already logged in
    useEffect(() => {
        if (!isLoading && user) {
            router.push('/dashboard')
        }
    }, [user, isLoading, router])

    function validateFields(): boolean {
        let valid = true
        setEmailError('')
        setPasswordError('')
        setNameError('')

        if (mode === 'signup' && !displayName.trim()) {
            setNameError('Display name is required')
            valid = false
        }

        if (!email.trim()) {
            setEmailError('Email is required')
            valid = false
        } else if (!email.includes('@')) {
            setEmailError('Please enter a valid email address')
            valid = false
        }

        if (!password) {
            setPasswordError('Password is required')
            valid = false
        } else if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters')
            valid = false
        }

        return valid
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError('')

        if (!validateFields()) return

        setSubmitting(true)
        try {
            if (mode === 'signin') {
                const result = await signIn(email, password)
                if (result.error) {
                    setError(result.error)
                } else {
                    router.push('/dashboard')
                }
            } else {
                const result = await signUp(email, password, displayName.trim())
                if (result.error) {
                    setError(result.error)
                } else {
                    router.push('/dashboard')
                }
            }
        } catch {
            setError('An unexpected error occurred. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    function switchMode() {
        setMode(mode === 'signin' ? 'signup' : 'signin')
        setError('')
        setEmailError('')
        setPasswordError('')
        setNameError('')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#13294B]">
                <Loader2 className="h-8 w-8 animate-spin text-[#4B9CD3]" />
            </div>
        )
    }

    if (user) return null

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
            {/* Background */}
            <div
                className="fixed inset-0 -z-10"
                style={{
                    background: 'linear-gradient(145deg, #0d1f3c 0%, #13294B 30%, #1a3a6a 55%, #4B9CD3 100%)',
                }}
            />

            {/* Subtle floating shapes */}
            <div className="fixed inset-0 -z-[5] overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle, #4B9CD3, transparent 70%)', top: '-10%', right: '-5%' }}
                    animate={{ y: [0, 30, 0], x: [0, -15, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute w-[600px] h-[600px] rounded-full opacity-[0.03]"
                    style={{ background: 'radial-gradient(circle, #7DB8DE, transparent 70%)', bottom: '-15%', left: '-10%' }}
                    animate={{ y: [0, -25, 0], x: [0, 20, 0] }}
                    transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute w-[300px] h-[300px] rounded-full opacity-[0.035]"
                    style={{ background: 'radial-gradient(circle, #4B9CD3, transparent 70%)', top: '40%', left: '20%' }}
                    animate={{ y: [0, 20, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Noise overlay */}
            <div
                className="fixed inset-0 -z-[3] opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '128px 128px',
                }}
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[420px]"
            >
                <div
                    className="rounded-2xl border border-white/[0.08] shadow-2xl backdrop-blur-xl overflow-hidden"
                    style={{
                        background: 'linear-gradient(165deg, rgba(19,41,75,0.85) 0%, rgba(19,41,75,0.92) 100%)',
                        boxShadow: '0 0 0 1px rgba(75,156,211,0.06), 0 25px 60px -12px rgba(0,0,0,0.5), 0 0 120px -40px rgba(75,156,211,0.15)',
                    }}
                >
                    {/* Header */}
                    <div className="pt-10 pb-6 px-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5"
                            style={{
                                background: 'linear-gradient(135deg, #4B9CD3 0%, #3a82b8 100%)',
                                boxShadow: '0 8px 24px -4px rgba(75,156,211,0.4)',
                            }}
                        >
                            <UtensilsCrossed className="w-7 h-7 text-white" strokeWidth={2} />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-[28px] font-bold tracking-tight text-white"
                            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                        >
                            Eat <span className="text-[#4B9CD3]">UNC</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="mt-2 text-sm text-[#7DA8C9] tracking-wide"
                        >
                            Track what you eat on campus
                        </motion.p>
                    </div>

                    {/* Mode toggle pills */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, duration: 0.5 }}
                        className="mx-8 mb-6"
                    >
                        <div className="flex rounded-lg bg-white/[0.05] p-1 border border-white/[0.04]">
                            <button
                                type="button"
                                onClick={() => switchMode()}
                                className={cn(
                                    'flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-300',
                                    mode === 'signin'
                                        ? 'bg-[#4B9CD3] text-white shadow-md shadow-[#4B9CD3]/20'
                                        : 'text-[#7DA8C9] hover:text-white/80'
                                )}
                                disabled={mode === 'signin'}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode()}
                                className={cn(
                                    'flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-300',
                                    mode === 'signup'
                                        ? 'bg-[#4B9CD3] text-white shadow-md shadow-[#4B9CD3]/20'
                                        : 'text-[#7DA8C9] hover:text-white/80'
                                )}
                                disabled={mode === 'signup'}
                            >
                                Sign Up
                            </button>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="px-8 pb-10"
                    >
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <AnimatePresence mode="popLayout">
                                {mode === 'signup' && (
                                    <motion.div
                                        key="name-field"
                                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <label className="block text-xs font-medium text-[#7DA8C9] mb-1.5 uppercase tracking-wider">
                                            Display Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B6B8A]" />
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={(e) => { setDisplayName(e.target.value); setNameError('') }}
                                                placeholder="Your name"
                                                className={cn(
                                                    'w-full pl-11 pr-4 py-3 bg-white/[0.05] border rounded-lg text-sm text-white placeholder:text-[#4B6B8A] outline-none transition-all duration-200',
                                                    'focus:bg-white/[0.08] focus:border-[#4B9CD3]/50 focus:ring-1 focus:ring-[#4B9CD3]/20',
                                                    nameError ? 'border-red-400/60' : 'border-white/[0.08]'
                                                )}
                                            />
                                        </div>
                                        {nameError && (
                                            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> {nameError}
                                            </p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <label className="block text-xs font-medium text-[#7DA8C9] mb-1.5 uppercase tracking-wider">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B6B8A]" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                                        placeholder="you@unc.edu"
                                        className={cn(
                                            'w-full pl-11 pr-4 py-3 bg-white/[0.05] border rounded-lg text-sm text-white placeholder:text-[#4B6B8A] outline-none transition-all duration-200',
                                            'focus:bg-white/[0.08] focus:border-[#4B9CD3]/50 focus:ring-1 focus:ring-[#4B9CD3]/20',
                                            emailError ? 'border-red-400/60' : 'border-white/[0.08]'
                                        )}
                                    />
                                </div>
                                {emailError && (
                                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {emailError}
                                    </p>
                                )}
                                {mode === 'signup' && !emailError && (
                                    <p className="mt-1.5 text-xs text-[#5B8FAF]">Use your @unc.edu email</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#7DA8C9] mb-1.5 uppercase tracking-wider">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B6B8A]" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setPasswordError('') }}
                                        placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                                        className={cn(
                                            'w-full pl-11 pr-4 py-3 bg-white/[0.05] border rounded-lg text-sm text-white placeholder:text-[#4B6B8A] outline-none transition-all duration-200',
                                            'focus:bg-white/[0.08] focus:border-[#4B9CD3]/50 focus:ring-1 focus:ring-[#4B9CD3]/20',
                                            passwordError ? 'border-red-400/60' : 'border-white/[0.08]'
                                        )}
                                    />
                                </div>
                                {passwordError && (
                                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {passwordError}
                                    </p>
                                )}
                            </div>

                            {/* Error message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="rounded-lg bg-red-500/10 border border-red-400/20 px-4 py-3 text-sm text-red-300 flex items-start gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className={cn(
                                    'w-full py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 mt-2',
                                    'disabled:opacity-60 disabled:cursor-not-allowed',
                                    'hover:shadow-lg hover:shadow-[#4B9CD3]/25 active:scale-[0.98]'
                                )}
                                style={{
                                    background: 'linear-gradient(135deg, #4B9CD3 0%, #3a82b8 100%)',
                                    boxShadow: '0 4px 14px -3px rgba(75,156,211,0.35)',
                                }}
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        {mode === 'signin' ? 'Sign In' : 'Create Account'}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Switch mode link */}
                        <p className="mt-6 text-center text-sm text-[#5B8FAF]">
                            {mode === 'signin' ? (
                                <>
                                    Don&apos;t have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={switchMode}
                                        className="text-[#4B9CD3] hover:text-[#7DB8DE] font-medium transition-colors underline underline-offset-2 decoration-[#4B9CD3]/30"
                                    >
                                        Sign up
                                    </button>
                                </>
                            ) : (
                                <>
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={switchMode}
                                        className="text-[#4B9CD3] hover:text-[#7DB8DE] font-medium transition-colors underline underline-offset-2 decoration-[#4B9CD3]/30"
                                    >
                                        Sign in
                                    </button>
                                </>
                            )}
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}
