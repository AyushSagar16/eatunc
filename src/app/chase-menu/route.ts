import type { NextRequest } from 'next/server'

import { redirectToCurrentHallMenu } from '@/lib/hall-menu-redirect'

/** Legacy search/bookmark URL; the dated menu is the single public Chase experience. */
export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
    return redirectToCurrentHallMenu(request, 'chase')
}
