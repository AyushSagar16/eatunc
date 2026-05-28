import type { Metadata } from 'next'
import FeedbackClient from './FeedbackClient'

export const metadata: Metadata = {
    title: 'Feedback',
    description: 'Share feedback, report issues, or request features for Eat UNC, the UNC Chapel Hill dining menu app.',
}

export default function FeedbackPage() {
    return <FeedbackClient />
}
