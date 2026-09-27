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
 * Dense organic particle cloud.
 *
 * This is NOT a rectangle.
 * This is NOT a second geometry.
 * This uses the existing particle population.
 *
 * Most particles are pulled into one broad,
 * irregular, continuous mass.
 *
 * A small percentage remain completely untargeted
 * so the surrounding nebula can continue moving
 * freely around the cloud.
 * ----------------------------------------------------
 */

const createCloudTargetTexture = () => {
    const data =
        new Float32Array(
            PARTICLE_COUNT * 4,
        )

    /*
     * Broad card-sized footprint.
     *
     * The aspect ratio remains wide enough to cover
     * the Work area, but the actual boundary is
     * deliberately much more organic than a rectangle.
     */
    const cloudWidth =
        15.9

    const cloudHeight =
        6.35

    /*
     * About 92% of the existing particles become
     * part of the cloud.
     *
     * The remaining ~8% have alpha = 0 and remain
     * completely free-moving nebula particles.
     */
    const CLOUD_PARTICLE_RATIO =
        0.95

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

    /*
     * Continuous low-frequency shape noise.
     *
     * The important difference from the old rectangle:
     *
     * We do NOT start with a rounded rectangle and
     * merely disturb its corners.
     *
     * Instead, the cloud boundary is produced from
     * several overlapping spatial frequencies.
     */
    const cloudField = (
        x,
        y,
    ) => {
        const nx =
            x /
            (
                cloudWidth *
                0.5
            )

        const ny =
            y /
            (
                cloudHeight *
                0.5
            )

        /*
         * Slight spatial warp prevents the field from
         * having a clean mathematical symmetry.
         */
        const warpedX =
            nx +
            Math.sin(
                ny * 2.7,
            ) *
            0.105

        const warpedY =
            ny +
            Math.cos(
                nx * 2.35,
            ) *
            0.075

        /*
         * Base body.
         *
         * Exponent below 2 makes the cloud broader and
         * less ellipse-like while still keeping one
         * continuous central mass.
         */
        const body =
            Math.pow(
                Math.abs(
                    warpedX,
                ),
                1.62,
            ) +
            Math.pow(
                Math.abs(
                    warpedY,
                ),
                1.72,
            )

        /*
         * Large-scale lumpy deformation.
         *
         * These are deliberately overlapping fields,
         * not separate blobs.
         */
        const largeNoise =
            Math.sin(
                warpedX * 3.15 +
                warpedY * 1.45,
            ) *
            0.22 +
            Math.cos(
                warpedX * 4.55 -
                warpedY * 2.35,
            ) *
            0.016 +
            Math.sin(
                warpedX * 6.8 +
                warpedY * 4.15,
            ) *
            0.095

        /*
         * Asymmetric directional deformation.
         *
         * This prevents the cloud from looking like a
         * centered mathematical capsule.
         */
        const directionalNoise =
            (
                Math.sin(
                    warpedY * 5.4 +
                    warpedX * 1.7,
                ) *
                0.016
            ) +
            (
                Math.cos(
                    warpedX * 7.2 -
                    warpedY * 3.1,
                ) *
                0.010
            )

        /*
         * Edge threshold.
         *
         * Lower threshold in some areas creates
         * protrusions and indentations.
         */
        const threshold =
            1.0 +
            largeNoise +
            directionalNoise

        return {
            value:
                body -
                threshold,

            body,
            nx,
            ny,
        }
    }

    /*
     * Find a point inside the continuous organic field.
     *
     * We sample a large rectangular area and accept
     * positions according to the distorted cloud field.
     *
     * This creates high particle density throughout the
     * cloud instead of concentrating particles into a
     * geometric outline.
     */
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
         * ORGANIC CLOUD SAMPLING
         * --------------------------------------------
         */

        let accepted =
            false

        for (
            let attempt = 0;
            attempt < 24;
            attempt += 1
        ) {
            /*
             * Broad candidate distribution.
             */
            let candidateX =
                (
                    randomFor(
                        particleIndex,
                        100 +
                        attempt * 13,
                    ) -
                    0.5
                ) *
                cloudWidth

            let candidateY =
                (
                    randomFor(
                        particleIndex,
                        200 +
                        attempt * 17,
                    ) -
                    0.5
                ) *
                cloudHeight

            /*
             * Large-scale position warp.
             *
             * This bends the cloud instead of merely
             * changing its outer border.
             */
            candidateX +=
                Math.sin(
                    candidateY * 1.35,
                ) *
                0.24

            candidateY +=
                Math.sin(
                    candidateX * 1.05,
                ) *
                0.16

            const field =
                cloudField(
                    candidateX,
                    candidateY,
                )

            /*
             * Interior particles are accepted very
             * easily. Near the boundary acceptance becomes
             * selective, producing a ragged particle edge.
             */
            const edgeNoise =
                (
                    Math.sin(
                        candidateX * 2.7 +
                        candidateY * 1.35 +
                        particleIndex * 0.0007,
                    ) *
                    0.075
                ) +
                (
                    Math.cos(
                        candidateX * 4.8 -
                        candidateY * 2.5 +
                        particleIndex * 0.00031,
                    ) *
                    0.050
                )

            const acceptance =
                field.value +
                edgeNoise

            /*
             * Keep the center dense.
             *
             * Only the outer boundary becomes sparse.
             */
            const outsideDistance =
                Math.max(
                    0,
                    acceptance,
                )

            const outerChance =
                Math.exp(
                    -outsideDistance *
                    5.5,
                )

            const porousSample =
                randomFor(
                    particleIndex,
                    900 +
                    attempt * 29,
                )

            if (
                acceptance <=
                0 ||
                porousSample <
                outerChance *
                0.34
            ) {
                x =
                    candidateX

                y =
                    candidateY

                accepted =
                    true

                break
            }
        }

        /*
         * Extremely unlikely fallback.
         *
         * This guarantees every cloud particle receives
         * a valid destination without creating a separate
         * geometric shape.
         */
        if (!accepted) {
            const fallbackAngle =
                randomFor(
                    particleIndex,
                    811,
                ) *
                Math.PI *
                2

            const fallbackRadius =
                Math.sqrt(
                    randomFor(
                        particleIndex,
                        823,
                    ),
                )

            x =
                Math.cos(
                    fallbackAngle,
                ) *
                (
                    cloudWidth *
                    0.30 *
                    fallbackRadius
                )

            y =
                Math.sin(
                    fallbackAngle,
                ) *
                (
                    cloudHeight *
                    0.30 *
                    fallbackRadius
                )
        }

        /*
         * --------------------------------------------
         * PARTICLE-LEVEL ORGANIC MOTION
         * --------------------------------------------
         *
         * The target itself is static, but particles
         * do not all land on identical mathematical
         * coordinates. This gives the cloud a granular,
         * turbulent surface.
         */

        const organicX =
            (
                Math.sin(
                    particleIndex *
                    0.0173 +
                    y * 2.4,
                ) *
                0.075
            ) +
            (
                Math.cos(
                    particleIndex *
                    0.0061 +
                    x * 1.7,
                ) *
                0.045
            )

        const organicY =
            (
                Math.cos(
                    particleIndex *
                    0.0131 +
                    x * 2.1,
                ) *
                0.065
            ) +
            (
                Math.sin(
                    particleIndex *
                    0.0087 +
                    y * 1.9,
                ) *
                0.040
            )

        /*
         * Very small depth variation.
         *
         * This keeps the cloud volumetric rather than
         * making it look like a flat bitmap.
         */
        const organicZ =
            (
                Math.sin(
                    particleIndex *
                    0.0217 +
                    x * 0.31,
                ) *
                0.018
            ) +
            (
                Math.cos(
                    particleIndex *
                    0.0134 +
                    y * 0.47,
                ) *
                0.075
            )

        data[index] =
            x +
            organicX

        data[index + 1] =
            y +
            organicY

        data[index + 2] =
            organicZ

        /*
         * alpha = 1:
         * this particle has a valid cloud destination.
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
     * The GPU performs the actual particle interpolation.
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