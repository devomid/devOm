import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import * as THREE from 'three'

import {
    Canvas,
    useFrame,
    useThree,
} from '@react-three/fiber'
import { Box } from '@mui/material'

const TEXTURE_SIZE = 512

const PARTICLE_COUNT =
    TEXTURE_SIZE *
    TEXTURE_SIZE

const TEXT_PARTICLE_RATIO =
    0.58

/*
 * ============================================================
 * TEXT TARGET
 * ============================================================
 */

const createTextTargetTexture =
    (text) => {
        const data =
            new Float32Array(
                PARTICLE_COUNT *
                4,
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

        /*
         * Sampling every 2 pixels is enough for the
         * text target while avoiding unnecessary CPU
         * work during texture creation.
         */

        const sampleStep = 2

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
                const index =
                    (
                        y *
                        canvas.width +
                        x
                    ) *
                    4

                const alpha =
                    image.data[
                    index + 3
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
            return null
        }

        const worldWidth = 8.9
        const worldHeight = 2.45

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
                worldWidth

            const worldY =
                -(
                    localY /
                    (
                        canvas.height /
                        2
                    )
                ) *
                worldHeight

            data[
                textureIndex
            ] =
                worldX +
                Math.sin(
                    variation *
                    1.71,
                ) *
                0.008

            data[
                textureIndex + 1
            ] =
                worldY +
                Math.cos(
                    variation *
                    1.43,
                ) *
                0.008

            data[
                textureIndex + 2
            ] =
                Math.sin(
                    variation *
                    0.91,
                ) *
                0.025

            data[
                textureIndex + 3
            ] = 1
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
 * ============================================================
 * PARTICLE ATTRIBUTES
 * ============================================================
 */

const createParticleGeometry =
    () => {
        const geometry =
            new THREE.BufferGeometry()

        const uvs =
            new Float32Array(
                PARTICLE_COUNT * 2,
            )

        const random =
            new Float32Array(
                PARTICLE_COUNT * 4,
            )

        for (
            let i = 0;
            i < PARTICLE_COUNT;
            i += 1
        ) {
            const x =
                i %
                TEXTURE_SIZE

            const y =
                Math.floor(
                    i /
                    TEXTURE_SIZE,
                )

            const index =
                i * 2

            uvs[index] =
                (
                    x + 0.5
                ) /
                TEXTURE_SIZE

            uvs[index + 1] =
                (
                    y + 0.5
                ) /
                TEXTURE_SIZE

            const randomIndex =
                i * 4

            const seed =
                (
                    i *
                    1664525 +
                    1013904223
                ) >>> 0

            const randomA =
                (
                    seed %
                    10000
                ) /
                10000

            const randomB =
                (
                    (
                        seed *
                        16807
                    ) %
                    10000
                ) /
                10000

            const randomC =
                (
                    (
                        seed *
                        48271
                    ) %
                    10000
                ) /
                10000

            const randomD =
                (
                    (
                        seed *
                        69621
                    ) %
                    10000
                ) /
                10000

            random[
                randomIndex
            ] = randomA

            random[
                randomIndex + 1
            ] = randomB

            random[
                randomIndex + 2
            ] = randomC

            random[
                randomIndex + 3
            ] = randomD
        }

        geometry.setAttribute(
            'aParticleUv',
            new THREE.BufferAttribute(
                uvs,
                2,
            ),
        )

        geometry.setAttribute(
            'aRandom',
            new THREE.BufferAttribute(
                random,
                4,
            ),
        )

        geometry.computeBoundingSphere()

        return geometry
    }

/*
 * ============================================================
 * SHADERS
 * ============================================================
 */

const vertexShader = `
    attribute vec2 aParticleUv;
    attribute vec4 aRandom;

    uniform sampler2D uTextTargetTexture;

    uniform float uTime;
    uniform float uScroll;
    uniform float uIntro;
    uniform float uLayer;

    uniform vec2 uResolution;

    varying float vIntensity;
    varying float vAlpha;

    #define PI 3.14159265359

    float hash21(vec2 p) {
        p = fract(
            p * vec2(
                123.34,
                456.21
            )
        );

        p += dot(
            p,
            p + 45.32
        );

        return fract(
            p.x * p.y
        );
    }

    void main() {
        vec4 target =
            texture2D(
                uTextTargetTexture,
                aParticleUv
            );

        vec3 textPosition =
            target.xyz;

        /*
         * ------------------------------------------------
         * INTRO
         * ------------------------------------------------
         *
         * Before the page settles, particles begin as
         * loose material and assemble into the title.
         */

        vec3 loosePosition =
            vec3(
                (
                    aRandom.x -
                    0.5
                ) *
                13.0,

                (
                    aRandom.y -
                    0.5
                ) *
                7.0,

                (
                    aRandom.z -
                    0.5
                ) *
                3.5
            );

        float introEase =
            1.0 -
            pow(
                1.0 -
                clamp(
                    uIntro,
                    0.0,
                    1.0
                ),
                3.0
            );

        vec3 formedText =
            mix(
                loosePosition,
                textPosition,
                introEase
            );

        /*
         * ------------------------------------------------
         * VORTEX PROGRESS
         * ------------------------------------------------
         *
         * 0.00 -> 0.30 : text
         *
         * 0.30 -> 0.45 : violent deformation
         *
         * 0.45         : maximum vortex
         *
         * 0.45 -> 0.80 : vortex calms
         *
         * 0.80         : text completely restored
         */

        float vortexIn =
            smoothstep(
                0.30,
                0.45,
                uScroll
            );

        float vortexOut =
            smoothstep(
                0.45,
                0.80,
                uScroll
            );

        float vortexAmount =
            vortexIn *
            (
                1.0 -
                vortexOut
            );

        /*
         * ------------------------------------------------
         * VORTEX DISK
         * ------------------------------------------------
         *
         * The particle identity stays the same, but the
         * spatial arrangement changes from letter-space
         * into a large elliptical disk.
         */

        float radius =
            sqrt(
                aRandom.x
            )

        float angle =
            aRandom.y *
            PI *
            2.0

        /*
         * Very fast angular motion.
         *
         * The higher the vortex energy, the faster the
         * particles rotate.
         */

        float spinSpeed =
            5.0 +
            vortexAmount *
            42.0

        float spin =
            uTime *
            spinSpeed

        float angularNoise =
            sin(
                aRandom.z *
                    37.0 +
                uTime *
                    7.0
            ) *
            0.18

        angle +=
            spin +
            angularNoise

        /*
         * World-space width is derived from the camera
         * projection.
         *
         * 0.38 of world width = approximately 95% of
         * the 80vw card width.
         */

        float worldWidth =
            2.0 *
            10.0 *
            tan(
                radians(
                    60.0
                ) *
                0.5
            ) *
            (
                uResolution.x /
                uResolution.y
            )

        float diskRadiusX =
            worldWidth *
            0.38

        float diskRadiusY =
            diskRadiusX *
            0.34

        /*
         * Make the disk turbulent rather than perfectly
         * circular.
         */

        float turbulence =
            sin(
                angle *
                    3.0 +
                uTime *
                    8.0 +
                aRandom.w *
                    15.0
            ) *
            0.10

        float radiusWithTurbulence =
            radius *
            (
                1.0 +
                turbulence *
                vortexAmount
            )

        vec3 vortexPosition =
            vec3(
                cos(angle) *
                    radiusWithTurbulence *
                    diskRadiusX,

                sin(angle) *
                    radiusWithTurbulence *
                    diskRadiusY,

                0.0
            )

        /*
         * The vortex is not flat.
         *
         * Particles at different radii move forward/back
         * creating a magical volumetric disk.
         */

        float depthWave =
            sin(
                angle *
                    2.0 +
                radius *
                    9.0 +
                uTime *
                    5.0
            )

        vortexPosition.z +=
            depthWave *
            0.75 *
            vortexAmount

        /*
         * Strong center suction creates the feeling that
         * the entire word is being dragged into a spell.
         */

        float centerPull =
            pow(
                1.0 -
                radius,
                2.0
            )

        vortexPosition.z +=
            centerPull *
            1.15 *
            vortexAmount

        /*
         * ------------------------------------------------
         * PARTICLE FORM
         * ------------------------------------------------
         */

        vec3 particlePosition =
            mix(
                formedText,
                vortexPosition,
                vortexAmount
            )

        /*
         * Add increasingly violent deformation while
         * entering the vortex.
         */

        vec3 deformation;

        deformation.x =
            sin(
                particlePosition.y *
                    2.8 +
                uTime *
                    4.0 +
                aRandom.x *
                    20.0
            )

        deformation.y =
            cos(
                particlePosition.x *
                    3.4 -
                uTime *
                    5.0 +
                aRandom.y *
                    20.0
            )

        deformation.z =
            sin(
                particlePosition.x *
                    2.1 +
                particlePosition.y *
                    2.7 +
                uTime *
                    6.0
            )

        particlePosition +=
            deformation *
            vortexAmount *
            0.18

        /*
         * ------------------------------------------------
         * FOREGROUND / BACKGROUND DEPTH
         * ------------------------------------------------
         *
         * uLayer:
         *
         * 0 = background particles
         * 1 = foreground particles
         */

        float foreground =
            smoothstep(
                0.05,
                0.45,
                vortexAmount
            )

        if (
            uLayer >
            0.5
        ) {
            /*
             * Foreground particles are physically pushed
             * toward the camera.
             */

            particlePosition.z +=
                foreground *
                2.15

            /*
             * Slight additional forward movement around
             * the vortex edge.
             */

            particlePosition.z +=
                radius *
                foreground *
                0.65

            vAlpha =
                foreground
        } else {
            /*
             * Background disappears as the vortex comes
             * through the cards.
             */

            vAlpha =
                1.0 -
                foreground
        }

        /*
         * ------------------------------------------------
         * PARTICLE SIZE
         * ------------------------------------------------
         */

        float particleSize =
            1.05

        particleSize +=
            vortexAmount *
            (
                0.65 +
                aRandom.w *
                1.25
            )

        /*
         * The vortex gets visually denser and brighter
         * toward its center.
         */

        float radialIntensity =
            1.0 -
            radius *
            0.38

        vIntensity =
            0.55 +
            radialIntensity *
            0.45

        /*
         * Random organic flicker.
         */

        float flicker =
            0.88 +
            0.12 *
            sin(
                uTime *
                    4.0 +
                aRandom.x *
                    30.0
            )

        vIntensity *=
            flicker

        vec4 mvPosition =
            modelViewMatrix *
            vec4(
                particlePosition,
                1.0
            )

        float depth =
            max(
                1.0,
                -mvPosition.z
            )

        gl_PointSize =
            particleSize *
            (
                360.0 /
                depth
            )

        gl_Position =
            projectionMatrix *
            mvPosition
    }
`

const fragmentShader = `
    varying float vIntensity;
    varying float vAlpha;

    void main() {
        vec2 uv =
            gl_PointCoord -
            0.5

        float distanceFromCenter =
            length(
                uv
            )

        if (
            distanceFromCenter >
            0.5
        ) {
            discard
        }

        float edge =
            1.0 -
            smoothstep(
                0.18,
                0.50,
                distanceFromCenter
            )

        float core =
            1.0 -
            smoothstep(
                0.0,
                0.40,
                distanceFromCenter
            )

        vec3 shadow =
            vec3(
                0.24,
                0.22,
                0.19
            )

        vec3 stone =
            vec3(
                0.41,
                0.37,
                0.32
            )

        vec3 copper =
            vec3(
                0.57,
                0.49,
                0.40
            )

        vec3 warm =
            vec3(
                0.70,
                0.61,
                0.51
            )

        vec3 highlight =
            vec3(
                0.80,
                0.73,
                0.63
            )

        vec3 color =
            mix(
                shadow,
                stone,
                vIntensity
            )

        color =
            mix(
                color,
                copper,
                vIntensity *
                    0.55
            )

        color =
            mix(
                color,
                warm,
                vIntensity *
                    0.30
            )

        color =
            mix(
                color,
                highlight,
                core *
                    0.24
            )

        float alpha =
            edge *
            (
                0.44 +
                core *
                    0.34
            ) *
            vAlpha

        gl_FragColor =
            vec4(
                color,
                alpha
            )
    }
`

/*
 * ============================================================
 * PARTICLE FIELD
 * ============================================================
 */

const ParticleField = ({
    textTargetTexture,
    scrollProgress,
    layer,
}) => {
    const {
        size,
    } = useThree()

    const materialRef =
        useRef(null)

    const geometry =
        useMemo(
            () =>
                createParticleGeometry(),
            [],
        )

    const material =
        useMemo(
            () =>
                new THREE.ShaderMaterial({
                    vertexShader,
                    fragmentShader,

                    uniforms: {
                        uTextTargetTexture:
                        {
                            value:
                                textTargetTexture,
                        },

                        uTime:
                        {
                            value: 0,
                        },

                        uScroll:
                        {
                            value:
                                0,
                        },

                        uIntro:
                        {
                            value:
                                0,
                        },

                        uLayer:
                        {
                            value:
                                layer,
                        },

                        uResolution:
                        {
                            value:
                                new THREE.Vector2(
                                    size.width,
                                    size.height,
                                ),
                        },
                    },

                    transparent:
                        true,

                    depthWrite:
                        false,

                    depthTest:
                        true,

                    blending:
                        THREE.NormalBlending,
                }),
            [],
        )

    useEffect(() => {
        return () => {
            geometry.dispose()
            material.dispose()
        }
    }, [
        geometry,
        material,
    ])

    useEffect(() => {
        material.uniforms
            .uTextTargetTexture
            .value =
            textTargetTexture
    }, [
        material,
        textTargetTexture,
    ])

    useEffect(() => {
        material.uniforms
            .uResolution
            .value.set(
                size.width,
                size.height,
            )
    }, [
        material,
        size.width,
        size.height,
    ])

    useFrame(
        (state) => {
            const uniforms =
                materialRef.current
                    .uniforms

            uniforms
                .uTime
                .value =
                state.clock.elapsedTime

            uniforms
                .uScroll
                .value =
                scrollProgress

            /*
             * Formation happens independently from
             * scrolling.
             *
             * This gives the initial page load the
             * feeling of the title assembling itself.
             */

            uniforms
                .uIntro
                .value =
                Math.min(
                    1,
                    state.clock
                        .elapsedTime /
                    1.8,
                )
        },
    )

    return (
        <points
            geometry={
                geometry
            }
            material={
                material
            }
            ref={
                materialRef
            }
            frustumCulled={
                false
            }
        />
    )
}

/*
 * ============================================================
 * CANVAS
 * ============================================================
 */

const NebulaCanvas = ({
    textTargetTexture,
    scrollProgress,
    layer,
}) => {
    return (
        <Canvas
            camera={{
                position: [
                    0,
                    0,
                    10,
                ],

                fov: 60,
            }}
            dpr={[
                1,
                1.5,
            ]}
            gl={{
                antialias:
                    true,

                alpha:
                    true,

                powerPreference:
                    'high-performance',
            }}
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
            }}
        >
            <ParticleField
                textTargetTexture={
                    textTargetTexture
                }
                scrollProgress={
                    scrollProgress
                }
                layer={
                    layer
                }
            />
        </Canvas>
    )
}
/*
 * ============================================================
 * MAIN COMPONENT
 * ============================================================
 */

