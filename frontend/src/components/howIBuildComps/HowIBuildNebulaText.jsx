
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


const TEXT = 'HOW I BUILD'

const PARTICLE_COUNT = 110000

const TEXT_TEXTURE_SIZE = 1024

const TEXT_FORM_TIME = 3.2

const RING_DELAY = 1.0

const RING_FORM_TIME = 2.4

const RING_COUNT = 6

const PARTICLES_PER_RING = 700

const RING_PARTICLE_COUNT =
    RING_COUNT * PARTICLES_PER_RING

const AMBIENT_PARTICLE_COUNT = 6500

const TEXT_PARTICLE_COUNT =
    PARTICLE_COUNT -
    RING_PARTICLE_COUNT


const RING_NAMES = [
    'IDEA',
    'ARCHITECTURE',
    'BUILD',
    'INTEGRATE',
    'HARDEN',
    'SHIP',
]


function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value),
    )
}


function smoothstep(edge0, edge1, value) {
    const x = clamp(
        (value - edge0) /
        (edge1 - edge0),
        0,
        1,
    )

    return (
        x *
        x *
        (3 - 2 * x)
    )
}


function easeOutCubic(value) {
    return 1 -
        Math.pow(
            1 - value,
            3,
        )
}


function easeInOutCubic(value) {
    return value < 0.5
        ? 4 * value * value * value
        : 1 -
        Math.pow(
            -2 * value + 2,
            3,
        ) /
        2
}


function hash(value) {
    const x =
        Math.sin(
            value * 12.9898 +
            78.233,
        ) *
        43758.5453123

    return x -
        Math.floor(x)
}


function createTextMask() {
    const canvas =
        document.createElement(
            'canvas',
        )

    canvas.width =
        TEXT_TEXTURE_SIZE

    canvas.height =
        TEXT_TEXTURE_SIZE

    const context =
        canvas.getContext('2d')

    context.clearRect(
        0,
        0,
        TEXT_TEXTURE_SIZE,
        TEXT_TEXTURE_SIZE,
    )

    context.fillStyle =
        '#ffffff'

    context.textAlign =
        'center'

    context.textBaseline =
        'middle'

    context.font =
        '900 118px Arial, Helvetica, sans-serif'

    context.fillText(
        TEXT,
        TEXT_TEXTURE_SIZE / 2,
        TEXT_TEXTURE_SIZE / 2,
    )

    return {
        canvas,
        context,
    }
}


function createTextTargets() {
    const {
        canvas,
        context,
    } = createTextMask()

    const imageData =
        context.getImageData(
            0,
            0,
            TEXT_TEXTURE_SIZE,
            TEXT_TEXTURE_SIZE,
        )

    const pixels =
        imageData.data

    const candidates = []

    /*
     * Sample the rendered text.
     *
     * We intentionally don't use every pixel.
     * The spacing creates a more nebula-like particle field.
     */

    for (
        let y = 0;
        y < TEXT_TEXTURE_SIZE;
        y += 3
    ) {
        for (
            let x = 0;
            x < TEXT_TEXTURE_SIZE;
            x += 3
        ) {
            const index =
                (
                    y *
                    TEXT_TEXTURE_SIZE +
                    x
                ) *
                4

            const alpha =
                pixels[index + 3]

            if (alpha > 100) {
                candidates.push({
                    x,
                    y,
                })
            }
        }
    }

    const targets =
        new Float32Array(
            TEXT_PARTICLE_COUNT * 3,
        )

    for (
        let i = 0;
        i < TEXT_PARTICLE_COUNT;
        i++
    ) {
        const candidate =
            candidates[
            Math.floor(
                hash(i + 11) *
                candidates.length,
            )
            ]

        const x =
            (
                candidate.x /
                TEXT_TEXTURE_SIZE -
                0.5
            )

        const y =
            -(
                candidate.y /
                TEXT_TEXTURE_SIZE -
                0.5
            )

        targets[i * 3] =
            x * 9.8

        targets[i * 3 + 1] =
            y * 3.2

        /*
         * Tiny depth variation.
         */
        targets[i * 3 + 2] =
            (
                hash(i + 17) -
                0.5
            ) *
            0.12
    }

    /*
     * Keep the canvas alive only while constructing.
     */
    void canvas

    return targets
}


