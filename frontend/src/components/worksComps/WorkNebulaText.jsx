import React, {
    useEffect,
    useRef,
} from 'react'

import {
    Box,
} from '@mui/material'

const clamp = (
    value,
    min = 0,
    max = 1,
) =>
    Math.max(
        min,
        Math.min(
            max,
            value,
        ),
    )

const smoothstep = (
    value,
) => {
    const t =
        clamp(value)

    return (
        t *
        t *
        (
            3 -
            2 * t
        )
    )
}

const createParticles = (
    text,
) => {
    const canvas =
        document.createElement(
            'canvas',
        )

    canvas.width =
        1600

    canvas.height =
        420

    const context =
        canvas.getContext(
            '2d',
        )

    if (!context) {
        return []
    }

    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height,
    )

    context.fillStyle =
        '#ffffff'

    context.textAlign =
        'center'

    context.textBaseline =
        'middle'

    context.font =
        '700 170px Arial, sans-serif'

    context.fillText(
        text,
        canvas.width / 2,
        canvas.height / 2,
    )

    const image =
        context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
        )

    const candidates = []

    const sampleStep = 3

    for (
        let y = 0;
        y < canvas.height;
        y += sampleStep
    ) {
        for (
            let x = 0;
            x < canvas.width;
            x += sampleStep
        ) {
            const alpha =
                image.data[
                (
                    y *
                    canvas.width +
                    x
                ) *
                4 +
                3
                ]

            if (
                alpha > 100
            ) {
                candidates.push({
                    x,
                    y,
                })
            }
        }
    }

    if (
        candidates.length ===
        0
    ) {
        return []
    }

    const particles = []

    const particleCount =
        Math.min(
            16000,
            candidates.length,
        )

    const centerX =
        canvas.width / 2

    const centerY =
        canvas.height / 2

    for (
        let i = 0;
        i < particleCount;
        i += 1
    ) {
        const candidate =
            candidates[
            (
                i *
                7919
            ) %
            candidates.length
            ]

        const hash =
            (
                i *
                1664525 +
                1013904223
            ) >>> 0

        const random =
            hash /
            4294967295

        const random2 =
            (
                (
                    hash *
                    16807
                ) %
                100000
            ) /
            100000

        const random3 =
            (
                (
                    hash *
                    48271
                ) %
                100000
            ) /
            100000

        const x =
            (
                candidate.x -
                centerX
            ) /
            (
                canvas.width / 2
            )

        const y =
            -(
                candidate.y -
                centerY
            ) /
            (
                canvas.height / 2
            )

        particles.push({
            x,
            y,

            random,
            random2,
            random3,

            seed:
                random *
                Math.PI *
                2,

            layer:
                i % 4 === 0
                    ? 1
                    : 0,
        })
    }

    return particles
}

