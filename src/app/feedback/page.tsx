'use client'

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Bug, Lightbulb, MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

type FeedbackType = 'bug' | 'feature' | 'general';

interface FeedbackOption {
    type: FeedbackType;
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
    iconBg: string;
    borderColor: string;
}

const feedbackOptions: FeedbackOption[] = [
    {
        type: 'bug',
        icon: <Bug className="w-5 h-5 text-red-500" />,
        title: "Report a Bug",
        description: "Something broken?",
        gradient: "from-red-500/10",
        iconBg: "bg-red-100 dark:bg-red-500/20",
        borderColor: "border-red-500",
    },
    {
        type: 'feature',
        icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
        title: "Request Feature",
        description: "Have an idea?",
        gradient: "from-amber-500/10",
        iconBg: "bg-amber-100 dark:bg-amber-500/20",
        borderColor: "border-amber-500",
    },
    {
        type: 'general',
        icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
        title: "General Feedback",
        description: "Share thoughts",
        gradient: "from-blue-500/10",
        iconBg: "bg-blue-100 dark:bg-blue-500/20",
        borderColor: "border-blue-500",
    },
];

export default function FeedbackPage() {
    const [selectedType, setSelectedType] = useState<FeedbackType>('general');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const feedbackEnabled = Boolean(process.env.NEXT_PUBLIC_WEB3FORMS_KEY);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!feedbackEnabled) {
            setStatus('error');
            return;
        }

        setStatus('loading');

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY,
                    subject: `[Eat UNC] ${selectedType === 'bug' ? 'Bug Report' : selectedType === 'feature' ? 'Feature Request' : 'General Feedback'}`,
                    from_name: name || 'Anonymous User',
                    email: email || 'noreply@eatunc.com',
                    message: message,
                    feedback_type: selectedType,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setStatus('success');
                setName('');
                setEmail('');
                setMessage('');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    const selectedOption = feedbackOptions.find(o => o.type === selectedType)!;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Menu
            </Link>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800 shrink-0">
                    <Image
                        src="/eat_unc_logo_square.png"
                        alt="Eat UNC Logo"
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
            </div>

            <p className="text-muted-foreground mb-6">
                Help us improve Eat UNC! Select a feedback type and share your thoughts.
            </p>

            {!feedbackEnabled && (
                <div className="mb-6 p-4 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30">
                    <p className="font-medium text-amber-800 dark:text-amber-200">Feedback is not configured for this deployment.</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Add a Web3Forms key to enable this form.</p>
                </div>
            )}

            {/* Feedback Type Selector */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {feedbackOptions.map((option) => (
                    <button
                        key={option.type}
                        type="button"
                        onClick={() => setSelectedType(option.type)}
                        className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedType === option.type
                                ? `${option.borderColor} bg-gradient-to-br ${option.gradient} to-transparent`
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-lg ${option.iconBg} flex items-center justify-center mb-2`}>
                            {option.icon}
                        </div>
                        <span className="text-sm font-medium text-center">{option.title}</span>
                        <span className="text-xs text-muted-foreground text-center hidden sm:block">{option.description}</span>
                    </button>
                ))}
            </div>

            {/* Success Message */}
            {status === 'success' && (
                <div className="mb-6 p-4 rounded-xl bg-green-100 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                    <div>
                        <p className="font-medium text-green-800 dark:text-green-200">Thank you for your feedback!</p>
                        <p className="text-sm text-green-700 dark:text-green-300">We&apos;ll review it and get back to you if needed.</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {status === 'error' && (
                <div className="mb-6 p-4 rounded-xl bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                    <div>
                        <p className="font-medium text-red-800 dark:text-red-200">Something went wrong</p>
                        <p className="text-sm text-red-700 dark:text-red-300">Please try again later.</p>
                    </div>
                </div>
            )}

            {/* Feedback Form */}
            <form onSubmit={handleSubmit} className={`space-y-4 p-6 rounded-2xl border-2 ${selectedOption.borderColor} bg-gradient-to-br ${selectedOption.gradient} to-transparent`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                            Name <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#4B9CD3] transition-all"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                            Email <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#4B9CD3] transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                        Your Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={5}
                        placeholder={
                            selectedType === 'bug'
                                ? "Describe the bug you found. What happened? What did you expect?"
                                : selectedType === 'feature'
                                    ? "Describe the feature you'd like to see. How would it improve your experience?"
                                    : "Share your thoughts about Eat UNC..."
                        }
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#4B9CD3] transition-all resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!feedbackEnabled || !message.trim() || status === 'loading'}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#4B9CD3] hover:bg-[#4B9CD3]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg active:scale-[0.98]"
                >
                    {status === 'loading' ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Send Feedback
                        </>
                    )}
                </button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground text-center">
                Thank you for helping us make Eat UNC better! 💙
            </p>
        </div>
    );
}