const WorkNebulaText = ({
    scrollProgress = 0,
}) => {
    const [
        textTargetTexture,
        setTextTargetTexture,
    ] = useState(null)

    useEffect(() => {
        const texture =
            createTextTargetTexture(
                `WHAT I'VE DONE`,
            )

        setTextTargetTexture(
            texture,
        )

        return () => {
            texture?.dispose()
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
            }}
        >
            {textTargetTexture && (
                <>
                    {/*
                     * BACKGROUND PARTICLES
                     *
                     * Text begins here.
                     *
                     * As the vortex forms these particles
                     * fade away, creating the impression that
                     * the material is leaving the space behind
                     * the cards.
                     */}
                    <Box
                        sx={{
                            position:
                                'absolute',

                            inset: 0,

                            zIndex: 1,

                            pointerEvents:
                                'none',
                        }}
                    >
                        <NebulaCanvas
                            textTargetTexture={
                                textTargetTexture
                            }
                            scrollProgress={
                                scrollProgress
                            }
                            layer={
                                0
                            }
                        />
                    </Box>

                    {/*
                     * FOREGROUND PARTICLES
                     *
                     * Invisible initially.
                     *
                     * As the vortex forms they move toward
                     * the camera and therefore appear in front
                     * of the cards.
                     */}
                    <Box
                        sx={{
                            position:
                                'absolute',

                            inset: 0,

                            zIndex: 20,

                            pointerEvents:
                                'none',
                        }}
                    >
                        <NebulaCanvas
                            textTargetTexture={
                                textTargetTexture
                            }
                            scrollProgress={
                                scrollProgress
                            }
                            layer={
                                1
                            }
                        />
                    </Box>
                </>
            )}
        </Box>
    )
}

export default WorkNebulaText