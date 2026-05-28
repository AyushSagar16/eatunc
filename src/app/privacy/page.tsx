import type { Metadata } from 'next'
import PrivacyClient from './PrivacyClient'

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'How Eat UNC handles your data and privacy while you browse UNC Chapel Hill dining hall menus.',
}

export default function PrivacyPage() {
    return <PrivacyClient />
}
