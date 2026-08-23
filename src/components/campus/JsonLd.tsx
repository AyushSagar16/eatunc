import { jsonLd } from '@/lib/seo'

/**
 * Structured data, rendered into the HTML by a server component.
 *
 * Deliberately a plain `<script>` and not `next/script`: `next/script` injects the tag from
 * the client after hydration, so the markup is simply absent from the document Googlebot
 * parses. An inline script in a server component ships inside the initial HTML, which is the
 * only form that counts.
 */
export function JsonLd({ data }: { data: unknown }) {
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
}
