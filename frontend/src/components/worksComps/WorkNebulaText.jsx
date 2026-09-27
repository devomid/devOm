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

const TEXT_WORLD_WIDTH = 8.9
const TEXT_WORLD_HEIGHT = 2.45

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
                variation * 1.71,
            ) *
            0.008

        const jitterY =
            Math.cos(
                variation * 1.43,
            ) *
            0.008

        const jitterZ =
            Math.sin(
                variation * 0.91,
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
 * One destination for every existing particle.
 *
 * The particles occupy a broad rounded rectangular
 * field. There is no second particle population and
 * no separate geometry.
 *
 * Corners become progressively sparse rather than
 * producing a hard rectangular edge.
 * ----------------------------------------------------
 */

const createCloudTargetTexture = () => {
    const data =
        new Float32Array(
            PARTICLE_COUNT * 4,
        )

    /*
     * Slightly smaller footprint than before.
     *
     * Fewer particles are assigned to the cloud,
     * but they occupy a smaller area, making the
     * rectangle visibly denser.
     */
    const cloudWidth =
        15.8

    const cloudHeight =
        6.25

    const halfWidth =
        cloudWidth * 0.5

    const halfHeight =
        cloudHeight * 0.5

    const cornerRadius =
        1.05

    /*
     * About 78% of the existing particles form
     * the cloud.
     *
     * The remaining ~22% have alpha = 0 and therefore
     * do NOT receive a cloud target. They remain part
     * of the normal free-moving nebula.
     */
    const CLOUD_PARTICLE_RATIO =
        0.78

    const randomFor = (
        particleIndex,
        offset = 0,
    ) => {
        let value =
            (
                (
                    particleIndex +
                    1
                ) *
                1664525 +
                1013904223 +
                offset *
                374761393
            ) >>> 0

        value =
            (
                value ^
                (
                    value >>> 16
                )
            ) >>> 0

        value =
            (
                value *
                2246822519
            ) >>> 0

        return (
            value /
            4294967295
        )
    }

    const isInsideRoundedRectangle = (
        x,
        y,
    ) => {
        const ax =
            Math.abs(x)

        const ay =
            Math.abs(y)

        const innerWidth =
            halfWidth -
            cornerRadius

        const innerHeight =
            halfHeight -
            cornerRadius

        /*
         * Main horizontal body.
         */
        if (
            ax <=
            innerWidth
        ) {
            return (
                ay <=
                halfHeight
            )
        }

        /*
         * Main vertical body.
         */
        if (
            ay <=
            innerHeight
        ) {
            return (
                ax <=
                halfWidth
            )
        }

        /*
         * Rounded corner.
         */
        const dx =
            ax -
            innerWidth

        const dy =
            ay -
            innerHeight

        return (
            dx * dx +
            dy * dy
        ) <=
            cornerRadius *
            cornerRadius
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
         * --------------------------------------------
         * FREE PARTICLES
         * --------------------------------------------
         *
         * These particles have no cloud target.
         *
         * The velocity shader sees cloudTarget.a = 0
         * and therefore leaves them completely alone.
         */
        const cloudMembership =
            randomFor(
                particleIndex,
                17,
            )

        if (
            cloudMembership >
            CLOUD_PARTICLE_RATIO
        ) {
            data[index] =
                0

            data[index + 1] =
                0

            data[index + 2] =
                0

            data[index + 3] =
                0

            continue
        }

        let x = 0
        let y = 0

        /*
         * --------------------------------------------
         * CLOUD POSITION
         * --------------------------------------------
         *
         * Rejection sampling gives the particles a
         * genuinely rectangular distribution instead
         * of making them follow an ellipse.
         */
        for (
            let attempt = 0;
            attempt < 16;
            attempt += 1
        ) {
            const candidateX =
                (
                    randomFor(
                        particleIndex,
                        100 +
                        attempt * 11,
                    ) -
                    0.5
                ) *
                cloudWidth

            const candidateY =
                (
                    randomFor(
                        particleIndex,
                        200 +
                        attempt * 17,
                    ) -
                    0.5
                ) *
                cloudHeight

            if (
                isInsideRoundedRectangle(
                    candidateX,
                    candidateY,
                )
            ) {
                x =
                    candidateX

                y =
                    candidateY

                break
            }

            /*
             * Guaranteed fallback inside the main body.
             */
            if (
                attempt === 15
            ) {
                x =
                    (
                        randomFor(
                            particleIndex,
                            401,
                        ) -
                        0.5
                    ) *
                    (
                        cloudWidth -
                        cornerRadius *
                        0.75
                    )

                y =
                    (
                        randomFor(
                            particleIndex,
                            503,
                        ) -
                        0.5
                    ) *
                    (
                        cloudHeight -
                        cornerRadius *
                        0.75
                    )
            }
        }

        /*
         * --------------------------------------------
         * ORGANIC MICRO-DISTORTION
         * --------------------------------------------
         *
         * Keep the rectangle organic without allowing
         * the distortion to destroy its silhouette.
         */
        const organicX =
            (
                Math.sin(
                    particleIndex *
                    0.0173,
                ) *
                Math.cos(
                    particleIndex *
                    0.0061,
                )
            ) *
            0.055

        const organicY =
            (
                Math.cos(
                    particleIndex *
                    0.0131,
                ) *
                Math.sin(
                    particleIndex *
                    0.0087,
                )
            ) *
            0.045

        const organicZ =
            Math.sin(
                particleIndex *
                0.0217,
            ) *
            0.055

        data[index] =
            x +
            organicX

        data[index + 1] =
            y +
            organicY

        data[index + 2] =
            organicZ

        /*
         * IMPORTANT:
         *
         * alpha = 1 means this particle participates
         * in the cloud target.
         */
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
        cloudTargetTexture,
        setCloudTargetTexture,
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

        const cloudTexture =
            createCloudTargetTexture()

        if (
            !textTexture ||
            !cloudTexture
        ) {
            textTexture?.dispose()
            cloudTexture?.dispose()

            return undefined
        }

        setTextTargetTexture(
            textTexture,
        )

        setCloudTargetTexture(
            cloudTexture,
        )

        return () => {
            textTexture.dispose()
            cloudTexture.dispose()
        }
    }, [])

    useEffect(() => {
        updateProgress()

        const handleScroll = () => {
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
     * ----------------------------------------------------
     * SCROLL MORPH
     * ----------------------------------------------------
     *
     * 0.0 -> TEXT
     * 0.5 -> CLOUD
     * 1.0 -> TEXT
     *
     * Only the scalar amount is updated here.
     *
     * The actual 262,144-particle interpolation happens
     * inside the GPU simulation shader.
     * ----------------------------------------------------
     */

    useEffect(() => {
        let animationFrame = null

        const frame = () => {
            const progress =
                progressRef.current

            let cloudAmount

            if (
                progress <= 0.5
            ) {
                cloudAmount =
                    smoothstep(
                        0,
                        0.5,
                        progress,
                    )
            } else {
                cloudAmount =
                    1 -
                    smoothstep(
                        0.5,
                        1,
                        progress,
                    )
            }

            rectangleStrengthRef.current =
                cloudAmount

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
    }, [])

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

                    cloudTargetTexture={
                        cloudTargetTexture
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