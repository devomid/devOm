
import {
    useEffect,
    useMemo,
    useRef,
} from 'react'

import * as THREE from 'three'

import {
    Canvas,
    useFrame,
    useThree,
} from '@react-three/fiber'


/*
 * ============================================================
 * HOW I BUILD — NEBULA TEXT
 * ============================================================
 *
 * Sequence:
 *
 *   1. Particles begin scattered.
 *   2. Particles form "HOW I BUILD".
 *   3. One second after the text has formed,
 *      selected particles leave the text.
 *   4. Free particles join them.
 *   5. Six particle rings form underneath the text.
 *
 * Ring labels:
 *
 *   IDEA
 *   ARCHITECTURE
 *   BUILD
 *   INTEGRATE
 *   HARDEN
 *   SHIP
 *
 * The rings are intentionally particle-based so they belong
 * to the same visual language as the nebula text.
 */


/* ============================================================
 * CONFIG
 * ========================================================== */

const TEXT = 'HOW I BUILD'

const PARTICLE_COUNT = 131072

const TEXTURE_SIZE = 512

const TEXT_FORM_DURATION = 2.8

const RINGS_DELAY = TEXT_FORM_DURATION + 1.0

const RING_COUNT = 6

const RING_PARTICLES = 420

const FREE_PARTICLES = 220

const RING_RADIUS = 0.62

const RING_GAP = 1.48

const RING_Y = -1.55

const RING_Z = 0.0

const RING_FLOAT_AMOUNT = 0.10

const RING_ROTATION_SPEED = 0.25


/* ============================================================
 * HELPERS
 * ========================================================== */

function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3)
}