function createInitialPositions() {
    const positions =
        new Float32Array(
            PARTICLE_COUNT * 3,
        )

    for (
        let i = 0;
        i < PARTICLE_COUNT;
        i++
    ) {
        const r1 =
            hash(i * 1.71 + 2)

        const r2 =
            hash(i * 3.19 + 9)

        const r3 =
            hash(i * 7.41 + 14)

        /*
         * Most particles begin around the text area,
         * rather than at arbitrary points in space.
         *
         * This gives the formation a nebula feel.
         */

        positions[i * 3] =
            (
                r1 - 0.5
            ) *
            14

        positions[i * 3 + 1] =
            (
                r2 - 0.5
            ) *
            8

        positions[i * 3 + 2] =
            (
                r3 - 0.5
            ) *
            4
    }

    return positions
}


function createAmbientTargets() {
    const positions =
        new Float32Array(
            AMBIENT_PARTICLE_COUNT * 3,
        )

    for (
        let i = 0;
        i < AMBIENT_PARTICLE_COUNT;
        i++
    ) {
        const angle =
            hash(i * 2.13) *
            Math.PI *
            2

        const radius =
            4.8 +
            hash(i * 5.17) *
            5.5

        positions[i * 3] =
            Math.cos(angle) *
            radius

        positions[i * 3 + 1] =
            (
                hash(i * 8.11) -
                0.5
            ) *
            7

        positions[i * 3 + 2] =
            (
                hash(i * 3.81) -
                0.5
            ) *
            4
    }

    return positions
}


function createRingTargets() {
    const targets =
        new Float32Array(
            RING_PARTICLE_COUNT * 3,
        )

    const totalWidth =
        5 *
        1.72

    for (
        let ring = 0;
        ring < RING_COUNT;
        ring++
    ) {
        const centerX =
            ring *
            1.72 -
            totalWidth / 2

        const radius =
            0.66 +
            hash(ring * 31) *
            0.12

        for (
            let particle = 0;
            particle < PARTICLES_PER_RING;
            particle++
        ) {
            const index =
                (
                    ring *
                    PARTICLES_PER_RING +
                    particle
                ) *
                3

            const t =
                particle /
                PARTICLES_PER_RING

            const angle =
                t *
                Math.PI *
                2

            /*
             * Several noise frequencies make the ring
             * deliberately imperfect.
             */

            const noise1 =
                Math.sin(
                    angle * 3 +
                    ring * 1.7,
                )

            const noise2 =
                Math.sin(
                    angle * 7 -
                    ring * 0.9,
                )

            const noise3 =
                Math.sin(
                    angle * 13 +
                    particle * 0.017,
                )

            const irregularity =
                1 +
                noise1 * 0.055 +
                noise2 * 0.025 +
                noise3 * 0.012

            const particleRadius =
                radius *
                irregularity

            /*
             * Ring has thickness.
             */
            const thickness =
                (
                    hash(
                        particle +
                        ring * 991,
                    ) -
                    0.5
                ) *
                0.085

            const r =
                particleRadius +
                thickness

            targets[index] =
                centerX +
                Math.cos(angle) *
                r

            targets[index + 1] =
                Math.sin(angle) *
                r

            /*
             * Depth makes it feel like a 3D cloud.
             */
            targets[index + 2] =
                Math.sin(
                    angle * 2 +
                    ring,
                ) *
                0.16 +
                (
                    hash(
                        particle *
                        2.7 +
                        ring * 71,
                    ) -
                    0.5
                ) *
                0.16
        }
    }

    return targets
}


