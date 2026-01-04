import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * On-demand revalidation endpoint for clearing cached menu data.
 * 
 * Usage:
 *   curl -X POST https://eatunc.com/api/revalidate \
 *     -H "x-revalidate-secret: YOUR_SECRET"
 * 
 * This clears all cached menu and date data, forcing fresh fetches.
 */
export async function POST(request: NextRequest) {
    const secret = request.headers.get('x-revalidate-secret')

    // Validate secret to prevent unauthorized cache purging
    if (!process.env.REVALIDATE_SECRET) {
        return NextResponse.json(
            { error: 'REVALIDATE_SECRET not configured' },
            { status: 500 }
        )
    }

    if (secret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json(
            { error: 'Invalid secret' },
            { status: 401 }
        )
    }

    try {
        // Clear all menu-related caches
        // Using 'max' for stale-while-revalidate semantics (Next.js 16+)
        revalidateTag('menus', 'max')
        revalidateTag('dates', 'max')

        return NextResponse.json({
            revalidated: true,
            tags: ['menus', 'dates'],
            now: Date.now()
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to revalidate', details: String(error) },
            { status: 500 }
        )
    }
}

// Also support GET for easy testing (still requires secret)
export async function GET(request: NextRequest) {
    const secret = request.nextUrl.searchParams.get('secret')

    if (!process.env.REVALIDATE_SECRET) {
        return NextResponse.json(
            { error: 'REVALIDATE_SECRET not configured' },
            { status: 500 }
        )
    }

    if (secret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json(
            { error: 'Invalid secret' },
            { status: 401 }
        )
    }

    try {
        // Using 'max' for stale-while-revalidate semantics (Next.js 16+)
        revalidateTag('menus', 'max')
        revalidateTag('dates', 'max')

        return NextResponse.json({
            revalidated: true,
            tags: ['menus', 'dates'],
            now: Date.now()
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to revalidate', details: String(error) },
            { status: 500 }
        )
    }
}
