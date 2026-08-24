'use client'

import DitherShader from './ui/dither-shader'

/**
 * Five stops rather than a two-tone duotone. A hard two-level threshold has one edge to spend on
 * the whole picture, and a face is mostly midtones — hair, shadowed skin and a blue t-shirt all
 * landed on the dark side of it and fused into a single navy mass. Five stops give the hair, the
 * shaded side of the face, the lit side and the highlights their own value, which is what makes
 * the eyes, brow and smile resolve at 112px.
 */
const CAROLINA_RAMP = ['#13294B', '#2C5A85', '#4B9CD3', '#8FCBEB', '#DCEEF9']

/**
 * A background-removed photo of Ayush, run through the same Bayer treatment as the homepage hero
 * (`LandingScreen`) — Carolina navy and blue, so a real photo still reads as part of the site's
 * visual language rather than a stock headshot dropped on top of it.
 *
 * `/ayush-sagar.png` already has its background cut to a transparent alpha channel; the shader
 * skips fully-transparent pixels, so the card's own background shows through around him instead
 * of a hard photo-frame edge.
 *
 * Two things here are load-bearing and easy to undo by accident:
 *
 * 1. **The window.** The source photo is a chest-up shot, so fitting it whole into a 112px square
 *    left the head about 35px tall — too few pixels for a dither cell to describe an eye. The
 *    inner box is deliberately oversized and offset so the container crops to head-and-shoulders;
 *    because the shader rasterises at its own box size, the enlargement buys real resolution on
 *    the face rather than scaling up a small render. The offsets are percentages so the framing
 *    is identical at the 112px and 128px breakpoints.
 * 2. **`threshold` is a dither-*spread* control, not a luminance pivot.** The component folds it
 *    in as `bayer * (1 - threshold) + threshold * 0.5`, so raising it collapses the Bayer matrix
 *    toward a flat 0.5 and *removes* gradation; the pivot itself barely moves. The old 0.6 left
 *    almost no spread, which is why the face came out flat. Keep it low, and use
 *    `contrast`/`brightness` to centre this photo's dark histogram (median luminance ~0.29) on
 *    the 0.5 pivot instead.
 */
export default function AboutAvatar({ className = '' }: { className?: string }) {
    // `rounded-[inherit]` rather than a literal radius: this wrapper has to clip (that is what
    // crops the window onto the face), and an unrounded clip would square off whatever corner
    // radius the page's container set. Inheriting leaves the shape where it belongs.
    return (
        <div className={`relative overflow-hidden rounded-[inherit] ${className}`}>
            <div className="absolute h-[166%] w-[166%] -top-[8.7%] -left-[40.5%]">
                <DitherShader
                    src="/ayush-sagar.png"
                    ditherMode="bayer"
                    colorMode="custom"
                    customPalette={CAROLINA_RAMP}
                    threshold={0.15}
                    contrast={1.45}
                    brightness={0.15}
                    gridSize={1}
                    pixelRatio={1}
                    objectFit="cover"
                    className="h-full w-full"
                />
            </div>
        </div>
    )
}
