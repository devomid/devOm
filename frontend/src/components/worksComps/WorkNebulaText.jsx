import {
    useEffect,
    useRef,
    useState,
} from 'react'

import * as THREE from 'three'

import { Box } from '@mui/material'

import NebulaBackground from '../nebula/nebula'
import works from '../../db/works'

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
 * Existing cloud geometry.
 *
 * DO NOT CHANGE THIS.
 * ----------------------------------------------------
 */

const createCloudTargetTexture = () => {
    const data =
        new Float32Array(
            PARTICLE_COUNT * 4,
        )

    const orbitWidth =
        15.9

    const orbitHeight =
        6.35

    const orbitCornerRadius =
        1.25

    const tubeThickness =
        0.72

    const orbitDepth =
        1.55

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

    const halfWidth =
        orbitWidth * 0.5

    const halfHeight =
        orbitHeight * 0.5

    const straightWidth =
        orbitWidth -
        orbitCornerRadius * 2

    const straightHeight =
        orbitHeight -
        orbitCornerRadius * 2

    const cornerLength =
        Math.PI *
        orbitCornerRadius *
        0.5

    const perimeter =
        straightWidth * 2 +
        straightHeight * 2 +
        cornerLength * 4

    const pointOnOrbit = (
        orbitT,
    ) => {
        let distance =
            (
                orbitT -
                Math.floor(
                    orbitT,
                )
            ) *
            perimeter

        /*
         * TOP
         */
        if (
            distance <
            straightWidth
        ) {
            const local =
                distance /
                straightWidth

            return {
                x:
                    -halfWidth +
                    orbitCornerRadius +
                    local *
                    straightWidth,

                y:
                    halfHeight,

                tangentX:
                    1,

                tangentY:
                    0,

                normalX:
                    0,

                normalY:
                    1,
            }
        }

        distance -=
            straightWidth

        /*
         * TOP-RIGHT CORNER
         */
        if (
            distance <
            cornerLength
        ) {
            const angle =
                Math.PI * 0.5 -
                (
                    distance /
                    orbitCornerRadius
                )

            return {
                x:
                    halfWidth -
                    orbitCornerRadius +
                    Math.cos(angle) *
                    orbitCornerRadius,

                y:
                    halfHeight -
                    orbitCornerRadius +
                    Math.sin(angle) *
                    orbitCornerRadius,

                tangentX:
                    Math.sin(angle),

                tangentY:
                    -Math.cos(angle),

                normalX:
                    Math.cos(angle),

                normalY:
                    Math.sin(angle),
            }
        }

        distance -=
            cornerLength

        /*
         * RIGHT
         */
        if (
            distance <
            straightHeight
        ) {
            const local =
                distance /
                straightHeight

            return {
                x:
                    halfWidth,

                y:
                    halfHeight -
                    orbitCornerRadius -
                    local *
                    straightHeight,

                tangentX:
                    0,

                tangentY:
                    -1,

                normalX:
                    1,

                normalY:
                    0,
            }
        }

        distance -=
            straightHeight

        /*
         * BOTTOM-RIGHT CORNER
         */
        if (
            distance <
            cornerLength
        ) {
            const angle =
                0 -
                (
                    distance /
                    orbitCornerRadius
                )

            return {
                x:
                    halfWidth -
                    orbitCornerRadius +
                    Math.cos(angle) *
                    orbitCornerRadius,

                y:
                    -halfHeight +
                    orbitCornerRadius +
                    Math.sin(angle) *
                    orbitCornerRadius,

                tangentX:
                    Math.sin(angle),

                tangentY:
                    -Math.cos(angle),

                normalX:
                    Math.cos(angle),

                normalY:
                    Math.sin(angle),
            }
        }

        distance -=
            cornerLength

        /*
         * BOTTOM
         */
        if (
            distance <
            straightWidth
        ) {
            const local =
                distance /
                straightWidth

            return {
                x:
                    halfWidth -
                    orbitCornerRadius -
                    local *
                    straightWidth,

                y:
                    -halfHeight,

                tangentX:
                    -1,

                tangentY:
                    0,

                normalX:
                    0,

                normalY:
                    -1,
            }
        }

        distance -=
            straightWidth

        /*
         * BOTTOM-LEFT CORNER
         */
        if (
            distance <
            cornerLength
        ) {
            const angle =
                -Math.PI * 0.5 -
                (
                    distance /
                    orbitCornerRadius
                )

            return {
                x:
                    -halfWidth +
                    orbitCornerRadius +
                    Math.cos(angle) *
                    orbitCornerRadius,

                y:
                    -halfHeight +
                    orbitCornerRadius +
                    Math.sin(angle) *
                    orbitCornerRadius,

                tangentX:
                    Math.sin(angle),

                tangentY:
                    -Math.cos(angle),

                normalX:
                    Math.cos(angle),

                normalY:
                    Math.sin(angle),
            }
        }

        distance -=
            cornerLength

        /*
         * LEFT
         */
        if (
            distance <
            straightHeight
        ) {
            const local =
                distance /
                straightHeight

            return {
                x:
                    -halfWidth,

                y:
                    -halfHeight +
                    orbitCornerRadius +
                    local *
                    straightHeight,

                tangentX:
                    0,

                tangentY:
                    1,

                normalX:
                    -1,

                normalY:
                    0,
            }
        }

        distance -=
            straightHeight

        /*
         * TOP-LEFT CORNER
         */
        const angle =
            Math.PI -
            (
                distance /
                orbitCornerRadius
            )

        return {
            x:
                -halfWidth +
                orbitCornerRadius +
                Math.cos(angle) *
                orbitCornerRadius,

            y:
                halfHeight -
                orbitCornerRadius +
                Math.sin(angle) *
                orbitCornerRadius,

            tangentX:
                Math.sin(angle),

            tangentY:
                -Math.cos(angle),

            normalX:
                Math.cos(angle),

            normalY:
                Math.sin(angle),
        }
    }

    for (
        let particleIndex = 0;
        particleIndex <
        PARTICLE_COUNT;
        particleIndex += 1
    ) {
        const index =
            particleIndex * 4

        const membership =
            randomFor(
                particleIndex,
                17,
            )

        if (
            membership >
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

        const orbitT =
            randomFor(
                particleIndex,
                101,
            )

        const orbit =
            pointOnOrbit(
                orbitT,
            )

        const tubeOffset =
            (
                randomFor(
                    particleIndex,
                    201,
                ) -
                0.5
            ) *
            2 *
            tubeThickness

        const orbitalDepth =
            Math.sin(
                orbitT *
                Math.PI *
                2,
            ) *
            orbitDepth

        const depthOffset =
            (
                randomFor(
                    particleIndex,
                    301,
                ) -
                0.5
            ) *
            0.75

        const organic =
            (
                randomFor(
                    particleIndex,
                    401,
                ) -
                0.5
            ) *
            0.20

        data[index] =
            orbit.x +
            orbit.normalX *
            (
                tubeOffset +
                organic
            )

        data[index + 1] =
            orbit.y +
            orbit.normalY *
            (
                tubeOffset +
                organic
            )

        data[index + 2] =
            orbitalDepth +
            depthOffset

        data[index + 3] =
            0.10 +
            orbitT * 0.90
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

const WorkNebulaText = ({
    progress,
    cardRect,
}) => {
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

    const depthStrengthRef =
        useRef(0)

    const layerRef =
        useRef(null)

    useEffect(() => {
        progressRef.current =
            progress
    }, [progress])

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
        let animationFrame = null

        const frame = () => {
            const progress =
                progressRef.current

            /*
             * ----------------------------------------
             * DYNAMIC WORK COUNT
             * ----------------------------------------
             *
             * Never hard-code the number of works.
             *
             * Adding/removing a project automatically
             * changes the cycle length.
             * ----------------------------------------
             */

            const cardCount =
                Math.max(
                    works.length,
                    1,
                )

            const cycleLength =
                1 /
                cardCount

            /*
             * ----------------------------------------
             * CURRENT WORK CYCLE
             * ----------------------------------------
             */

            const cycle =
                Math.min(
                    cardCount - 1,
                    Math.floor(
                        progress /
                        cycleLength,
                    ),
                )

            const cycleStart =
                cycle *
                cycleLength

            const localProgress =
                clamp(
                    (
                        progress -
                        cycleStart
                    ) /
                    cycleLength,
                )

            /*
             * ----------------------------------------
             * TEXT → CLOUD
             * ----------------------------------------
             *
             * FIRST CYCLE
             *
             * The introduction gets more room.
             *
             * 0.00 ───────────── 0.38
             *       TEXT
             *
             * 0.38 ───────────── 0.50
             *       TEXT → CLOUD
             *
             * 0.50 ───────────── 0.80
             *       CLOUD → DISSOLVE
             *
             * Later work cycles retain the original
             * cloud timing.
             * ----------------------------------------
             */

            let cloudAmount

            if (cycle === 0) {
                if (
                    localProgress < 0.20
                ) {
                    cloudAmount = 0

                } else if (
                    localProgress < 0.50
                ) {
                    cloudAmount =
                        smoothstep(
                            0.20,
                            0.50,
                            localProgress,
                        )

                } else if (
                    localProgress < 0.80
                ) {
                    cloudAmount =
                        1 -
                        smoothstep(
                            0.50,
                            0.80,
                            localProgress,
                        )

                } else {
                    cloudAmount = 0
                }
            } else {
                if (
                    localProgress < 0.20
                ) {
                    cloudAmount = 0

                } else if (
                    localProgress < 0.50
                ) {
                    cloudAmount =
                        smoothstep(
                            0.20,
                            0.50,
                            localProgress,
                        )

                } else if (
                    localProgress < 0.80
                ) {
                    cloudAmount =
                        1 -
                        smoothstep(
                            0.50,
                            0.80,
                            localProgress,
                        )

                } else {
                    cloudAmount = 0
                }
            }

            rectangleStrengthRef.current =
                cloudAmount

            /*
             * ----------------------------------------
             * DEPTH
             * ----------------------------------------
             */

            const depthTarget =
                progress >=
                    cycleLength * 0.5
                    ? 1
                    : 0

            depthStrengthRef.current +=
                (
                    depthTarget -
                    depthStrengthRef.current
                ) * 0.08

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
        <Box
            ref={
                layerRef
            }
            sx={{
                position: 'fixed',

                inset: 0,

                width: '100%',
                height: '100vh',

                overflow: 'hidden',

                pointerEvents: 'none',

                zIndex: 20,
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

                depthStrengthRef={
                    depthStrengthRef
                }

                cardRect={
                    cardRect
                }
            />
        </Box>
    )
}

export default WorkNebulaText