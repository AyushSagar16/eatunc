import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Eat UNC — UNC Chapel Hill dining menus, hours and nutrition'
export const contentType = 'image/png'

/**
 * 1200x630 — the ratio Google, Facebook, Slack and iMessage all render as a full-bleed card.
 *
 * This is the site-wide default and it exists because file-based metadata cascades: every
 * route without its own opengraph-image inherits this one. Before it, most pages had no
 * og:image at all (setting `openGraph` without `images` replaces the parent object wholesale),
 * and the two that did pointed at a 159KB SVG, which no social crawler renders.
 */
export const size = { width: 1200, height: 630 }

const NAVY = '#13294B'
const CAROLINA = '#4B9CD3'

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
                    justifyContent: 'center',
                    padding: 72,
                    backgroundColor: NAVY,
                    backgroundImage: `linear-gradient(135deg, ${NAVY} 0%, #0d1c33 55%, #10243f 100%)`,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div
                        style={{
                            display: 'flex',
                            width: 96,
                            height: 96,
                            borderRadius: 24,
                            backgroundColor: '#ffffff',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        <img src={logoSrc} width={80} height={80} alt="" />
                    </div>
                    <div
                        style={{
                            fontSize: 34,
                            fontWeight: 700,
                            color: CAROLINA,
                            letterSpacing: 6,
                        }}
                    >
                        EAT UNC
                    </div>
                </div>

                <div
                    style={{
                        marginTop: 44,
                        fontSize: 78,
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: -2.5,
                        lineHeight: 1.05,
                    }}
                >
                    UNC dining menus,
                </div>
                <div
                    style={{
                        fontSize: 78,
                        fontWeight: 700,
                        color: CAROLINA,
                        letterSpacing: -2.5,
                        lineHeight: 1.05,
                    }}
                >
                    hours and nutrition
                </div>

                <div
                    style={{
                        marginTop: 32,
                        fontSize: 30,
                        color: 'rgba(255,255,255,0.72)',
                    }}
                >
                    Chase · Top of Lenoir · the Beach Cafe · 40 campus locations
                </div>
            </div>
        ),
        size,
    )
}