function easeInOutCubic(value) {
    return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function randomRange(min, max) {
    return min + Math.random() * (max - min)
}


/* ============================================================
 * TEXTURE
 * ========================================================== */

function createTextTexture() {
    const canvas = document.createElement('canvas')

    canvas.width = TEXTURE_SIZE
    canvas.height = TEXTURE_SIZE

    const context = canvas.getContext('2d')

    context.clearRect(
        0,
        0,
        TEXTURE_SIZE,
        TEXTURE_SIZE,
    )

    context.fillStyle = '#ffffff'

    context.textAlign = 'center'
    context.textBaseline = 'middle'

    context.font = `
900
78px
Arial,
    Helvetica,
    sans - serif
        `

    context.fillText(
        TEXT,
        TEXTURE_SIZE / 2,
        TEXTURE_SIZE / 2,
    )

    const texture = new THREE.CanvasTexture(canvas)

    texture.needsUpdate = true

    return texture
}


/* ============================================================
 * TEXT PARTICLE POSITIONS
 * ========================================================== */

function createTextPositions() {
    const texture = createTextTexture()

    const canvas = document.createElement('canvas')

    canvas.width = TEXTURE_SIZE
    canvas.height = TEXTURE_SIZE

    const context = canvas.getContext('2d')

    context.drawImage(
        texture.image,
        0,
        0,
    )

    const pixels = context.getImageData(
        0,
        0,
        TEXTURE_SIZE,
        TEXTURE_SIZE,
    ).data

    const positions = new Float32Array(
        PARTICLE_COUNT * 3,
    )

    const candidates = []

    for (
        let y = 0;
        y < TEXTURE_SIZE;
        y += 2
    ) {
        for (
            let x = 0;
            x < TEXTURE_SIZE;
            x += 2
        ) {
            const index =
                (y * TEXTURE_SIZE + x) * 4

            const alpha = pixels[index + 3]

            if (alpha > 80) {
                candidates.push({
                    x,
                    y,
                })
            }
        }
    }

    for (
        let i = 0;
        i < PARTICLE_COUNT;
        i++
    ) {
        const candidate =
            candidates[
                Math.floor(
                    Math.random() *
                    candidates.length
                )
            ]

        const normalizedX =
            (candidate.x / TEXTURE_SIZE - 0.5)

        const normalizedY =
            -(candidate.y / TEXTURE_SIZE - 0.5)

        positions[i * 3] =
            normalizedX * 8.6

        positions[i * 3 + 1] =
            normalizedY * 3.0

        positions[i * 3 + 2] =
            randomRange(
                -0.035,
                0.035,
            )
    }

    texture.dispose()

    return positions
}


/* ============================================================
 * FREE PARTICLE POSITIONS
 * ========================================================== */

function createFreePositions() {
    const positions = new Float32Array(
        FREE_PARTICLES * 3,
    )

    for (
        let i = 0;
        i < FREE_PARTICLES;
        i++
    ) {
        positions[i * 3] =
            randomRange(-6.5, 6.5)

        positions[i * 3 + 1] =
            randomRange(-4.5, 4.5)

        positions[i * 3 + 2] =
            randomRange(-1.8, 1.8)
    }

    return positions
}


/* ============================================================
 * RING TARGETS
 * ========================================================== */

function createRingTargets() {
    const total =
        RING_COUNT *
        RING_PARTICLES

    const targets =
        new Float32Array(
            total * 3,
        )

    /*
     * Keep the six rings centered as a group.
     */

    const totalWidth =
        (RING_COUNT - 1) *
        RING_GAP

    for (
        let ring = 0;
        ring < RING_COUNT;
        ring++
    ) {
        const centerX =
            ring * RING_GAP -
            totalWidth / 2

        for (
            let particle = 0;
            particle < RING_PARTICLES;
            particle++
        ) {
            const index =
                (
                    ring *
                    RING_PARTICLES +
                    particle
                ) * 3

            /*
             * Slightly imperfect circle.
             * This keeps the ring organic rather than
             * mathematically sterile.
             */

            const angle =
                (
                    particle /
                    RING_PARTICLES
                ) *
                Math.PI *
                2

            const radius =
                RING_RADIUS +
                randomRange(
                    -0.045,
                    0.045,
                )

            targets[index] =
                centerX +
                Math.cos(angle) *
                radius

            targets[index + 1] =
                RING_Y +
                Math.sin(angle) *
                radius

            targets[index + 2] =
                RING_Z +
                randomRange(
                    -0.08,
                    0.08,
                )
        }
    }

    return targets
}


/* ============================================================
 * PARTICLE FIELD
 * ========================================================== */

function HowIBuildParticles() {
    const pointsRef = useRef(null)

    const elapsedRef = useRef(0)

    const ringProgressRef =
        useRef(0)

    const textProgressRef =
        useRef(0)

    const { camera } = useThree()

    const textPositions =
        useMemo(
            () => createTextPositions(),
            [],
        )

    const freePositions =
        useMemo(
            () => createFreePositions(),
            [],
        )

    const ringTargets =
        useMemo(
            () => createRingTargets(),
            [],
        )

    /*
     * Every ring takes particles from two sources:
     *
     *   - some particles already belonging to the text
     *   - some particles that were flying freely
     *
     * The actual render buffer remains one particle cloud.
     */

    const geometry =
        useMemo(() => {
            const geometry =
                new THREE.BufferGeometry()

            const positions =
                new Float32Array(
                    PARTICLE_COUNT * 3,
                )

            const sizes =
                new Float32Array(
                    PARTICLE_COUNT,
                )

            const ringParticleStart =
                PARTICLE_COUNT -
                (
                    RING_COUNT *
                    RING_PARTICLES
                )

            for (
                let i = 0;
                i < PARTICLE_COUNT;
                i++
            ) {
                positions[i * 3] =
                    textPositions[i * 3]

                positions[i * 3 + 1] =
                    textPositions[i * 3 + 1]

                positions[i * 3 + 2] =
                    textPositions[i * 3 + 2]

                /*
                 * Slight size variation.
                 */

                sizes[i] =
                    i >= ringParticleStart
                        ? randomRange(
                            0.75,
                            1.15,
                        )
                        : randomRange(
                            0.55,
                            1.0,
                        )
            }

            geometry.setAttribute(
                'position',
                new THREE.BufferAttribute(
                    positions,
                    3,
                ),
            )

            geometry.setAttribute(
                'aSize',
                new THREE.BufferAttribute(
                    sizes,
                    1,
                ),
            )

            return geometry
        }, [
            textPositions,
        ])

    const material =
        useMemo(() => {
            return new THREE.ShaderMaterial({
                transparent: true,

                depthWrite: false,

                blending:
                    THREE.AdditiveBlending,

                uniforms: {
                    uPixelRatio: {
                        value:
                            Math.min(
                                window.devicePixelRatio,
                                2,
                            ),
                    },

                    uOpacity: {
                        value: 0.95,
                    },
                },

                vertexShader: `
                    attribute float aSize;

                    uniform float uPixelRatio;

void main() {
                        vec4 mvPosition =
        modelViewMatrix *
        vec4(position, 1.0);

    gl_PointSize =
        aSize *
        uPixelRatio *
        2.2 *
        (
            180.0 /
            -mvPosition.z
        );

    gl_PointSize =
        clamp(
            gl_PointSize,
            0.7,
            5.0
        );

    gl_Position =
        projectionMatrix *
        mvPosition;
}
`,

                fragmentShader: `
                    uniform float uOpacity;

void main() {
                        vec2 uv =
        gl_PointCoord -
        vec2(0.5);

                        float distanceFromCenter =
        length(uv);

                        float alpha =
        1.0 -
        smoothstep(
            0.0,
            0.5,
            distanceFromCenter
        );

    alpha *= uOpacity;

    if (alpha < 0.01) {
        discard;
    }

    gl_FragColor =
        vec4(
            1.0,
            1.0,
            1.0,
            alpha
        );
}
`,
            })
        }, [])

    /*
     * Dispose geometry/material.
     */

    useEffect(() => {
        return () => {
            geometry.dispose()
            material.dispose()
        }
    }, [
        geometry,
        material,
    ])

    /*
     * Main animation.
     */

    useFrame((state, delta) => {
        if (!pointsRef.current) {
            return
        }

        elapsedRef.current += delta

        const elapsed =
            elapsedRef.current

        /*
         * ------------------------------------------------------
         * TEXT FORMATION
         * ------------------------------------------------------
         */

        const rawTextProgress =
            Math.min(
                elapsed /
                TEXT_FORM_DURATION,
                1,
            )

        const textProgress =
            easeOutCubic(
                rawTextProgress,
            )

        textProgressRef.current =
            textProgress

        /*
         * ------------------------------------------------------
         * RING FORMATION
         * ------------------------------------------------------
         */

        const ringRawProgress =
            Math.max(
                0,
                Math.min(
                    (
                        elapsed -
                        RINGS_DELAY
                    ) / 2.0,
                    1,
                ),
            )

        const ringProgress =
            easeInOutCubic(
                ringRawProgress,
            )

        ringProgressRef.current =
            ringProgress

        const positions =
            geometry.attributes.position.array

        /*
         * ------------------------------------------------------
         * TEXT PARTICLES
         * ------------------------------------------------------
         *
         * Most particles remain text.
         *
         * The last N particles are reserved for the six rings.
         */

        const ringParticleStart =
            PARTICLE_COUNT -
            (
                RING_COUNT *
                RING_PARTICLES
            )

        for (
            let i = 0;
            i < PARTICLE_COUNT;
            i++
        ) {
            /*
             * Ring particles.
             */

            if (i >= ringParticleStart) {
                const ringIndex =
                    i -
                    ringParticleStart

                const targetIndex =
                    ringIndex

                const tx =
                    ringTargets[
                        targetIndex * 3
                    ]

                const ty =
                    ringTargets[
                        targetIndex * 3 + 1
                    ]

                const tz =
                    ringTargets[
                        targetIndex * 3 + 2
                    ]

                /*
                 * Find corresponding text source.
                 *
                 * This means the ring particles literally
                 * come out of the text.
                 */

                const sourceIndex =
                    (
                        i -
                        ringParticleStart
                    ) %
                    PARTICLE_COUNT

                const sx =
                    textPositions[
                        sourceIndex * 3
                    ]

                const sy =
                    textPositions[
                        sourceIndex * 3 + 1
                    ]

                const sz =
                    textPositions[
                        sourceIndex * 3 + 2
                    ]

                /*
                 * Before ring formation:
                 * remain part of text.
                 *
                 * During formation:
                 * travel toward ring.
                 */

                positions[i * 3] =
                    THREE.MathUtils.lerp(
                        sx,
                        tx,
                        ringProgress,
                    )

                positions[i * 3 + 1] =
                    THREE.MathUtils.lerp(
                        sy,
                        ty,
                        ringProgress,
                    )

                positions[i * 3 + 2] =
                    THREE.MathUtils.lerp(
                        sz,
                        tz,
                        ringProgress,
                    )

                continue
            }

            /*
             * Normal text particles.
             */

            const tx =
                textPositions[i * 3]

            const ty =
                textPositions[i * 3 + 1]

            const tz =
                textPositions[i * 3 + 2]

            /*
             * Start position.
             */

            const startX =
                randomRange(
                    -8,
                    8,
                )

            const startY =
                randomRange(
                    -4,
                    4,
                )

            const startZ =
                randomRange(
                    -2,
                    2,
                )

            /*
             * We don't want to generate random values
             * every frame.
             *
             * Instead use deterministic pseudo-random
             * values based on particle index.
             */

            const noise =
                Math.sin(
                    i * 12.9898
                ) * 43758.5453

            const random =
                noise -
                Math.floor(noise)

            const sx =
                -8 +
                random * 16

            const sy =
                -4 +
                (
                    Math.sin(
                        i * 7.31
                    ) *
                    0.5 +
                    0.5
                ) * 8

            const sz =
                -2 +
                (
                    Math.cos(
                        i * 5.17
                    ) *
                    0.5 +
                    0.5
                ) * 4

            /*
             * Slight per-particle delay.
             *
             * This prevents the entire word from appearing
             * at exactly the same time.
             */

            const particleDelay =
                random * 0.35

            const particleProgress =
                Math.max(
                    0,
                    Math.min(
                        (
                            rawTextProgress -
                            particleDelay
                        ) /
                        (
                            1 -
                            particleDelay
                        ),
                        1,
                    ),
                )

            const eased =
                easeOutCubic(
                    particleProgress,
                )

            positions[i * 3] =
                THREE.MathUtils.lerp(
                    sx,
                    tx,
                    eased,
                )

            positions[i * 3 + 1] =
                THREE.MathUtils.lerp(
                    sy,
                    ty,
                    eased,
                )

            positions[i * 3 + 2] =
                THREE.MathUtils.lerp(
                    sz,
                    tz,
                    eased,
                )

            /*
             * Tiny breathing movement once formed.
             */

            if (
                textProgress > 0.98
            ) {
                positions[i * 3 + 1] +=
                    Math.sin(
                        elapsed * 0.65 +
                        i * 0.003
                    ) *
                    0.008
            }
        }

        /*
         * ------------------------------------------------------
         * FREE-FLYING PARTICLES
         * ------------------------------------------------------
         *
         * These are not part of the visible text.
         *
         * They move around the scene and are visually pulled
         * into the rings when ring formation begins.
         *
         * They occupy a small portion of the ring particle
         * population conceptually through the ring target
         * motion below.
         */

        for (
            let ring = 0;
            ring < RING_COUNT;
            ring++
        ) {
            const base =
                ring *
                RING_PARTICLES

            /*
             * Slight individual ring motion.
             */

            const floatOffset =
                Math.sin(
                    elapsed * 0.75 +
                    ring * 0.7
                ) *
                RING_FLOAT_AMOUNT

            for (
                let particle = 0;
                particle < RING_PARTICLES;
                particle++
            ) {
                const index =
                    (
                        base +
                        particle
                    ) * 3

                if (
                    ringProgress > 0.0
                ) {
                    /*
                     * Rotate each ring around its center.
                     */

                    const angle =
                        (
                            particle /
                            RING_PARTICLES
                        ) *
                        Math.PI *
                        2 +
                        elapsed *
                        RING_ROTATION_SPEED *
                        (
                            ring % 2 === 0
                                ? 1
                                : -1
                        )

                    const totalWidth =
                        (
                            RING_COUNT -
                            1
                        ) *
                        RING_GAP

                    const centerX =
                        ring *
                        RING_GAP -
                        totalWidth /
                        2

                    const radius =
                        RING_RADIUS

                    const ringX =
                        centerX +
                        Math.cos(angle) *
                        radius

                    const ringY =
                        RING_Y +
                        floatOffset +
                        Math.sin(angle) *
                        radius

                    const ringZ =
                        RING_Z +
                        Math.sin(
                            angle * 2
                        ) *
                        0.06

                    positions[index] =
                        THREE.MathUtils.lerp(
                            positions[index],
                            ringX,
                            0.08,
                        )

                    positions[index + 1] =
                        THREE.MathUtils.lerp(
                            positions[index + 1],
                            ringY,
                            0.08,
                        )

                    positions[index + 2] =
                        THREE.MathUtils.lerp(
                            positions[index + 2],
                            ringZ,
                            0.08,
                        )
                }
            }
        }

        geometry.attributes.position.needsUpdate =
            true

        /*
         * Very subtle camera breathing.
         */

        camera.position.x =
            Math.sin(
                elapsed * 0.12
            ) *
            0.035

        camera.position.y =
            Math.cos(
                elapsed * 0.14
            ) *
            0.025
    })

    return (
        <points
            ref={pointsRef}
            geometry={geometry}
            material={material}
        />
    )
}


/* ============================================================
 * CANVAS
 * ========================================================== */

export default function HowIBuildNebulaText() {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
            }}
        >
            <Canvas
                camera={{
                    position: [
                        0,
                        0,
                        8.5,
                    ],
                    fov: 42,
                    near: 0.1,
                    far: 100,
                }}
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference:
                        'high-performance',
                }}
            >
                <HowIBuildParticles />
            </Canvas>
        </div>
    )
}