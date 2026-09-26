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

const TEXT_PARTICLE_RATIO = 0.58

const VORTEX_PARTICLE_RATIO = 0.95

const TEXT_WORLD_WIDTH = 8.9
const TEXT_WORLD_HEIGHT = 2.45

/*
 * Long horizontal ellipse.
 */
const VORTEX_WIDTH = 12.5
const VORTEX_HEIGHT = 3.2

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

/*
 * ----------------------------------------------------
 * TEXT TARGET
 * ----------------------------------------------------
 */

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
        canvas.getContext(
            '2d',
        )

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

        const index =
            particleIndex * 4

        /*
         * 58% of particles form
         * the initial text.
         */
        if (
            normalizedHash >
            TEXT_PARTICLE_RATIO
        ) {
            data[
                index + 3
            ] = 0

            continue
        }

        const candidateIndex =
            (
                particleIndex *
                15731 +
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
            TEXT_WORLD_WIDTH

        const worldY =
            -(
                localY /
                (
                    canvas.height / 2
                )
            ) *
            TEXT_WORLD_HEIGHT

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

        data[index] =
            worldX +
            jitterX

        data[index + 1] =
            worldY +
            jitterY

        data[index + 2] =
            jitterZ

        data[index + 3] =
            1
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

/*
 * ----------------------------------------------------
 * ELLIPSE TARGET
 * ----------------------------------------------------
 *
 * 95% of the entire particle population is recruited.
 *
 * The target itself is a long horizontal ellipse.
 * No additional tornado tearing is applied here yet.
 */
const createVortexTargetTexture = (
    textTexture,
) => {
    if (!textTexture) {
        return null
    }

    const data =
        new Float32Array(
            PARTICLE_COUNT * 4,
        )

    const randomFor = (
        particleIndex,
        offset = 0,
    ) => {
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
         * 95% of all particles.
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
            ] = 0

            continue
        }

        /*
         * ------------------------------------------
         * RECTANGLE
         * ------------------------------------------
         *
         * EXACTLY the same bounding dimensions
         * as the original text.
         */
        const x =
            (
                randomFor(
                    particleIndex,
                    101,
                ) -
                0.5
            ) *
            VORTEX_WIDTH

        const y =
            (
                randomFor(
                    particleIndex,
                    151,
                ) -
                0.5
            ) *
            VORTEX_HEIGHT

        /*
         * Small depth distribution only.
         */
        const z =
            (
                randomFor(
                    particleIndex,
                    211,
                ) -
                0.5
            ) *
            0.8

        data[index] =
            x

        data[index + 1] =
            y

        data[index + 2] =
            z

        data[index + 3] =
            1
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

    /*
     * ------------------------------------------
     * SCROLL PROGRESS
     * ------------------------------------------
     */

    const updateProgress = () => {
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

    /*
     * ------------------------------------------
     * CREATE TARGETS
     * ------------------------------------------
     */

    useEffect(() => {
        const textTexture =
            createTextTargetTexture(
                'WHAT I\'VE DONE',
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

    /*
     * ------------------------------------------
     * SCROLL LISTENER
     * ------------------------------------------
     */

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

    /*
     * ------------------------------------------
     * TORNADO / ELLIPSE ANIMATION
     * ------------------------------------------
     */

    useEffect(() => {
        if (
            !textTargetTexture ||
            !vortexTargetTexture
        ) {
            return undefined
        }

        /*
         * Immutable original text.
         */
        const baseTextData =
            new Float32Array(
                textTargetTexture.image.data,
            )

        /*
         * Mutable target used by the nebula.
         */
        const dynamicData =
            textTargetTexture.image.data

        const vortexData =
            vortexTargetTexture.image.data

        let animationFrame =
            null

        const frame = () => {
            const progress =
                progressRef.current

            /*
             * --------------------------------------
             * 0 -> 45%
             * TEXT -> ELLIPSE
             * --------------------------------------
             */
            const vortexIn =
                smoothstep(
                    0,
                    0.45,
                    progress,
                )

            /*
             * --------------------------------------
             * 45 -> 85%
             * ELLIPSE -> TEXT
             * --------------------------------------
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
                vortexAmount = 0
            }

            if (
                progress >= 0.85
            ) {
                vortexAmount = 0
            }

            /*
             * --------------------------------------
             * ANGER
             * --------------------------------------
             */

            const anger =
                Math.pow(
                    vortexAmount,
                    1.08,
                )

            const time =
                performance.now() *
                0.001

            /*
             * --------------------------------------
             * GLOBAL ROTATION
             * --------------------------------------
             */

            const rotation =
                time *
                (
                    2.0 +
                    anger *
                    28.0
                )

            const cos =
                Math.cos(
                    rotation,
                )

            const sin =
                Math.sin(
                    rotation,
                )

            /*
             * --------------------------------------
             * SHEAR CLOCK
             * --------------------------------------
             */

            const shearTime =
                time *
                (
                    5.0 +
                    anger *
                    24.0
                )

            for (
                let particleIndex = 0;
                particleIndex <
                PARTICLE_COUNT;
                particleIndex += 1
            ) {
                const index =
                    particleIndex * 4

                const baseAlive =
                    baseTextData[
                    index + 3
                    ]

                const vortexAlive =
                    vortexData[
                    index + 3
                    ]

                /*
                 * Particles not recruited into
                 * the ellipse remain as original text.
                 */
                if (
                    vortexAlive === 0
                ) {
                    dynamicData[
                        index + 3
                    ] =
                        baseAlive

                    if (
                        baseAlive > 0
                    ) {
                        dynamicData[
                            index
                        ] =
                            baseTextData[
                            index
                            ]

                        dynamicData[
                            index + 1
                        ] =
                            baseTextData[
                            index + 1
                            ]

                        dynamicData[
                            index + 2
                        ] =
                            baseTextData[
                            index + 2
                            ]
                    }

                    continue
                }

                /*
                 * ----------------------------------
                 * ORIGINAL TEXT POSITION
                 * ----------------------------------
                 */

                const tx =
                    baseAlive > 0
                        ? baseTextData[
                        index
                        ]
                        : 0

                const ty =
                    baseAlive > 0
                        ? baseTextData[
                        index + 1
                        ]
                        : 0

                const tz =
                    baseAlive > 0
                        ? baseTextData[
                        index + 2
                        ]
                        : 0

                /*
                 * ----------------------------------
                 * ELLIPSE POSITION
                 * ----------------------------------
                 */

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
                 * ----------------------------------
                 * GLOBAL ROTATION
                 * ----------------------------------
                 */

                let rx =
                    (
                        vx * cos
                    ) -
                    (
                        vy * sin
                    )

                let ry =
                    (
                        vx * sin
                    ) +
                    (
                        vy * cos
                    )

                /*
                 * ----------------------------------
                 * POSITION RATIOS
                 * ----------------------------------
                 */

                const horizontalRatio =
                    clamp(
                        Math.abs(
                            vx /
                            (
                                VORTEX_WIDTH *
                                0.5
                            ),
                        ),
                    )

                const verticalRatio =
                    clamp(
                        Math.abs(
                            vy /
                            (
                                VORTEX_HEIGHT *
                                0.5
                            ),
                        ),
                    )

                const edgeForce =
                    Math.pow(
                        horizontalRatio,
                        1.25,
                    )

                /*
                 * ----------------------------------
                 * HIGH-FREQUENCY MOTION
                 * ----------------------------------
                 */

                const waveA =
                    Math.sin(
                        shearTime +
                        particleIndex *
                        0.011 +
                        vx *
                        2.4,
                    )

                const waveB =
                    Math.cos(
                        time *
                        (
                            7 +
                            anger *
                            25
                        ) +
                        particleIndex *
                        0.017 +
                        vy *
                        3.8,
                    )

                const waveC =
                    Math.sin(
                        time *
                        (
                            4 +
                            anger *
                            19
                        ) +
                        particleIndex *
                        0.029 +
                        vx *
                        5.0,
                    )

                /*
                 * ----------------------------------
                 * SHEAR
                 * ----------------------------------
                 */

                rx +=
                    waveA *
                    anger *
                    (
                        0.12 +
                        edgeForce *
                        1.85
                    )

                ry +=
                    waveB *
                    anger *
                    (
                        0.10 +
                        verticalRatio *
                        1.05
                    )

                /*
                 * ----------------------------------
                 * TANGENTIAL THROW
                 * ----------------------------------
                 */

                const length =
                    Math.sqrt(
                        rx * rx +
                        ry * ry,
                    )

                const safeLength =
                    Math.max(
                        0.001,
                        length,
                    )

                const tangentX =
                    -ry /
                    safeLength

                const tangentY =
                    rx /
                    safeLength

                const throwAmount =
                    anger *
                    (
                        0.28 +
                        edgeForce *
                        1.45
                    )

                rx +=
                    tangentX *
                    throwAmount *
                    waveC

                ry +=
                    tangentY *
                    throwAmount *
                    waveC

                /*
                 * ----------------------------------
                 * RADIAL FORCE
                 * ----------------------------------
                 */

                const radialX =
                    rx /
                    safeLength

                const radialY =
                    ry /
                    safeLength

                const radialForce =
                    anger *
                    edgeForce *
                    0.65

                rx +=
                    radialX *
                    radialForce

                ry +=
                    radialY *
                    radialForce

                /*
                 * ----------------------------------
                 * FINAL TEXT / ELLIPSE BLEND
                 * ----------------------------------
                 */

                dynamicData[
                    index
                ] =
                    (
                        tx *
                        (
                            1 -
                            vortexAmount
                        )
                    ) +
                    (
                        rx *
                        vortexAmount
                    )

                dynamicData[
                    index + 1
                ] =
                    (
                        ty *
                        (
                            1 -
                            vortexAmount
                        )
                    ) +
                    (
                        ry *
                        vortexAmount
                    )

                dynamicData[
                    index + 2
                ] =
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
                 * Recruit the full 95% ellipse
                 * population during transformation.
                 */
                dynamicData[
                    index + 3
                ] =
                    vortexAmount > 0.001
                        ? vortexAlive
                        : baseAlive
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

    /*
     * ------------------------------------------
     * FIXED NEBULA
     * ------------------------------------------
     */

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

                    inset:
                        0,

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