import {
    useEffect,
    useRef,
    useState,
} from 'react'

import * as THREE from 'three'

import NebulaBackground from '../nebula/nebula'
import { Box } from '@mui/material'

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

    /*
     * ------------------------------------------------
     * ROUNDED RECTANGLE PERIMETER
     * ------------------------------------------------
     *
     * Clockwise path:
     *
     * top
     * top-right corner
     * right
     * bottom-right corner
     * bottom
     * bottom-left corner
     * left
     * top-left corner
     *
     * t = 0..1
     */

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

        /*
         * Some particles remain part of the
         * surrounding nebula.
         */
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

        /*
         * Every particle receives a permanent
         * position along the orbit.
         */
        const orbitT =
            randomFor(
                particleIndex,
                101,
            )

        const orbit =
            pointOnOrbit(
                orbitT,
            )

        /*
         * Spread particles across the thickness
         * of the orbital tube.
         */
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

        /*
         * The depth has two components:
         *
         * 1. deterministic orbital depth
         * 2. local thickness
         */
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

        /*
         * Small organic displacement prevents
         * the orbit from becoming a mathematically
         * perfect tube.
         */
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

        /*
         * IMPORTANT:
         *
         * Alpha no longer simply means "1".
         *
         * It stores the particle's orbit position.
         *
         * 0 = invalid/free particle
         * 0.10..1.0 = valid cloud + orbitT
         */
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

const WorkNebulaText = ({progress, cardRect}) => {
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
        progressRef.current = progress
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


    /*
     * ------------------------------------------------
     * TEXT / CLOUD MORPH + DEPTH
     * ------------------------------------------------
     *
     * The particle simulation itself remains unchanged.
     *
     * What changes here is the DOM layer:
     *
     * TEXT:
     *
     *      CARD
     *      ↑
     *   NEBULA
     *
     *
     * CLOUD:
     *
     *   NEBULA / CLOUD
     *      ↑
     *      CARD
     *
     *
     * This makes the cloud physically appear to pass
     * over the glass card without changing the particle
     * simulation.
     * ------------------------------------------------
     */

    useEffect(() => {
        let animationFrame = null

        const frame = () => {
            const progress =
                progressRef.current

            /*
             * There are currently five works.
             *
             * Keep this synchronized with the works
             * database / WorkTilesContainer.
             */
            const cardCount = 5

            const cycleLength =
                1 /
                cardCount

            /*
             * Which project cycle are we in?
             */
            const cycle =
                Math.min(
                    cardCount - 1,
                    Math.floor(
                        progress /
                        cycleLength,
                    ),
                )

            /*
             * Progress inside the current
             * project's cycle.
             */
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
             */

            let cloudAmount

            if (
                localProgress < 0.20
            ) {
                /*
                 * Stable TEXT phase.
                 *
                 * Give the user enough scroll distance
                 * to actually see the text before the
                 * cloud begins forming.
                 */
                cloudAmount = 0

            } else if (
                localProgress < 0.50
            ) {
                /*
                 * TEXT → CLOUD
                 *
                 * The cloud forms gradually and still
                 * reaches its existing peak at 0.50.
                 */
                cloudAmount =
                    smoothstep(
                        0.20,
                        0.50,
                        localProgress,
                    )

            } else if (
                localProgress < 0.80
            ) {
                /*
                 * CLOUD → TEXT
                 *
                 * Keep the cloud dominant through the
                 * middle of the cycle, then let it dissolve.
                 */
                cloudAmount =
                    1 -
                    smoothstep(
                        0.50,
                        0.80,
                        localProgress,
                    )

            } else {
                /*
                 * Stable TEXT phase again.
                 *
                 * The cloud is completely gone and stays
                 * gone until the next cycle starts forming.
                 */
                cloudAmount = 0
            }

            rectangleStrengthRef.current =
                cloudAmount
            
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

            /*
             * ----------------------------------------
             * DEPTH SWITCH
             * ----------------------------------------
             *
             * The cloud must come ABOVE the cards.
             *
             * We deliberately switch before the cloud
             * reaches maximum density so that the
             * transition itself appears to come forward.
             *
             * Once the cloud is sufficiently formed,
             * the whole nebula layer sits above the card.
             *
             * As the cloud retreats, the nebula moves
             * behind the card again.
             * ----------------------------------------
             */

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

                /*
                 * TEXT STARTS BEHIND THE CARDS.
                 *
                 * This is changed directly on the
                 * DOM by the animation loop when the
                 * cloud forms.
                 */
                zIndex: 20,

                /*
                 * Don't animate z-index.
                 *
                 * z-index is intentionally discrete:
                 *
                 * 1 = behind card
                 * 3 = in front of card
                 */
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
                cardRect={cardRect}
            />
        </Box>
    )
}

export default WorkNebulaText