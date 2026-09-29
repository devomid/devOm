import {
    useEffect,
    useState,
} from 'react'

import * as THREE from 'three'

import {
    HOW_I_BUILD_RING_COUNT,
    HOW_I_BUILD_RING_Y,
    getHowIBuildRingCenterX,
} from './howIBuildRingGeometry'

import NebulaBackground
    from '../nebula/nebula'

import HowIBuildContainer
    from './HowIBuildContainer'


const TEXTURE_SIZE =
    512

const PARTICLE_COUNT =
    TEXTURE_SIZE *
    TEXTURE_SIZE

const TEXT_PARTICLE_RATIO =
    0.58

const TEXT_WORLD_WIDTH =
    8.9

const TEXT_WORLD_HEIGHT =
    2.45

const TEXT_FORM_TIME =
    3


const RING_DELAY =
    0.05

const PARTICLES_PER_RING =
    6000

const TEXT_PARTICLES_PER_RING =
    2000

const FREE_PARTICLES_PER_RING =
    4000

const RING_RADIUS =
    0.72


const hash = (
    value,
) => {
    const x =
        Math.sin(
            value *
                12.9898 +
            78.233,
        ) *
        43758.5453123

    return (
        x -
        Math.floor(x)
    )
}


const createTexture = (
    data,
) => {
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
 * ============================================================
 * TEXT TARGET
 * ============================================================
 */

const createTextTargetTexture = (
    text,
) => {
    const data =
        new Float32Array(
            PARTICLE_COUNT *
            4,
        )

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

    const candidates =
        []

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
        const particleHash =
            (
                particleIndex *
                    1664525 +
                1013904223
            ) >>>
            0

        const normalizedHash =
            particleHash /
            4294967295

        const textureIndex =
            particleIndex *
            4

        if (
            normalizedHash >
            TEXT_PARTICLE_RATIO
        ) {
            data[
                textureIndex + 3
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
                    canvas.width /
                    2
                )
            ) *
            TEXT_WORLD_WIDTH

        const worldY =
            -(
                localY /
                (
                    canvas.height /
                    2
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
            1
    }

    return createTexture(
        data,
    )
}


/*
 * ============================================================
 * RING TARGET
 * ============================================================
 */

const createRingTargetTexture = (
    textTexture,
) => {
    if (!textTexture) {
        return null
    }

    const source =
        textTexture.image.data

    const data =
        new Float32Array(
            source,
        )

    const textParticles =
        []

    const freeParticles =
        []

    for (
        let particleIndex = 0;
        particleIndex <
        PARTICLE_COUNT;
        particleIndex += 1
    ) {
        const index =
            particleIndex *
            4

        if (
            data[index + 3] >
            0.5
        ) {
            textParticles.push(
                particleIndex,
            )
        } else {
            freeParticles.push(
                particleIndex,
            )
        }
    }

    textParticles.sort(
        (a, b) =>
            hash(a * 3.17) -
            hash(b * 3.17),
    )

    freeParticles.sort(
        (a, b) =>
            hash(a * 7.31) -
            hash(b * 7.31),
    )

    let textCursor =
        0

    let freeCursor =
        0

    for (
        let ring = 0;
        ring < HOW_I_BUILD_RING_COUNT;
        ring += 1
    ) {
        const centerX =
            getHowIBuildRingCenterX(
                ring,
            )

        const radius =
            RING_RADIUS +
            (
                hash(
                    ring *
                        31.71,
                ) -
                0.5
            ) *
            0.10

        /*
         * TEXT PARTICLES
         */

        for (
            let particle = 0;
            particle <
            TEXT_PARTICLES_PER_RING;
            particle += 1
        ) {
            if (
                textCursor >=
                textParticles.length
            ) {
                break
            }

            const particleIndex =
                textParticles[
                    textCursor
                ]

            textCursor += 1

            const angle =
                (
                    particle /
                    TEXT_PARTICLES_PER_RING
                ) *
                Math.PI *
                2

            const noise1 =
                Math.sin(
                    angle * 3 +
                    ring * 1.73,
                )

            const noise2 =
                Math.sin(
                    angle * 7 -
                    ring * 0.81,
                )

            const noise3 =
                Math.sin(
                    angle * 13 +
                    ring * 2.1,
                )

            const irregularity =
                1 +
                noise1 * 0.055 +
                noise2 * 0.028 +
                noise3 * 0.012

            const thickness =
                (
                    hash(
                        particle +
                        ring * 991,
                    ) -
                    0.5
                ) *
                0.09

            const finalRadius =
                radius *
                    irregularity +
                thickness

            const index =
                particleIndex *
                4

            data[index] =
                centerX +
                Math.cos(angle) *
                finalRadius

            data[index + 1] =
                HOW_I_BUILD_RING_Y +
                Math.sin(angle) *
                finalRadius

            data[index + 2] =
                Math.sin(
                    angle * 2 +
                    ring,
                ) *
                0.13

            data[index + 3] =
                1
        }

        /*
         * FREE PARTICLES
         */

        for (
            let particle = 0;
            particle <
            FREE_PARTICLES_PER_RING;
            particle += 1
        ) {
            if (
                freeCursor >=
                freeParticles.length
            ) {
                break
            }

            const particleIndex =
                freeParticles[
                    freeCursor
                ]

            freeCursor += 1

            const angle =
                (
                    particle /
                    FREE_PARTICLES_PER_RING
                ) *
                Math.PI *
                2 +
                0.012

            const noise1 =
                Math.sin(
                    angle * 3 +
                    ring * 1.73,
                )

            const noise2 =
                Math.sin(
                    angle * 7 -
                    ring * 0.81,
                )

            const noise3 =
                Math.sin(
                    angle * 13 +
                    ring * 2.1,
                )

            const irregularity =
                1 +
                noise1 * 0.055 +
                noise2 * 0.028 +
                noise3 * 0.012

            const thickness =
                (
                    hash(
                        particle +
                        ring * 1997,
                    ) -
                    0.5
                ) *
                0.09

            const finalRadius =
                radius *
                    irregularity +
                thickness

            const index =
                particleIndex *
                4

            data[index] =
                centerX +
                Math.cos(angle) *
                (
                    finalRadius +
                    thickness
                )

            data[index + 1] =
                HOW_I_BUILD_RING_Y +
                Math.sin(angle) *
                finalRadius

            data[index + 2] =
                Math.sin(
                    angle * 2 +
                    ring * 0.7,
                ) *
                0.15

            data[index + 3] =
                1
        }
    }

    return createTexture(
        data,
    )
}


/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

const HowIBuildNebulaText = ({
    interactionRef,
}) => {
    const [
        textTargetTexture,
        setTextTargetTexture,
    ] = useState(null)

    const [
        ringTargetTexture,
        setRingTargetTexture,
    ] = useState(null)

    const [
        ringReady,
        setRingReady,
    ] = useState(false)

    useEffect(() => {
        const texture =
            createTextTargetTexture(
                'HOW I BUILD',
            )

        if (!texture) {
            return undefined
        }

        setTextTargetTexture(
            texture,
        )

        const timer =
            window.setTimeout(
                () => {
                    const ringTexture =
                        createRingTargetTexture(
                            texture,
                        )

                    if (
                        ringTexture
                    ) {
                        setRingTargetTexture(
                            ringTexture,
                        )
                    }
                },
                (
                    TEXT_FORM_TIME +
                    RING_DELAY
                ) *
                1000,
            )

        return () => {
            window.clearTimeout(
                timer,
            )

            texture.dispose()

            setRingTargetTexture(
                null,
            )

            setRingReady(
                false,
            )
        }
    }, [])

    useEffect(() => {
        return () => {
            ringTargetTexture?.dispose()
        }
    }, [
        ringTargetTexture,
    ])

    const activeTargetTexture =
        ringTargetTexture ||
        textTargetTexture

    return (
        <div
            style={{
                position:
                    'absolute',

                inset:
                    0,

                width:
                    '100%',

                height:
                    '100%',

                overflow:
                    'hidden',
            }}
        >
            <NebulaBackground
                textEnabled={
                    Boolean(
                        activeTargetTexture,
                    )
                }

                textTargetTexture={
                    activeTargetTexture
                }

                textStrength={
                    1.0
                }

                interactionRef={
                    interactionRef
                }

                onRingComplete={
                    () => {
                        setRingReady(true)
                    }
                }
            />

            <HowIBuildContainer
                interactionRef={
                    interactionRef
                }

                ringReady={
                    ringReady
                }
            />
        </div>
    )
}

export default HowIBuildNebulaText