function NebulaField() {
    const pointsRef =
        useRef(null)

    const elapsedRef =
        useRef(0)

    const {
        camera,
    } = useThree()

    const textTargets =
        useMemo(
            () =>
                createTextTargets(),
            [],
        )

    const initialPositions =
        useMemo(
            () =>
                createInitialPositions(),
            [],
        )

    const ambientTargets =
        useMemo(
            () =>
                createAmbientTargets(),
            [],
        )

    const ringTargets =
        useMemo(
            () =>
                createRingTargets(),
            [],
        )

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

            const phases =
                new Float32Array(
                    PARTICLE_COUNT,
                )

            const speeds =
                new Float32Array(
                    PARTICLE_COUNT,
                )

            for (
                let i = 0;
                i < PARTICLE_COUNT;
                i++
            ) {
                positions[i * 3] =
                    initialPositions[
                    i * 3
                    ]

                positions[i * 3 + 1] =
                    initialPositions[
                    i * 3 + 1
                    ]

                positions[i * 3 + 2] =
                    initialPositions[
                    i * 3 + 2
                    ]

                sizes[i] =
                    0.45 +
                    hash(i * 9.1) *
                    1.05

                phases[i] =
                    hash(i * 4.73) *
                    Math.PI *
                    2

                speeds[i] =
                    0.35 +
                    hash(i * 2.81) *
                    0.7
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

            geometry.setAttribute(
                'aPhase',
                new THREE.BufferAttribute(
                    phases,
                    1,
                ),
            )

            geometry.setAttribute(
                'aSpeed',
                new THREE.BufferAttribute(
                    speeds,
                    1,
                ),
            )

            return geometry
        }, [
            initialPositions,
        ])

    const material =
        useMemo(() => {
            return new THREE.ShaderMaterial({
                transparent: true,

                depthWrite: false,

                blending:
                    THREE.AdditiveBlending,

                uniforms: {
                    uTime: {
                        value: 0,
                    },

                    uOpacity: {
                        value: 0.94,
                    },

                    uPixelRatio: {
                        value: Math.min(
                            window.devicePixelRatio,
                            2,
                        ),
                    },
                },

                vertexShader: `
                    attribute float aSize;
                    attribute float aPhase;
                    attribute float aSpeed;

                    uniform float uTime;
                    uniform float uPixelRatio;

                    varying float vBrightness;

                    void main() {
                        vec4 mvPosition =
                            modelViewMatrix *
                            vec4(position, 1.0);

                        float pulse =
                            0.78 +
                            0.22 *
                            sin(
                                uTime *
                                aSpeed +
                                aPhase
                            );

                        gl_PointSize =
                            aSize *
                            pulse *
                            uPixelRatio *
                            (
                                175.0 /
                                -mvPosition.z
                            );

                        gl_PointSize =
                            clamp(
                                gl_PointSize,
                                0.45,
                                4.5
                            );

                        vBrightness =
                            pulse;

                        gl_Position =
                            projectionMatrix *
                            mvPosition;
                    }
                `,

                fragmentShader: `
                    uniform float uOpacity;

                    varying float vBrightness;

                    void main() {
                        vec2 uv =
                            gl_PointCoord -
                            vec2(0.5);

                        float d =
                            length(uv);

                        float alpha =
                            1.0 -
                            smoothstep(
                                0.05,
                                0.5,
                                d
                            );

                        alpha *=
                            vBrightness *
                            uOpacity;

                        if (
                            alpha < 0.01
                        ) {
                            discard;
                        }

                        vec3 core =
                            vec3(
                                1.0,
                                1.0,
                                1.0
                            );

                        gl_FragColor =
                            vec4(
                                core,
                                alpha
                            );
                    }
                `,
            })
        }, [])

    useEffect(() => {
        return () => {
            geometry.dispose()
            material.dispose()
        }
    }, [
        geometry,
        material,
    ])

    useFrame(
        (state, delta) => {
            if (
                !pointsRef.current
            ) {
                return
            }

            elapsedRef.current +=
                delta

            const time =
                elapsedRef.current

            material.uniforms.uTime.value =
                time

            const positions =
                geometry
                    .attributes
                    .position
                    .array

            /*
             * ==================================================
             * TEXT FORMATION
             * ==================================================
             */

            const formRaw =
                clamp(
                    time /
                    TEXT_FORM_TIME,
                    0,
                    1,
                )

            const formProgress =
                easeOutCubic(
                    formRaw,
                )

            /*
             * ==================================================
             * RING TIMING
             * ==================================================
             */

            const ringStart =
                TEXT_FORM_TIME +
                RING_DELAY

            const ringRaw =
                clamp(
                    (
                        time -
                        ringStart
                    ) /
                    RING_FORM_TIME,
                    0,
                    1,
                )

            const ringProgress =
                easeInOutCubic(
                    ringRaw,
                )

            /*
             * ==================================================
             * MAIN TEXT PARTICLES
             * ==================================================
             */

            for (
                let i = 0;
                i < TEXT_PARTICLE_COUNT;
                i++
            ) {
                const index =
                    i * 3

                const targetX =
                    textTargets[index]

                const targetY =
                    textTargets[index + 1]

                const targetZ =
                    textTargets[index + 2]

                /*
                 * A subset near the end of the particle
                 * population will eventually be released.
                 */

                const extraction =
                    i >
                        TEXT_PARTICLE_COUNT -
                        RING_PARTICLE_COUNT
                        ? smoothstep(
                            0,
                            1,
                            ringProgress,
                        )
                        : 0

                /*
                 * Give extracted particles an intermediate
                 * wandering position before they reach rings.
                 */

                const angle =
                    (
                        hash(i * 4.13) *
                        Math.PI *
                        2
                    ) +
                    time *
                    (
                        0.25 +
                        hash(i * 7.3) *
                        0.25
                    )

                const escapeRadius =
                    1.2 +
                    hash(i * 9.1) *
                    1.4

                const escapeX =
                    targetX +
                    Math.cos(angle) *
                    escapeRadius

                const escapeY =
                    targetY -
                    (
                        0.5 +
                        hash(i * 3.7) *
                        0.9
                    )

                const escapeZ =
                    targetZ +
                    Math.sin(angle) *
                    0.8

                /*
                 * Determine which ring this extracted
                 * particle eventually belongs to.
                 */

                let ringTargetX =
                    escapeX

                let ringTargetY =
                    escapeY

                let ringTargetZ =
                    escapeZ

                if (
                    extraction > 0
                ) {
                    const ringLocal =
                        i %
                        RING_PARTICLE_COUNT

                    const ringIndex =
                        ringLocal *
                        3

                    ringTargetX =
                        ringTargets[
                        ringIndex
                        ]

                    ringTargetY =
                        ringTargets[
                        ringIndex + 1
                        ]

                    ringTargetZ =
                        ringTargets[
                        ringIndex + 2
                        ]
                }

                let x =
                    THREE.MathUtils.lerp(
                        initialPositions[index],
                        targetX,
                        formProgress,
                    )

                let y =
                    THREE.MathUtils.lerp(
                        initialPositions[
                        index + 1
                        ],
                        targetY,
                        formProgress,
                    )

                let z =
                    THREE.MathUtils.lerp(
                        initialPositions[
                        index + 2
                        ],
                        targetZ,
                        formProgress,
                    )

                /*
                 * Release from text.
                 */

                if (
                    extraction > 0
                ) {
                    const travel =
                        smoothstep(
                            0,
                            1,
                            extraction,
                        )

                    x =
                        THREE.MathUtils.lerp(
                            x,
                            THREE.MathUtils.lerp(
                                escapeX,
                                ringTargetX,
                                travel,
                            ),
                            extraction,
                        )

                    y =
                        THREE.MathUtils.lerp(
                            y,
                            THREE.MathUtils.lerp(
                                escapeY,
                                ringTargetY,
                                travel,
                            ),
                            extraction,
                        )

                    z =
                        THREE.MathUtils.lerp(
                            z,
                            THREE.MathUtils.lerp(
                                escapeZ,
                                ringTargetZ,
                                travel,
                            ),
                            extraction,
                        )
                }

                /*
                 * Text breathing.
                 */

                if (
                    formProgress > 0.98 &&
                    extraction < 0.1
                ) {
                    y +=
                        Math.sin(
                            time * 0.55 +
                            i * 0.004,
                        ) *
                        0.009
                }

                positions[index] =
                    x

                positions[index + 1] =
                    y

                positions[index + 2] =
                    z
            }

            /*
             * ==================================================
             * AMBIENT PARTICLES
             * ==================================================
             *
             * These particles exist around the text from
             * the beginning.
             *
             * When rings form, some are pulled into the rings.
             */

            const ambientStart =
                TEXT_PARTICLE_COUNT

            for (
                let i = 0;
                i < AMBIENT_PARTICLE_COUNT;
                i++
            ) {
                const particleIndex =
                    ambientStart +
                    i

                if (
                    particleIndex >=
                    PARTICLE_COUNT
                ) {
                    break
                }

                const index =
                    particleIndex * 3

                const phase =
                    hash(i * 3.31) *
                    Math.PI *
                    2

                const speed =
                    0.08 +
                    hash(i * 8.71) *
                    0.16

                const baseX =
                    ambientTargets[
                    (
                        i % AMBIENT_PARTICLE_COUNT
                    ) * 3
                    ]

                const baseY =
                    ambientTargets[
                    (
                        i % AMBIENT_PARTICLE_COUNT
                    ) * 3 +
                    1
                    ]

                const baseZ =
                    ambientTargets[
                    (
                        i % AMBIENT_PARTICLE_COUNT
                    ) * 3 +
                    2
                    ]

                let x =
                    baseX +
                    Math.sin(
                        time * speed +
                        phase,
                    ) *
                    0.45

                let y =
                    baseY +
                    Math.cos(
                        time *
                        speed *
                        0.8 +
                        phase,
                    ) *
                    0.32

                let z =
                    baseZ +
                    Math.sin(
                        time *
                        speed *
                        0.65 +
                        phase,
                    ) *
                    0.22

                /*
                 * Only a subset of ambient particles
                 * gets recruited.
                 */

                const recruit =
                    ringRaw > 0 &&
                        hash(i * 13.71) >
                        0.86
                        ? ringProgress
                        : 0

                if (
                    recruit > 0
                ) {
                    const ringIndex =
                        i %
                        RING_PARTICLE_COUNT

                    const targetIndex =
                        ringIndex * 3

                    x =
                        THREE.MathUtils.lerp(
                            x,
                            ringTargets[
                            targetIndex
                            ],
                            recruit,
                        )

                    y =
                        THREE.MathUtils.lerp(
                            y,
                            ringTargets[
                            targetIndex + 1
                            ],
                            recruit,
                        )

                    z =
                        THREE.MathUtils.lerp(
                            z,
                            ringTargets[
                            targetIndex + 2
                            ],
                            recruit,
                        )
                }

                positions[index] =
                    x

                positions[index + 1] =
                    y

                positions[index + 2] =
                    z
            }

            /*
             * ==================================================
             * RING MOTION
             * ==================================================
             *
             * Once formed, the rings don't become rigid.
             * Their particles continue to move.
             */

            if (
                ringProgress > 0
            ) {
                for (
                    let ring = 0;
                    ring < RING_COUNT;
                    ring++
                ) {
                    const centerX =
                        ring *
                        1.72 -
                        4.30

                    const centerY =
                        -1.65 +
                        Math.sin(
                            time * 0.55 +
                            ring * 0.75,
                        ) *
                        0.08

                    const centerZ =
                        Math.sin(
                            time * 0.32 +
                            ring * 0.9,
                        ) *
                        0.12

                    const direction =
                        ring % 2 === 0
                            ? 1
                            : -1

                    for (
                        let particle = 0;
                        particle <
                        PARTICLES_PER_RING;
                        particle++
                    ) {
                        const index =
                            (
                                ring *
                                PARTICLES_PER_RING +
                                particle
                            ) *
                            3

                        /*
                         * The first part of the buffer
                         * represents extracted text particles.
                         *
                         * We use a continuous procedural
                         * ring position here, so the resulting
                         * shape stays organic.
                         */

                        const t =
                            particle /
                            PARTICLES_PER_RING

                        const angle =
                            t *
                            Math.PI *
                            2 +
                            time *
                            0.18 *
                            direction

                        const n1 =
                            Math.sin(
                                angle * 3 +
                                ring * 1.8,
                            )

                        const n2 =
                            Math.sin(
                                angle * 6 -
                                ring * 0.7 +
                                time * 0.3,
                            )

                        const n3 =
                            Math.sin(
                                angle * 11 +
                                ring,
                            )

                        const radius =
                            0.67 +
                            n1 * 0.045 +
                            n2 * 0.028 +
                            n3 * 0.014

                        const x =
                            centerX +
                            Math.cos(angle) *
                            radius

                        const y =
                            centerY +
                            Math.sin(angle) *
                            radius

                        const z =
                            centerZ +
                            Math.sin(
                                angle * 2 +
                                ring,
                            ) *
                            0.15

                        /*
                         * Do not snap the particles.
                         * A small interpolation keeps the
                         * nebula character.
                         */

                        positions[index] =
                            THREE.MathUtils.lerp(
                                positions[index],
                                x,
                                0.055,
                            )

                        positions[index + 1] =
                            THREE.MathUtils.lerp(
                                positions[
                                index + 1
                                ],
                                y,
                                0.055,
                            )

                        positions[index + 2] =
                            THREE.MathUtils.lerp(
                                positions[
                                index + 2
                                ],
                                z,
                                0.055,
                            )
                    }
                }
            }

            geometry.attributes
                .position
                .needsUpdate = true

            /*
             * Subtle camera breathing.
             */

            camera.position.x =
                Math.sin(
                    time * 0.09,
                ) *
                0.045

            camera.position.y =
                Math.cos(
                    time * 0.11,
                ) *
                0.03
        },
    )

    return (
        <points
            ref={pointsRef}
            geometry={geometry}
            material={material}
        />
    )
}


export default function HowIBuildNebulaText() {
    return (
        <div
            className="how-i-build-nebula"
        >
            <Canvas
                camera={{
                    position: [
                        0,
                        0,
                        9,
                    ],

                    fov: 42,

                    near: 0.1,

                    far: 100,
                }}

                dpr={[
                    1,
                    2,
                ]}

                gl={{
                    antialias: true,

                    alpha: true,

                    powerPreference:
                        'high-performance',
                }}
            >
                <NebulaField />
            </Canvas>
        </div>
    )
}