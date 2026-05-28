import type { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
    title: 'About',
    description: 'Learn about Eat UNC — a faster way to browse UNC Chapel Hill dining hall menus, nutrition facts, and meal times.',
}

export default function AboutPage() {
    return <AboutClient />
}
