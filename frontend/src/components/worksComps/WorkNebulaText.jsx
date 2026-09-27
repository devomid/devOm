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

const RECTANGLE_PARTICLE_RATIO = 0.80

const TEXT_WORLD_WIDTH = 8.9
const TEXT_WORLD_HEIGHT = 2.45

const RECTANGLE_WIDTH =
    TEXT_WORLD_WIDTH

const RECTANGLE_HEIGHT =
    TEXT_WORLD_HEIGHT

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
 * CLOUD TARGET
 * ----------------------------------------------------
 *
 * This is intentionally ONLY a particle cloud.
 *
 * No:
 * - Gaussian masses
 * - center attractor
 * - radial distribution
 * - angular waves
 * - edge waves
 * - rotation
 * - ellipse
 * - diagonal structures
 * - depth structure
 * - secondary shapes
 *
 * Every recruited particle is distributed uniformly
 * across the same rectangular area.
 * ----------------------------------------------------
 */

const createRectangleTargetTexture = () => {
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
         * Use only 80% of the total particles.
         *
         * This keeps the cloud substantially lighter
         * than the previous 95% version.
         */
        if (
            randomFor(
                particleIndex,
                991,
            ) >
            RECTANGLE_PARTICLE_RATIO
        ) {
            data[
                index + 3
            ] = 0

            continue
        }

        /*
         * Uniform X distribution.
         */
        const x =
            (
                randomFor(
                    particleIndex,
                    101,
                ) -
                0.5
            ) *
            RECTANGLE_WIDTH

        /*
         * Uniform Y distribution.
         */
        const y =
            (
                randomFor(
                    particleIndex,
                    151,
                ) -
                0.5
            ) *
            RECTANGLE_HEIGHT

        /*
         * Completely flat cloud.
         */
        const z = 0

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
        rectangleTargetTexture,
        setRectangleTargetTexture,
    ] = useState(null)

    const progressRef =
        useRef(0)

    const rectangleStrengthRef =
        useRef(0)

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

    useEffect(() => {
        const textTexture =
            createTextTargetTexture(
                'WHAT I\'VE DONE',
            )

        if (!textTexture) {
            return undefined
        }

        const rectangleTexture =
            createRectangleTargetTexture()

        setTextTargetTexture(
            textTexture,
        )

        setRectangleTargetTexture(
            rectangleTexture,
        )

        return () => {
            textTexture.dispose()
            rectangleTexture.dispose()
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
            !rectangleTargetTexture
        ) {
            return undefined
        }

        const baseTextData =
            new Float32Array(
                textTargetTexture.image.data,
            )

        const dynamicData =
            textTargetTexture.image.data

        const rectangleData =
            rectangleTargetTexture.image.data

        let animationFrame =
            null

        const frame = () => {
            const progress =
                progressRef.current

            let rectangleAmount

            if (
                progress <= 0.5
            ) {
                rectangleAmount =
                    smoothstep(
                        0,
                        0.5,
                        progress,
                    )
            } else {
                rectangleAmount =
                    1 -
                    smoothstep(
                        0.5,
                        1,
                        progress,
                    )
            }

            rectangleStrengthRef.current =
                rectangleAmount

            for (
                let particleIndex = 0;
                particleIndex <
                PARTICLE_COUNT;
                particleIndex += 1
            ) {
                const index =
                    particleIndex * 4

                const textAlive =
                    baseTextData[
                    index + 3
                    ]

                const rectangleAlive =
                    rectangleData[
                    index + 3
                    ]

                if (
                    rectangleAlive === 0
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

                    dynamicData[
                        index + 3
                    ] =
                        textAlive

                    continue
                }

                const tx =
                    textAlive > 0
                        ? baseTextData[
                        index
                        ]
                        : 0

                const ty =
                    textAlive > 0
                        ? baseTextData[
                        index + 1
                        ]
                        : 0

                const tz =
                    textAlive > 0
                        ? baseTextData[
                        index + 2
                        ]
                        : 0

                const rx =
                    rectangleData[
                    index
                    ]

                const ry =
                    rectangleData[
                    index + 1
                    ]

                const rz =
                    rectangleData[
                    index + 2
                    ]

                dynamicData[
                    index
                ] =
                    (
                        tx *
                        (
                            1 -
                            rectangleAmount
                        )
                    ) +
                    (
                        rx *
                        rectangleAmount
                    )

                dynamicData[
                    index + 1
                ] =
                    (
                        ty *
                        (
                            1 -
                            rectangleAmount
                        )
                    ) +
                    (
                        ry *
                        rectangleAmount
                    )

                dynamicData[
                    index + 2
                ] =
                    (
                        tz *
                        (
                            1 -
                            rectangleAmount
                        )
                    ) +
                    (
                        rz *
                        rectangleAmount
                    )

                if (
                    rectangleAmount >
                    0.001
                ) {
                    dynamicData[
                        index + 3
                    ] =
                        rectangleAlive
                } else {
                    dynamicData[
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

            rectangleStrengthRef.current =
                0
        }
    }, [
        textTargetTexture,
        rectangleTargetTexture,
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

                    rectangleStrengthRef={
                        rectangleStrengthRef
                    }
                />
            </div>
        </main>
    )
}

export default WorkNebulaText