const WorkNebulaText = ({
    scrollProgress = 0,
}) => {
    const backgroundCanvasRef =
        useRef(null)

    const foregroundCanvasRef =
        useRef(null)

    const progressRef =
        useRef(
            scrollProgress,
        )

    useEffect(() => {
        progressRef.current =
            scrollProgress
    }, [
        scrollProgress,
    ])

    useEffect(() => {
        const backgroundCanvas =
            backgroundCanvasRef.current

        const foregroundCanvas =
            foregroundCanvasRef.current

        if (
            !backgroundCanvas ||
            !foregroundCanvas
        ) {
            return undefined
        }

        const backgroundContext =
            backgroundCanvas.getContext(
                '2d',
            )

        const foregroundContext =
            foregroundCanvas.getContext(
                '2d',
            )

        if (
            !backgroundContext ||
            !foregroundContext
        ) {
            return undefined
        }

        const particles =
            createParticles(
                "WHAT I'VE DONE",
            )

        let width = 1
        let height = 1

        let animationFrame =
            null

        const startTime =
            performance.now()

        const resize =
            () => {
                const parent =
                    backgroundCanvas.parentElement

                if (!parent) {
                    return
                }

                const rect =
                    parent.getBoundingClientRect()

                width =
                    Math.max(
                        1,
                        Math.floor(
                            rect.width,
                        ),
                    )

                height =
                    Math.max(
                        1,
                        Math.floor(
                            rect.height,
                        ),
                    )

                const dpr =
                    Math.min(
                        window.devicePixelRatio ||
                        1,
                        2,
                    )

                const canvases = [
                    backgroundCanvas,
                    foregroundCanvas,
                ]

                canvases.forEach(
                    (
                        canvas,
                    ) => {
                        canvas.width =
                            Math.floor(
                                width *
                                dpr,
                            )

                        canvas.height =
                            Math.floor(
                                height *
                                dpr,
                            )

                        canvas.style.width =
                            `${width}px`

                        canvas.style.height =
                            `${height}px`

                        const context =
                            canvas.getContext(
                                '2d',
                            )

                        context.setTransform(
                            dpr,
                            0,
                            0,
                            dpr,
                            0,
                            0,
                        )
                    },
                )
            }

        const drawLayer =
            (
                context,
                layer,
                vortex,
                intro,
                time,
            ) => {
                context.clearRect(
                    0,
                    0,
                    width,
                    height,
                )

                const centerX =
                    width / 2

                const centerY =
                    height / 2

                const textWidth =
                    Math.min(
                        width *
                        0.88,
                        1180,
                    )

                const textHeight =
                    textWidth *
                    0.262

                const vortexRadiusX =
                    width *
                    0.44

                const vortexRadiusY =
                    height *
                    0.32

                for (
                    let i = 0;
                    i <
                    particles.length;
                    i += 1
                ) {
                    const particle =
                        particles[i]

                    if (
                        particle.layer !==
                        layer
                    ) {
                        continue
                    }

                    /*
                     * Original text position.
                     */
                    const textX =
                        centerX +
                        particle.x *
                        textWidth

                    const textY =
                        centerY +
                        particle.y *
                        textHeight

                    /*
                     * Polar coordinates derived
                     * from the actual text particle.
                     *
                     * This is important:
                     * the vortex is created from
                     * the text itself rather than
                     * replacing it with random
                     * particles.
                     */
                    const radius =
                        Math.sqrt(
                            particle.x *
                            particle.x +
                            particle.y *
                            particle.y,
                        )

                    const normalizedRadius =
                        clamp(
                            radius /
                            1.05,
                        )

                    const originalAngle =
                        Math.atan2(
                            particle.y,
                            particle.x,
                        )

                    /*
                     * Very aggressive rotation
                     * around the 45% point.
                     */
                    const spin =
                        vortex *
                        (
                            3.5 +
                            normalizedRadius *
                            8.0
                        )

                    const vortexAngle =
                        originalAngle +
                        spin +
                        time *
                        0.004 *
                        vortex

                    /*
                     * Make the center of the
                     * vortex slightly tighter.
                     */
                    const radialCompression =
                        0.72 +
                        normalizedRadius *
                        0.48

                    const vortexX =
                        centerX +
                        Math.cos(
                            vortexAngle,
                        ) *
                        normalizedRadius *
                        vortexRadiusX *
                        radialCompression

                    const vortexY =
                        centerY +
                        Math.sin(
                            vortexAngle,
                        ) *
                        normalizedRadius *
                        vortexRadiusY *
                        radialCompression

                    /*
                     * Organic turbulence.
                     */
                    const wave =
                        Math.sin(
                            particle.seed +
                            time *
                            0.012 +
                            normalizedRadius *
                            18,
                        )

                    const wave2 =
                        Math.cos(
                            particle.seed *
                            2.3 +
                            time *
                            0.009,
                        )

                    const turbulenceX =
                        wave *
                        vortex *
                        (
                            12 +
                            normalizedRadius *
                            42
                        )

                    const turbulenceY =
                        wave2 *
                        vortex *
                        (
                            8 +
                            normalizedRadius *
                            30
                        )

                    /*
                     * Deep foreground movement.
                     */
                    const depth =
                        Math.sin(
                            vortexAngle *
                            2 +
                            normalizedRadius *
                            10 +
                            time *
                            0.012,
                        ) *
                        vortex

                    const targetX =
                        vortexX +
                        turbulenceX

                    const targetY =
                        vortexY +
                        turbulenceY

                    /*
                     * Interpolate between the
                     * original text and vortex.
                     */
                    let x =
                        textX +
                        (
                            targetX -
                            textX
                        ) *
                        vortex

                    let y =
                        textY +
                        (
                            targetY -
                            textY
                        ) *
                        vortex

                    /*
                     * Additional violent local
                     * movement.
                     */
                    x +=
                        Math.sin(
                            particle.seed *
                            3 +
                            time *
                            0.018,
                        ) *
                        vortex *
                        5

                    y +=
                        Math.cos(
                            particle.seed *
                            2 +
                            time *
                            0.015,
                        ) *
                        vortex *
                        4

                    /*
                     * Simulated z-depth.
                     */
                    const z =
                        depth *
                        (
                            45 +
                            normalizedRadius *
                            80
                        )

                    /*
                     * Foreground particles become
                     * visible as the vortex crosses
                     * the cards.
                     */
                    const foreground =
                        smoothstep(
                            (
                                vortex -
                                0.18
                            ) /
                            0.55,
                        )

                    let alpha

                    if (
                        layer === 1
                    ) {
                        alpha =
                            foreground
                    } else {
                        alpha =
                            1 -
                            foreground *
                            0.95
                    }

                    alpha *=
                        smoothstep(
                            intro,
                        )

                    if (
                        alpha <=
                        0.01
                    ) {
                        continue
                    }

                    const particleSize =
                        (
                            0.55 +
                            particle.random *
                            0.85
                        ) *
                        (
                            1 +
                            vortex *
                            1.15
                        )

                    const depthScale =
                        1 +
                        z *
                        0.004

                    context.globalAlpha =
                        alpha *
                        (
                            0.38 +
                            particle.random2 *
                            0.5
                        )

                    context.fillStyle =
                        '#c7b8a6'

                    context.beginPath()

                    context.arc(
                        x,
                        y - z,
                        particleSize *
                        depthScale,
                        0,
                        Math.PI *
                        2,
                    )

                    context.fill()
                }

                context.globalAlpha =
                    1
            }

        const render =
            (
                now,
            ) => {
                const elapsed =
                    now -
                    startTime

                /*
                 * Text forms naturally during
                 * the first 1.8 seconds.
                 */
                const intro =
                    clamp(
                        elapsed /
                        1800,
                    )

                const progress =
                    progressRef.current

                /*
                 * Vortex starts around 30%
                 * and reaches maximum force
                 * at approximately 45%.
                 */
                const vortexIn =
                    smoothstep(
                        (
                            progress -
                            0.30
                        ) /
                        0.15,
                    )

                /*
                 * It then slowly calms
                 * between 45% and 80%.
                 */
                const vortexOut =
                    smoothstep(
                        (
                            progress -
                            0.45
                        ) /
                        0.35,
                    )

                const vortex =
                    clamp(
                        vortexIn *
                        (
                            1 -
                            vortexOut
                        ),
                    )

                drawLayer(
                    backgroundContext,
                    0,
                    vortex,
                    intro,
                    elapsed,
                )

                drawLayer(
                    foregroundContext,
                    1,
                    vortex,
                    intro,
                    elapsed,
                )

                animationFrame =
                    window.requestAnimationFrame(
                        render,
                    )
            }

        resize()

        window.addEventListener(
            'resize',
            resize,
        )

        animationFrame =
            window.requestAnimationFrame(
                render,
            )

        return () => {
            window.removeEventListener(
                'resize',
                resize,
            )

            if (
                animationFrame !==
                null
            ) {
                window.cancelAnimationFrame(
                    animationFrame,
                )
            }
        }
    }, [])

    return (
        <Box
            sx={{
                position:
                    'absolute',

                inset: 0,

                overflow:
                    'hidden',

                pointerEvents:
                    'none',

                zIndex: 1,
            }}
        >
            <canvas
                ref={
                    backgroundCanvasRef
                }
                style={{
                    position:
                        'absolute',

                    inset: 0,

                    width:
                        '100%',

                    height:
                        '100%',

                    pointerEvents:
                        'none',

                    zIndex: 1,
                }}
            />

            <canvas
                ref={
                    foregroundCanvasRef
                }
                style={{
                    position:
                        'absolute',

                    inset: 0,

                    width:
                        '100%',

                    height:
                        '100%',

                    pointerEvents:
                        'none',

                    zIndex: 20,
                }}
            />
        </Box>
    )
}

export default WorkNebulaText