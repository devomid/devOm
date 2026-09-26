import {
    useEffect,
    useRef,
    useState,
} from 'react'

import * as THREE from 'three'

import NebulaBackground from '../nebula/nebula'

const TEXTURE_SIZE = 512

const PARTICLE_COUNT =
    TEXTURE_SIZE *
    TEXTURE_SIZE

/*
 * This controls how many particles
 * form the actual text.
 *
 * Keep this lower than the vortex
 * participation.
 */
const TEXT_PARTICLE_RATIO = 0.58

/*
 * Percentage of the COMPLETE particle
 * population that participates in the
 * tornado.
 */
const VORTEX_PARTICLE_RATIO = 0.94

const WORLD_WIDTH = 8.9
const WORLD_HEIGHT = 2.45

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
    edge0,
    edge1,
    value,
) => {
    const t =
        clamp(
            (
                value -
                edge0
            ) /
            (
                edge1 -
                edge0
            ),
        )

    return (
        t *
        t *
        (
            3 -
            2 * t
        )
    )
}

const createTextTargetTexture = (
    text,
) => {
    const data =
        new Float32Array(
            PARTICLE_COUNT * 4,
        )

    const canvas =
        document.createElement(
            'canvas',
        )

    canvas.width = 1600
    canvas.height = 420

    const context =
        canvas.getContext('2d')

    if (!context) {
        return null
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

    for (
        let y = 0;
        y < canvas.height;
        y += 1
    ) {
        for (
            let x = 0;
            x < canvas.width;
            x += 1
        ) {
            const pixelIndex =
                (
                    y *
                    canvas.width +
                    x
                ) *
                4

            const alpha =
                image.data[
                    pixelIndex + 3
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
        candidates.length === 0
    ) {
        return null
    }

    const centerX =
        canvas.width / 2

    const centerY =
        canvas.height / 2

    for (
        let particleIndex = 0;
        particleIndex <
        PARTICLE_COUNT;
        particleIndex += 1
    ) {
        const hash =
            (
                particleIndex *
                1664525 +
                1013904223
            ) >>> 0

        const normalizedHash =
            hash /
            4294967295

        const textureIndex =
            particleIndex * 4

        /*
         * Only 58% form the text.
         * The rest remain normal nebula
         * particles until the vortex
         * recruits them.
         */
        if (
            normalizedHash >
            TEXT_PARTICLE_RATIO
        ) {
            data[
                textureIndex + 3
            ] = 0.0

            continue
        }

        const candidateIndex =
            (
                (
                    particleIndex *
                    15731
                ) +
                789221
            ) %
            candidates.length

        const candidate =
            candidates[
                candidateIndex
            ]

        const variation =
            particleIndex *
            0.0137

        const localX =
            candidate.x -
            centerX

        const localY =
            candidate.y -
            centerY

        const worldX =
            (
                localX /
                (
                    canvas.width / 2
                )
            ) *
            WORLD_WIDTH

        const worldY =
            -(
                localY /
                (
                    canvas.height / 2
                )
            ) *
            WORLD_HEIGHT

        const jitterX =
            Math.sin(
                variation *
                1.71,
            ) *
            0.008

        const jitterY =
            Math.cos(
                variation *
                1.43,
            ) *
            0.008

        const jitterZ =
            Math.sin(
                variation *
                0.91,
            ) *
            0.025

        data[
            textureIndex
        ] =
            worldX +
            jitterX

        data[
            textureIndex + 1
        ] =
            worldY +
            jitterY

        data[
            textureIndex + 2
        ] =
            jitterZ

        data[
            textureIndex + 3
        ] =
            1.0
    }

    const texture =
        new THREE.DataTexture(
            data,
            TEXTURE_SIZE,
            TEXTURE_SIZE,
            THREE.RGBAFormat,
            THREE.FloatType,
        )

    texture.minFilter =
        THREE.NearestFilter

    texture.magFilter =
        THREE.NearestFilter

    texture.wrapS =
        THREE.ClampToEdgeWrapping

    texture.wrapT =
        THREE.ClampToEdgeWrapping

    texture.generateMipmaps =
        false

    texture.needsUpdate =
        true

    return texture
}

const createVortexTargetTexture = (
    textTexture,
) => {
    if (!textTexture) {
        return null
    }

    const textData =
        textTexture.image.data

    const data =
        new Float32Array(
            PARTICLE_COUNT * 4,
        )

    const randomFor =
        (particleIndex, offset = 0) => {
            const value =
                (
                    (
                        particleIndex +
                        offset
                    ) *
                    1103515245 +
                    12345
                ) >>> 0

            return (
                value /
                4294967295
            )
        }

    for (
        let particleIndex = 0;
        particleIndex <
        PARTICLE_COUNT;
        particleIndex += 1
    ) {
        const index =
            particleIndex * 4

        /*
         * Approximately 94% of the COMPLETE
         * nebula participates in the vortex.
         */
        if (
            randomFor(
                particleIndex,
                991,
            ) >
            VORTEX_PARTICLE_RATIO
        ) {
            data[
                index + 3
            ] = 0.0

            continue
        }

        const textAlive =
            textData[
                index + 3
            ]

        /*
         * Some particles originate from the
         * text, while the recruited particles
         * originate from the surrounding field.
         */
        let sourceX = 0
        let sourceY = 0
        let sourceZ = 0

        if (
            textAlive > 0
        ) {
            sourceX =
                textData[
                    index
                ]

            sourceY =
                textData[
                    index + 1
                ]

            sourceZ =
                textData[
                    index + 2
                ]
        } else {
            sourceX =
                (
                    randomFor(
                        particleIndex,
                        17,
                    ) -
                    0.5
                ) *
                10

            sourceY =
                (
                    randomFor(
                        particleIndex,
                        31,
                    ) -
                    0.5
                ) *
                6

            sourceZ =
                (
                    randomFor(
                        particleIndex,
                        47,
                    ) -
                    0.5
                ) *
                2
        }

        /*
         * ------------------------------------------------
         * VORTEX GEOMETRY
         * ------------------------------------------------
         *
         * Instead of distributing particles on a
         * circle, distribute them across a VERY WIDE
         * rectangular/elliptical sheet.
         */

        const u =
            randomFor(
                particleIndex,
                101,
            )

        const v =
            randomFor(
                particleIndex,
                151,
            )

        const depth =
            randomFor(
                particleIndex,
                211,
            )

        /*
         * Horizontal distribution.
         *
         * Almost the full width of the viewport.
         */
        const baseX =
            (
                u -
                0.5
            ) *
            9.6

        /*
         * Vertical distribution.
         *
         * Much shorter than width.
         *
         * This is what makes the vortex
         * rectangular rather than spherical.
         */
        const baseY =
            (
                v -
                0.5
            ) *
            3.1

        /*
         * Give the center more density.
         */
        const centerBias =
            Math.pow(
                randomFor(
                    particleIndex,
                    271,
                ),
                1.8,
            )

        const compressedY =
            baseY *
            (
                0.45 +
                centerBias *
                0.55
            )

        /*
         * Strong horizontal bands.
         *
         * These create the torn layers
         * inside the tornado.
         */
        const bandWave =
            Math.sin(
                (
                    baseX *
                    3.2
                ) +
                (
                    baseY *
                    7.5
                ) +
                particleIndex *
                0.013,
            )

        /*
         * Shear becomes stronger toward
         * the outer edges.
         */
        const edge =
            Math.abs(
                baseX /
                4.8,
            )

        const shear =
            bandWave *
            (
                0.08 +
                edge *
                0.9
            )

        /*
         * Vertical tearing.
         */
        const tear =
            Math.sin(
                (
                    baseX *
                    4.8
                ) +
                particleIndex *
                0.027,
            ) *
            (
                0.04 +
                edge *
                0.32
            )

        let vortexX =
            baseX +
            shear

        let vortexY =
            compressedY +
            tear

        /*
         * Strong depth.
         *
         * This prevents the vortex from looking
         * like a flat 2D blob.
         */
        const vortexZ =
            (
                depth -
                0.5
            ) *
            (
                1.6 +
                edge *
                1.5
            )

        /*
         * ------------------------------------------------
         * SPIRAL FIELD
         * ------------------------------------------------
         *
         * Rotate the entire rectangular mass around
         * its center, but also introduce differential
         * rotation so it twists apart.
         */

        const radius =
            Math.sqrt(
                (
                    vortexX *
                    vortexX
                ) +
                (
                    vortexY *
                    vortexY
                ),
            )

        const normalizedRadius =
            clamp(
                radius /
                5.2,
            )

        const originalAngle =
            Math.atan2(
                vortexY,
                vortexX,
            )

        /*
         * Huge angular displacement.
         *
         * Outer particles rotate more.
         */
        const spiralAmount =
            (
                2.5 +
                normalizedRadius *
                9.5
            )

        const angle =
            originalAngle +
            spiralAmount

        const cos =
            Math.cos(
                angle,
            )

        const sin =
            Math.sin(
                angle,
            )

        const rotatedX =
            (
                vortexX *
                cos
            ) -
            (
                vortexY *
                sin
            )

        const rotatedY =
            (
                vortexX *
                sin
            ) +
            (
                vortexY *
                cos
            )

        /*
         * ------------------------------------------------
         * ANGULAR AGITATION
         * ------------------------------------------------
         *
         * These waves prevent the vortex from becoming
         * a clean mathematical rectangle.
         */

        const turbulenceA =
            Math.sin(
                particleIndex *
                0.043 +
                radius *
                8.0,
            )

        const turbulenceB =
            Math.cos(
                particleIndex *
                0.031 +
                radius *
                13.0,
            )

        const turbulenceC =
            Math.sin(
                particleIndex *
                0.019 +
                radius *
                21.0,
            )

        const violentX =
            turbulenceA *
            (
                0.15 +
                normalizedRadius *
                0.8
            )

        const violentY =
            turbulenceB *
            (
                0.12 +
                normalizedRadius *
                0.65
            )

        /*
         * Tangential displacement.
         *
         * This creates the impression that the
         * particles are being thrown around the
         * vortex rather than simply occupying it.
         */
        const tangential =
            turbulenceC *
            (
                0.1 +
                normalizedRadius *
                0.75
            )

        const tangentX =
            -sin *
            tangential

        const tangentY =
            cos *
            tangential

        data[
            index
        ] =
            rotatedX +
            violentX +
            tangentX

        data[
            index + 1
        ] =
            rotatedY +
            violentY +
            tangentY

        data[
            index + 2
        ] =
            vortexZ +
            sourceZ *
            0.05

        data[
            index + 3
        ] = 1.0

        /*
         * Keep references alive so the source
         * population remains conceptually tied
         * to the original nebula.
         */
        void sourceX
        void sourceY
    }

    const texture =
        new THREE.DataTexture(
            data,
            TEXTURE_SIZE,
            TEXTURE_SIZE,
            THREE.RGBAFormat,
            THREE.FloatType,
        )

    texture.minFilter =
        THREE.NearestFilter

    texture.magFilter =
        THREE.NearestFilter

    texture.wrapS =
        THREE.ClampToEdgeWrapping

    texture.wrapT =
        THREE.ClampToEdgeWrapping

    texture.generateMipmaps =
        false

    texture.needsUpdate =
        true

    return texture
}

const WorkNebulaText = () => {
    const [
        textTargetTexture,
        setTextTargetTexture,
    ] = useState(null)

    const [
        vortexTargetTexture,
        setVortexTargetTexture,
    ] = useState(null)

    const progressRef =
        useRef(0)

    const updateProgress =
        () => {
            const scrollY =
                window.scrollY

            const maxScroll =
                Math.max(
                    1,
                    document.documentElement
                        .scrollHeight -
                    window.innerHeight,
                )

            progressRef.current =
                clamp(
                    scrollY /
                    maxScroll,
                )
        }

    useEffect(() => {
        const textTexture =
            createTextTargetTexture(
                "WHAT I'VE DONE",
            )

        if (!textTexture) {
            return undefined
        }

        const vortexTexture =
            createVortexTargetTexture(
                textTexture,
            )

        setTextTargetTexture(
            textTexture,
        )

        setVortexTargetTexture(
            vortexTexture,
        )

        return () => {
            textTexture.dispose()
            vortexTexture?.dispose()
        }
    }, [])

    useEffect(() => {
        updateProgress()

        const handleScroll =
            () => {
                updateProgress()
            }

        window.addEventListener(
            'scroll',
            handleScroll,
            {
                passive: true,
            },
        )

        window.addEventListener(
            'resize',
            updateProgress,
        )

        return () => {
            window.removeEventListener(
                'scroll',
                handleScroll,
            )

            window.removeEventListener(
                'resize',
                updateProgress,
            )
        }
    }, [])

    useEffect(() => {
        if (
            !textTargetTexture ||
            !vortexTargetTexture
        ) {
            return undefined
        }

        const textData =
            textTargetTexture.image.data

        const vortexData =
            vortexTargetTexture.image.data

        let animationFrame = null

        const frame =
            () => {
                const progress =
                    progressRef.current

                /*
                 * 0 -> 45%
                 *
                 * Build the vortex.
                 */
                const vortexIn =
                    smoothstep(
                        0,
                        0.45,
                        progress,
                    )

                /*
                 * 45 -> 85%
                 *
                 * Destroy the vortex and
                 * reform the text.
                 */
                const vortexOut =
                    smoothstep(
                        0.45,
                        0.85,
                        progress,
                    )

                let vortexAmount

                if (
                    progress <= 0.45
                ) {
                    vortexAmount =
                        vortexIn
                } else if (
                    progress < 0.85
                ) {
                    vortexAmount =
                        1 -
                        vortexOut
                } else {
                    vortexAmount =
                        0
                }

                /*
                 * Nothing changes after 85%.
                 */
                if (
                    progress >= 0.85
                ) {
                    vortexAmount = 0
                }

                const time =
                    performance.now() *
                    0.001

                /*
                 * Very aggressive rotation.
                 * The vortex is calm at the start,
                 * then becomes increasingly angry.
                 */
                const anger =
                    Math.pow(
                        vortexAmount,
                        1.35,
                    )

                const rotation =
                    time *
                    (
                        1.5 +
                        anger *
                        12.0
                    )

                const cos =
                    Math.cos(
                        rotation,
                    )

                const sin =
                    Math.sin(
                        rotation,
                    )

                for (
                    let particleIndex = 0;
                    particleIndex <
                    PARTICLE_COUNT;
                    particleIndex += 1
                ) {
                    const index =
                        particleIndex * 4

                    const textAlive =
                        textData[
                            index + 3
                        ]

                    const vortexAlive =
                        vortexData[
                            index + 3
                        ]

                    /*
                     * Particle is not part of
                     * the tornado.
                     */
                    if (
                        vortexAlive === 0
                    ) {
                        continue
                    }

                    const tx =
                        textAlive > 0
                            ? textData[
                                index
                            ]
                            : 0

                    const ty =
                        textAlive > 0
                            ? textData[
                                index + 1
                            ]
                            : 0

                    const tz =
                        textAlive > 0
                            ? textData[
                                index + 2
                            ]
                            : 0

                    const vx =
                        vortexData[
                            index
                        ]

                    const vy =
                        vortexData[
                            index + 1
                        ]

                    const vz =
                        vortexData[
                            index + 2
                        ]

                    /*
                     * Continuous rotation makes
                     * the tornado feel alive.
                     */
                    const rx =
                        (
                            vx *
                            cos
                        ) -
                        (
                            vy *
                            sin
                        )

                    const ry =
                        (
                            vx *
                            sin
                        ) +
                        (
                            vy *
                            cos
                        )

                    /*
                     * Individual particle agitation.
                     */
                    const particleAngle =
                        (
                            particleIndex *
                            0.021
                        ) +
                        (
                            time *
                            (
                                5 +
                                anger * 18
                            )
                        )

                    const wave =
                        Math.sin(
                            particleAngle,
                        )

                    const wave2 =
                        Math.cos(
                            (
                                particleIndex *
                                0.017
                            ) +
                            time *
                            (
                                7 +
                                anger * 11
                            ),
                        )

                    const agitation =
                        anger *
                        (
                            0.12 +
                            (
                                Math.abs(
                                    vx,
                                ) +
                                Math.abs(
                                    vy,
                                )
                            ) *
                            0.035
                        )

                    const aggressiveX =
                        wave *
                        agitation

                    const aggressiveY =
                        wave2 *
                        agitation

                    /*
                     * During formation the vortex
                     * dominates.
                     *
                     * During reform the text target
                     * takes control again.
                     */
                    const targetX =
                        (
                            tx *
                            (
                                1 -
                                vortexAmount
                            )
                        ) +
                        (
                            (
                                rx +
                                aggressiveX
                            ) *
                            vortexAmount
                        )

                    const targetY =
                        (
                            ty *
                            (
                                1 -
                                vortexAmount
                            )
                        ) +
                        (
                            (
                                ry +
                                aggressiveY
                            ) *
                            vortexAmount
                        )

                    const targetZ =
                        (
                            tz *
                            (
                                1 -
                                vortexAmount
                            )
                        ) +
                        (
                            vz *
                            vortexAmount
                        )

                    /*
                     * Write the dynamic target
                     * back into the texture used
                     * by the existing nebula engine.
                     */
                    textData[
                        index
                    ] =
                        targetX

                    textData[
                        index + 1
                    ] =
                        targetY

                    textData[
                        index + 2
                    ] =
                        targetZ

                    /*
                     * During the vortex, every
                     * recruited particle must
                     * become active.
                     *
                     * Once the vortex disappears,
                     * only the original text
                     * particles remain active.
                     */
                    if (
                        vortexAmount > 0.001
                    ) {
                        textData[
                            index + 3
                        ] =
                            vortexAlive
                    } else {
                        textData[
                            index + 3
                        ] =
                            textAlive
                    }
                }

                textTargetTexture.needsUpdate =
                    true

                animationFrame =
                    window.requestAnimationFrame(
                        frame,
                    )
            }

        animationFrame =
            window.requestAnimationFrame(
                frame,
            )

        return () => {
            if (
                animationFrame !== null
            ) {
                window.cancelAnimationFrame(
                    animationFrame,
                )
            }
        }
    }, [
        textTargetTexture,
        vortexTargetTexture,
    ])

    return (
        <main
            style={{
                position:
                    'relative',

                width:
                    '100%',

                height:
                    '300vh',

                background:
                    '#050403',
            }}
        >
            <div
                style={{
                    position:
                        'fixed',

                    inset: 0,

                    width:
                        '100%',

                    height:
                        '100vh',

                    overflow:
                        'hidden',

                    pointerEvents:
                        'none',
                }}
            >
                <NebulaBackground
                    textEnabled={
                        Boolean(
                            textTargetTexture,
                        )
                    }

                    textTargetTexture={
                        textTargetTexture
                    }

                    textStrength={
                        1.0
                    }
                />
            </div>
        </main>
    )
}

export default WorkNebulaText