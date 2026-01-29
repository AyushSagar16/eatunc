'use client'

/**
 * LoginForm Component
 * 
 * Email input form for magic link authentication.
 * Validates UNC email domain client-side for UX before server validation.
 */

import { useState, useTransition, FormEvent } from 'react'
import { IconMail, IconLoader2, IconCheck, IconAlertCircle } from '@tabler/icons-react'
import { isValidUNCEmail, UNC_EMAIL_ERROR } from '@/lib/auth/types'
import { sendMagicLink } from '@/app/auth/actions'

type FormState = 'idle' | 'loading' | 'success' | 'error'

export function LoginForm() {
    const [email, setEmail] = useState('')
    const [formState, setFormState] = useState<FormState>('idle')
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const isValidEmail = email.length > 0 && isValidUNCEmail(email)
    const showEmailError = email.length > 0 && !isValidUNCEmail(email)

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!isValidEmail) {
            setError(UNC_EMAIL_ERROR)
            return
        }

        setError(null)
        setFormState('loading')

        const formData = new FormData()
        formData.append('email', email)

        startTransition(async () => {
            const result = await sendMagicLink(formData)

            if (result.success) {
                setFormState('success')
            } else {
                setFormState('error')
                setError(result.error || 'An error occurred')
            }
        })
    }

    if (formState === 'success') {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconCheck className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
                    <p className="text-gray-400 mb-4">
                        We sent a sign-in link to
                    </p>
                    <p className="text-white font-medium mb-6">{email}</p>
                    <p className="text-gray-500 text-sm">
                        Click the link in the email to sign in.
                        If you don&apos;t see it, check your spam folder.
                    </p>
                    <button
                        onClick={() => {
                            setFormState('idle')
                            setEmail('')
                        }}
                        className="mt-6 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                        Use a different email
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-300 mb-2"
                    >
                        UNC Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <IconMail className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                if (error) setError(null)
                                if (formState === 'error') setFormState('idle')
                            }}
                            placeholder="your-onyen@unc.edu"
                            className={`
                w-full pl-12 pr-4 py-3.5 
                bg-white/5 border rounded-xl
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                transition-all duration-200
                ${showEmailError
                                    ? 'border-red-500/50 focus:ring-red-500/50'
                                    : 'border-white/10 hover:border-white/20'
                                }
              `}
                            disabled={isPending}
                        />
                    </div>

                    {/* Email Validation Hint */}
                    {showEmailError && (
                        <p className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
                            <IconAlertCircle className="w-4 h-4" />
                            {UNC_EMAIL_ERROR}
                        </p>
                    )}
                </div>

                {/* Server Error Display */}
                {formState === 'error' && error && !showEmailError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                        <p className="text-sm text-red-400 flex items-center gap-2">
                            <IconAlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isPending || !email || showEmailError}
                    className={`
            w-full py-3.5 px-4 rounded-xl font-medium
            flex items-center justify-center gap-2
            transition-all duration-200
            ${isPending || !email || showEmailError
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        }
          `}
                >
                    {isPending ? (
                        <>
                            <IconLoader2 className="w-5 h-5 animate-spin" />
                            Sending link...
                        </>
                    ) : (
                        <>
                            <IconMail className="w-5 h-5" />
                            Send Magic Link
                        </>
                    )}
                </button>

                {/* Info Text */}
                <p className="text-center text-sm text-gray-500">
                    We&apos;ll send you a link to sign in instantly.
                    No password needed.
                </p>
            </form>
        </div>
    )
}
