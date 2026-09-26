import {
    useEffect,
    useState,
} from 'react'

import * as THREE from 'three'

import NebulaBackground from '../nebula/nebula'

const TEXTURE_SIZE = 512

const PARTICLE_COUNT =
    TEXTURE_SIZE *
    TEXTURE_SIZE

const TEXT_PARTICLE_RATIO = 0.58

const createTextTargetTexture = (
    text,
) => {
    const data =
        new Float32Array(
            PARTICLE_COUNT * 4,
        )

    /*
     * ------------------------------------------------
     * CREATE TEXT MASK
     * ------------------------------------------------
     */

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

    /*
     * ------------------------------------------------
     * EXTRACT TEXT PARTICLES
     * ------------------------------------------------
     */

    const candidates = []

    const sampleStep = 1

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

    /*
     * ------------------------------------------------
     * MAP TEXT INTO WORLD SPACE
     * ------------------------------------------------
     */

    const worldWidth = 8.9
    const worldHeight = 2.45

    const centerX =
        canvas.width / 2

    const centerY =
        canvas.height / 2

    /*
     * ------------------------------------------------
     * DISTRIBUTE TARGET PARTICLES THROUGH THE
     * ENTIRE SIMULATION TEXTURE
     * ------------------------------------------------
     */

    for (
        let particleIndex = 0;
        particleIndex <
        PARTICLE_COUNT;
        particleIndex += 1
    ) {
        /*
         * Deterministic hash
         */

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
         * Non-text particles
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

        /*
         * Scramble candidate selection
         */

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

        /*
         * Small deterministic variation
         */

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
            worldWidth

        const worldY =
            -(
                localY /
                (
                    canvas.height / 2
                )
            ) *
            worldHeight

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

    /*
     * ------------------------------------------------
     * THREE DATA TEXTURE
     * ------------------------------------------------
     */

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

    useEffect(() => {
        const texture =
            createTextTargetTexture(
                "WHAT I BUILD",
            )

        setTextTargetTexture(
            texture,
        )

        return () => {
            texture?.dispose()
        }
    }, [])

    return (
        <main
            style={{
                position:
                    'relative',

                width:
                    '100%',

                minHeight:
                    '100vh',

                overflow:
                    'hidden',

                background:
                    '#050403',
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
        </main>
    )
}

export default WorkNebulaText