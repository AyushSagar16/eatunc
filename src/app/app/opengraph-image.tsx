import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Download the Eat UNC app today'
export const contentType = 'image/png'

/**
 * Square on purpose. A 1.91:1 image makes iMessage, Slack and Twitter render a
 * full-bleed banner card; a square one renders the compact thumbnail card, which
 * is what we want for a short "get the app" link.
 */
export const size = { width: 800, height: 800 }

const NAVY = '#13294B'
const CAROLINA = '#4B9CD3'

/**
 * Preview card for eatunc.com/app: the app icon sitting in an iPhone, so a
 * shared link reads as "this is the mobile app" at a glance.
 *
 * Statically generated at build time, which is why reading straight from
 * `public/` is safe here — this never runs per-request.
 */
export default async function Image() {
    const logo = await readFile(join(process.cwd(), 'public', 'eat_unc_logo_square.png'))
    const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: NAVY,
                }}
            >
                {/* Phone */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: 300,
                        height: 384,
                        borderRadius: 46,
                        border: `6px solid rgba(255,255,255,0.22)`,
                        backgroundColor: '#0d1c33',
                        paddingTop: 18,
                    }}
                >
                    {/* Dynamic island */}
                    <div
                        style={{
                            width: 92,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: 'rgba(255,255,255,0.28)',
                        }}
                    />

                    {/* App icon on the home screen */}
                    <div
                        style={{
                            display: 'flex',
                            width: 148,
                            height: 148,
                            marginTop: 54,
                            borderRadius: 34,
                            backgroundColor: '#ffffff',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        <img src={logoSrc} width={124} height={124} alt="" />
                    </div>

                    <div
                        style={{
                            marginTop: 18,
                            fontSize: 22,
                            color: 'rgba(255,255,255,0.9)',
                            letterSpacing: -0.2,
                        }}
                    >
                        Eat UNC
                    </div>
                </div>

                <div
                    style={{
                        marginTop: 40,
                        fontSize: 54,
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: -1.5,
                    }}
                >
                    Download Eat UNC
                </div>

                <div
                    style={{
                        marginTop: 8,
                        fontSize: 28,
                        color: CAROLINA,
                    }}
                >
                    Carolina dining menus, on your iPhone
                </div>
            </div>
        ),
        size
    )
}
