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

const PARTICLE_COUNT = 262144
const TEXTURE_SIZE = 512
const TEXT_PARTICLE_COUNT = 12000

const TEXTURE_CAPACITY =
    TEXTURE_SIZE *
    TEXTURE_SIZE

/*
 * ============================================================
 * PARTICLE RENDER
 * ============================================================
 */

const particleVertexShader = `
    attribute vec2 aParticleUv;
    attribute float aIntensity;
    attribute float aSize;

    uniform sampler2D uPositionTexture;

    varying float vIntensity;

    void main() {
        vIntensity =
            aIntensity;

        vec3 particlePosition =
            texture2D(
                uPositionTexture,
                aParticleUv
            ).xyz;

        vec4 mvPosition =
            modelViewMatrix *
            vec4(
                particlePosition,
                1.0
            );

        float depth =
            max(
                1.0,
                -mvPosition.z
            );

        gl_PointSize =
            aSize *
            (
                440.0 /
                depth
            );

        gl_Position =
            projectionMatrix *
            mvPosition;
    }
`

const particleFragmentShader = `
    varying float vIntensity;

    vec3 getColor(
        float t
    ) {
        vec3 shadow =
            vec3(
                0.24,
                0.22,
                0.19
            );

        vec3 stone =
            vec3(
                0.41,
                0.37,
                0.32
            );

        vec3 copper =
            vec3(
                0.57,
                0.49,
                0.40
            );

        vec3 warm =
            vec3(
                0.70,
                0.61,
                0.51
            );

        vec3 highlight =
            vec3(
                0.80,
                0.73,
                0.63
            );

        if (
            t < 0.20
        ) {
            return mix(
                shadow,
                stone,
                smoothstep(
                    0.0,
                    0.20,
                    t
                )
            );
        }

        if (
            t < 0.52
        ) {
            return mix(
                stone,
                copper,
                smoothstep(
                    0.20,
                    0.52,
                    t
                )
            );
        }

        if (
            t < 0.82
        ) {
            return mix(
                copper,
                warm,
                smoothstep(
                    0.52,
                    0.82,
                    t
                )
            );
        }

        return mix(
            warm,
            highlight,
            smoothstep(
                0.82,
                1.0,
                t
            )
        );
    }

    void main() {
        vec2 uv =
            gl_PointCoord -
            0.5;

        float distanceFromCenter =
            length(
                uv
            );

        if (
            distanceFromCenter >
            0.5
        ) {
            discard;
        }

        float edge =
            1.0 -
            smoothstep(
                0.12,
                0.50,
                distanceFromCenter
            );

        float core =
            1.0 -
            smoothstep(
                0.0,
                0.43,
                distanceFromCenter
            );

        vec3 color =
            getColor(
                vIntensity
            );

        float alpha =
            edge *
            (
                0.42 +
                core * 0.32
            );

        gl_FragColor =
            vec4(
                color,
                alpha
            );
    }
`

/*
 * ============================================================
 * SIMULATION VERTEX
 * ============================================================
 */

const simulationVertexShader = `
    varying vec2 vUv;

    void main() {
        vUv =
            uv;

        gl_Position =
            vec4(
                position.xy,
                0.0,
                1.0
            );
    }
`

/*
 * ============================================================
 * VELOCITY / GAS FIELD
 * ============================================================
 */

const velocityFlowFragmentShader = `
    precision highp float;

    uniform sampler2D uPositionTexture;
    uniform sampler2D uVelocityTexture;
    uniform sampler2D uMetadataTexture;

    uniform sampler2D uTextTargetTexture;

    uniform float uTime;
    uniform float uTextEnabled;
    uniform float uTextStrength;

    varying vec2 vUv;

    void main() {
        vec3 position =
            texture2D(
                uPositionTexture,
                vUv
            ).xyz;

        vec3 velocity =
            texture2D(
                uVelocityTexture,
                vUv
            ).xyz;

        vec4 metadata =
            texture2D(
                uMetadataTexture,
                vUv
            );

        float phase =
            metadata.x;

        float particleSpeed =
            metadata.y;

        float textParticle =
            1.0 -
            step(
                0.5,
                metadata.z
            );

        float freeParticle =
            step(
                0.5,
                metadata.z
            );

        float x =
            position.x;

        float y =
            position.y;

        float z =
            position.z;

        /*
         * ====================================================
         * LARGE SCALE INTERSTELLAR MOTION
         * ====================================================
         *
         * Several slowly changing fields overlap.
         * They do not describe a fixed shape.
         *
         * The result is continuously changing pressure-like
         * movement through the cloud.
         */

        float largeA =
            sin(
                y * 0.25 +
                z * 0.61 +
                uTime * 0.055 +
                phase
            );

        float largeB =
            cos(
                x * 0.28 -
                z * 0.47 -
                uTime * 0.062 +
                phase * 1.31
            );

        float largeC =
            sin(
                x * 0.22 +
                y * 0.31 +
                z * 0.17 +
                uTime * 0.047 +
                phase * 0.73
            );

        float largeD =
            cos(
                x * 0.37 -
                y * 0.21 +
                z * 0.51 -
                uTime * 0.071 +
                phase * 1.61
            );

        /*
         * ====================================================
         * MEDIUM SCALE TURBULENCE
         * ====================================================
         */

        float mediumA =
            sin(
                y * 0.72 +
                z * 1.08 +
                uTime * 0.13 +
                phase * 1.17
            );

        float mediumB =
            cos(
                x * 0.81 -
                z * 0.93 -
                uTime * 0.16 +
                phase * 0.83
            );

        float mediumC =
            sin(
                x * 0.67 -
                y * 0.74 +
                uTime * 0.11 +
                phase * 1.73
            );

        /*
         * ====================================================
         * SMALL SCALE GAS
         * ====================================================
         */

        float smallA =
            sin(
                y * 1.58 +
                z * 1.21 +
                uTime * 0.23 +
                phase
            );

        float smallB =
            cos(
                x * 1.46 -
                z * 1.31 -
                uTime * 0.19 +
                phase * 1.2
            );

        float smallC =
            sin(
                x * 1.31 +
                y * 1.19 +
                uTime * 0.21 +
                phase * 0.61
            );

        /*
         * ====================================================
         * CURL / SWIRL
         * ====================================================
         */

        float curlX =
            sin(
                y * 0.43 +
                z * 0.76 +
                uTime * 0.083 +
                phase
            ) -
            cos(
                z * 0.31 -
                uTime * 0.067 +
                phase * 1.43
            );

        float curlY =
            cos(
                x * 0.41 -
                z * 0.63 -
                uTime * 0.076 +
                phase
            ) -
            sin(
                z * 0.29 +
                uTime * 0.061 +
                phase * 0.81
            );

        float curlZ =
            sin(
                x * 0.36 +
                y * 0.48 +
                uTime * 0.071 +
                phase * 1.11
            ) -
            cos(
                y * 0.32 -
                uTime * 0.052 +
                phase
            );

        /*
         * ====================================================
         * MOVING CLOUD CENTERS
         * ====================================================
         *
         * These are temporary moving concentrations.
         *
         * They create the feeling of matter gathering,
         * twisting and collapsing.
         *
         * They are deliberately NOT a fixed orbital system.
         */

        vec3 centerA =
            vec3(
                sin(
                    uTime * 0.19
                ) * 4.6,
                cos(
                    uTime * 0.13
                ) * 2.4,
                sin(
                    uTime * 0.11
                ) * 1.15
            );

        vec3 centerB =
            vec3(
                cos(
                    uTime * 0.16 +
                    2.1
                ) * 5.2,
                sin(
                    uTime * 0.21 +
                    1.7
                ) * 2.7,
                cos(
                    uTime * 0.14
                ) * 1.25
            );

        vec3 centerC =
            vec3(
                sin(
                    uTime * 0.11 +
                    4.4
                ) * 3.9,
                cos(
                    uTime * 0.17 +
                    3.2
                ) * 3.0,
                sin(
                    uTime * 0.18
                ) * 1.35
            );

        vec3 offsetA =
            centerA -
            position;

        vec3 offsetB =
            centerB -
            position;

        vec3 offsetC =
            centerC -
            position;

        float distanceA =
            length(
                offsetA
            );

        float distanceB =
            length(
                offsetB
            );

        float distanceC =
            length(
                offsetC
            );

        float influenceA =
            exp(
                -distanceA *
                distanceA *
                0.060
            );

        float influenceB =
            exp(
                -distanceB *
                distanceB *
                0.052
            );

        float influenceC =
            exp(
                -distanceC *
                distanceC *
                0.071
            );

        /*
         * ====================================================
         * TEMPORARY GRAVITATIONAL GATHERING
         * ====================================================
         */

        vec3 gathering =
            offsetA *
            influenceA *
            0.019;

        gathering +=
            offsetB *
            influenceB *
            0.016;

        gathering +=
            offsetC *
            influenceC *
            0.013;

        /*
         * ====================================================
         * SWIRLING AROUND THE MOVING CONCENTRATIONS
         * ====================================================
         *
         * This is what prevents the gathering from looking
         * like particles simply flying toward three points.
         */

        vec3 swirlA =
            vec3(
                -offsetA.y,
                offsetA.x,
                offsetA.z *
                0.42
            );

        vec3 swirlB =
            vec3(
                -offsetB.y,
                offsetB.x,
                -offsetB.z *
                0.37
            );

        vec3 swirlC =
            vec3(
                -offsetC.y,
                offsetC.x,
                offsetC.z *
                0.29
            );

        vec3 cloudSwirl =
            swirlA *
            influenceA *
            0.0065;

        cloudSwirl +=
            swirlB *
            influenceB *
            0.0052;

        cloudSwirl +=
            swirlC *
            influenceC *
            0.0046;

        /*
         * ====================================================
         * TEMPORARY COMPRESSION / BREAKUP
         * ====================================================
         *
         * This makes structures appear and then collapse.
         */

        float compression =
            sin(
                x * 0.31 +
                y * 0.27 +
                z * 0.43 +
                uTime * 0.17 +
                phase
            ) *
            cos(
                x * 0.47 -
                y * 0.39 +
                z * 0.33 -
                uTime * 0.21 +
                phase * 1.4
            );

        float breakup =
            sin(
                x * 0.87 -
                y * 0.71 +
                z * 1.13 +
                uTime * 0.29 +
                phase * 1.7
            ) *
            cos(
                y * 0.79 +
                z * 0.88 -
                uTime * 0.24 +
                phase
            );

        vec3 compressionForce =
            vec3(
                compression *
                sin(
                    y * 0.61 +
                    phase
                ),
                compression *
                cos(
                    x * 0.57 -
                    phase
                ),
                compression *
                sin(
                    z * 0.73 +
                    phase
                )
            ) *
            0.0058;

        vec3 breakupForce =
            vec3(
                breakup *
                cos(
                    y * 0.71 +
                    phase
                ),
                breakup *
                sin(
                    x * 0.67 -
                    phase
                ),
                breakup *
                cos(
                    z * 0.83 +
                    phase
                )
            ) *
            0.0034;

        /*
         * ====================================================
         * FINAL GAS FORCE
         * ====================================================
         */

        vec3 gasForce =
            vec3(
                largeA * 0.052 +
                largeB * 0.038 +
                largeC * 0.027 +
                largeD * 0.021 +
                mediumA * 0.026 +
                mediumB * 0.021 +
                mediumC * 0.018 +
                smallA * 0.009 +
                curlX * 0.038,

                largeB * 0.048 +
                largeC * 0.035 +
                largeD * 0.024 +
                largeA * 0.018 +
                mediumB * 0.027 +
                mediumC * 0.020 +
                mediumA * 0.015 +
                smallB * 0.009 +
                curlY * 0.040,

                largeC * 0.029 +
                largeD * 0.021 +
                largeA * 0.014 +
                mediumC * 0.017 +
                mediumA * 0.013 +
                mediumB * 0.010 +
                smallC * 0.008 +
                curlZ * 0.030
            );

        gasForce +=
            gathering;

        gasForce +=
            cloudSwirl;

        gasForce +=
            compressionForce;

        gasForce +=
            breakupForce;

        /*
         * ====================================================
         * INITIAL / CONTINUOUS GAS MOTION
         * ====================================================
         *
         * This is intentionally applied from frame zero.
         *
         * This was missing from the previous file.
         */

        velocity +=
            gasForce *
            0.00105 *
            particleSpeed;

        /*
         * ====================================================
         * GLOBAL VELOCITY DRAG
         * ====================================================
         *
         * Keeps the cloud from accelerating indefinitely while
         * allowing enough inertia for flowing gas.
         */

        velocity *=
            0.9945;

        /*
         * ====================================================
         * FREE PARTICLES
         * ====================================================
         *
         * Free particles remain completely gas-driven.
         */

        if (
            freeParticle >
            0.5
        ) {
            float freePulse =
                sin(
                    phase * 1.71 +
                    uTime * 0.31
                ) *
                0.5 +
                0.5;

            velocity *=
                mix(
                    0.991,
                    0.998,
                    freePulse
                );
        }

        /*
         * ====================================================
         * TEXT FORMATION
         * ====================================================
         */

        if (
            uTextEnabled >
            0.5 &&
            textParticle >
            0.5
        ) {
            vec4 targetSample =
                texture2D(
                    uTextTargetTexture,
                    vUv
                );

            if (
                targetSample.a >
                0.001
            ) {
                vec3 target =
                    targetSample.xyz;

                vec3 toTarget =
                    target -
                    position;

                float distanceToTarget =
                    length(
                        toTarget
                    );

                if (
                    distanceToTarget >
                    0.00001
                ) {
                    vec3 direction =
                        toTarget /
                        distanceToTarget;

                    /*
                     * Formation finishes quickly.
                     */

                    float formation =
                        smoothstep(
                            0.0,
                            1.55,
                            uTime
                        );

                    float formationRemaining =
                        1.0 -
                        formation;

                    /*
                     * Strong direct steering.

                     * This is intentionally not the weak spring
                     * from the previous version.
                     */

                    float steering =
                        mix(
                            0.115,
                            0.018,
                            formation
                        );

                    velocity +=
                        direction *
                        distanceToTarget *
                        steering *
                        uTextStrength;

                    /*
                     * Give the particles enough speed to cross
                     * the field rapidly at the beginning.
                     */

                    velocity +=
                        direction *
                        formationRemaining *
                        0.012 *
                        uTextStrength;

                    /*
                     * Gas remains present during formation,
                     * but becomes progressively less dominant
                     * as the letters become recognizable.
                     */

                    velocity +=
                        gasForce *
                        mix(
                            0.00065,
                            0.00028,
                            formation
                        );

                    /*
                     * Remove only radial overshoot.
                     *
                     * This prevents the duplicate/ghost text
                     * problem without freezing the particles.
                     */

                    float radialVelocity =
                        dot(
                            velocity,
                            direction
                        );

                    float damping =
                        mix(
                            0.68,
                            0.84,
                            formation
                        );

                    velocity -=
                        direction *
                        radialVelocity *
                        damping;

                    /*
                     * As particles get close, use a very small
                     * tangential motion instead of freezing them.
                     */

                    float nearTarget =
                        1.0 -
                        smoothstep(
                            0.025,
                            0.65,
                            distanceToTarget
                        );

                    vec3 tangent =
                        normalize(
                            vec3(
                                sin(
                                    phase *
                                    1.73 +
                                    uTime *
                                    0.27
                                ),
                                cos(
                                    phase *
                                    1.41 -
                                    uTime *
                                    0.23
                                ),
                                sin(
                                    phase *
                                    1.19 +
                                    uTime *
                                    0.19
                                )
                            )
                        );

                    velocity +=
                        tangent *
                        nearTarget *
                        0.00012 *
                        formation;

                    /*
                     * ====================================================
                     * POST-FORMATION ESCAPE
                     * ====================================================
                     */

                    float personality =
                        fract(
                            sin(
                                phase *
                                12.9898 +
                                78.233
                            ) *
                            43758.5453
                        );

                    float cycle =
                        sin(
                            uTime *
                            0.72 +
                            phase *
                            0.37
                        ) *
                        0.5 +
                        0.5;

                    /*
                     * Roughly 18% of text particles are eligible
                     * to periodically leave the letters.
                     */

                    float escapeEligibility =
                        smoothstep(
                            0.68,
                            0.78,
                            personality
                        );

                    float escapePulse =
                        smoothstep(
                            0.73,
                            0.91,
                            cycle
                        ) *
                        (
                            1.0 -
                            smoothstep(
                                0.91,
                                0.98,
                                cycle
                            )
                        );

                    float escape =
                        escapeEligibility *
                        escapePulse *
                        formation;

                    if (
                        escape >
                        0.001
                    ) {
                        vec3 escapeDirection =
                            normalize(
                                vec3(
                                    sin(
                                        phase *
                                        2.41
                                    ),
                                    cos(
                                        phase *
                                        1.87
                                    ),
                                    sin(
                                        phase *
                                        1.43
                                    )
                                )
                            );

                        velocity +=
                            escapeDirection *
                            escape *
                            0.0038;

                        /*
                         * Once escaping, reduce the attraction
                         * to the text.
                         */

                        velocity +=
                            gasForce *
                            escape *
                            0.0015;
                    }
                }
            }
        }

        /*
         * ====================================================
         * VELOCITY LIMIT
         * ====================================================
         *
         * Prevents rare combinations of gathering + turbulence
         * from exploding the simulation.
         */

        float speed =
            length(
                velocity
            );

        float maxSpeed =
            0.026;

        if (
            speed >
            maxSpeed
        ) {
            velocity =
                velocity /
                speed *
                maxSpeed;
        }

        gl_FragColor =
            vec4(
                velocity,
                1.0
            );
    }
`

/*
 * ============================================================
 * POSITION
 * ============================================================
 */

const positionFragmentShader = `
    precision highp float;

    uniform sampler2D uPositionTexture;
    uniform sampler2D uVelocityTexture;

    varying vec2 vUv;

    void main() {
        vec3 position =
            texture2D(
                uPositionTexture,
                vUv
            ).xyz;

        vec3 velocity =
            texture2D(
                uVelocityTexture,
                vUv
            ).xyz;

        position +=
            velocity;

        gl_FragColor =
            vec4(
                position,
                1.0
            );
    }
`

/*
 * ============================================================
 * CONTAINMENT
 * ============================================================
 */

const containmentFragmentShader = `
    precision highp float;

    uniform sampler2D uPositionTexture;
    uniform sampler2D uVelocityTexture;

    varying vec2 vUv;

    void main() {
        vec3 position =
            texture2D(
                uPositionTexture,
                vUv
            ).xyz;

        vec3 velocity =
            texture2D(
                uVelocityTexture,
                vUv
            ).xyz;

        float edgeX =
            abs(
                position.x
            ) /
            10.8;

        float edgeY =
            abs(
                position.y
            ) /
            5.95;

        float edgeZ =
            abs(
                position.z
            ) /
            2.05;

        if (
            edgeX >
            0.80
        ) {
            velocity.x +=
                -sign(
                    position.x
                ) *
                pow(
                    edgeX -
                    0.80,
                    2.0
                ) *
                0.00105;
        }

        if (
            edgeY >
            0.80
        ) {
            velocity.y +=
                -sign(
                    position.y
                ) *
                pow(
                    edgeY -
                    0.80,
                    2.0
                ) *
                0.00088;
        }

        if (
            edgeZ >
            0.78
        ) {
            velocity.z +=
                -sign(
                    position.z
                ) *
                pow(
                    edgeZ -
                    0.78,
                    2.0
                ) *
                0.00042;
        }

        gl_FragColor =
            vec4(
                velocity,
                1.0
            );
    }
`

/*
 * ============================================================
 * INITIALIZATION
 * ============================================================
 */

const initializeFragmentShader = `
    precision highp float;

    uniform sampler2D uInitialTexture;

    varying vec2 vUv;

    void main() {
        gl_FragColor =
            texture2D(
                uInitialTexture,
                vUv
            );
    }
`

const createSimulationQuad = (
    material,
) => {
    const geometry =
        new THREE.PlaneGeometry(
            2,
            2,
        )

    return new THREE.Mesh(
        geometry,
        material,
    )
}

/*
 * ============================================================
 * INITIAL PARTICLE DATA
 * ============================================================
 */

const createParticleData = () => {
    const positions =
        new Float32Array(
            PARTICLE_COUNT *
            3,
        )

    const velocities =
        new Float32Array(
            PARTICLE_COUNT *
            3,
        )

    const intensities =
        new Float32Array(
            PARTICLE_COUNT,
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
        i += 1
    ) {
        const i3 =
            i * 3

        /*
         * Start with a broad gas cloud.
         *
         * It is deliberately uneven rather than a perfect
         * rectangular/random screen-noise distribution.
         */

        const angle =
            Math.random() *
            Math.PI *
            2.0

        const radius =
            Math.pow(
                Math.random(),
                0.72,
            )

        const cloudX =
            Math.cos(
                angle
            ) *
            radius

        const cloudY =
            Math.sin(
                angle
            ) *
            radius

        positions[i3] =
            cloudX *
            (
                8.0 +
                Math.random() *
                2.8
            )

        positions[i3 + 1] =
            cloudY *
            (
                4.0 +
                Math.random() *
                2.2
            )

        positions[i3 + 2] =
            (
                Math.random() -
                0.5
            ) *
            3.7

        /*
         * Give the cloud some initial coherent inertia.
         *
         * This means structures are already moving on frame 1.
         */

        velocities[i3] =
            (
                -cloudY *
                0.0018
            ) +
            (
                Math.random() -
                0.5
            ) *
            0.00065

        velocities[i3 + 1] =
            (
                cloudX *
                0.0018
            ) +
            (
                Math.random() -
                0.5
            ) *
            0.00065

        velocities[i3 + 2] =
            (
                Math.random() -
                0.5
            ) *
            0.00075

        phases[i] =
            Math.random() *
            Math.PI *
            2.0

        speeds[i] =
            0.72 +
            Math.random() *
            0.58

        intensities[i] =
            0.13 +
            Math.pow(
                Math.random(),
                1.75,
            ) *
            0.72

        sizes[i] =
            0.035 +
            Math.pow(
                Math.random(),
                3.0,
            ) *
            0.060
    }

    return {
        positions,
        velocities,
        intensities,
        sizes,
        phases,
        speeds,
    }
}

/*
 * ============================================================
 * FLOAT TEXTURE
 * ============================================================
 */

const createFloatTexture = (
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
 * INITIAL GPU TEXTURES
 * ============================================================
 */

const createInitialTextures = (
    particles,
) => {
    const positionData =
        new Float32Array(
            TEXTURE_CAPACITY *
            4,
        )

    const velocityData =
        new Float32Array(
            TEXTURE_CAPACITY *
            4,
        )

    const metadataData =
        new Float32Array(
            TEXTURE_CAPACITY *
            4,
        )

    for (
        let i = 0;
        i < PARTICLE_COUNT;
        i += 1
    ) {
        const i3 =
            i * 3

        const i4 =
            i * 4

        positionData[i4] =
            particles.positions[i3]

        positionData[i4 + 1] =
            particles.positions[i3 + 1]

        positionData[i4 + 2] =
            particles.positions[i3 + 2]

        positionData[i4 + 3] =
            1.0

        velocityData[i4] =
            particles.velocities[i3]

        velocityData[i4 + 1] =
            particles.velocities[i3 + 1]

        velocityData[i4 + 2] =
            particles.velocities[i3 + 2]

        velocityData[i4 + 3] =
            1.0

        metadataData[i4] =
            particles.phases[i]

        metadataData[i4 + 1] =
            particles.speeds[i]

        /*
         * First 12,000 particles are the ONLY text particles.
         */

        metadataData[i4 + 2] =
            i <
                TEXT_PARTICLE_COUNT
                ? 0.0
                : 1.0

        metadataData[i4 + 3] =
            1.0
    }

    return {
        position:
            createFloatTexture(
                positionData,
            ),

        velocity:
            createFloatTexture(
                velocityData,
            ),

        metadata:
            createFloatTexture(
                metadataData,
            ),
    }
}

/*
 * ============================================================
 * RENDER TARGET
 * ============================================================
 */

const createStateTarget = () => {
    return new THREE.WebGLRenderTarget(
        TEXTURE_SIZE,
        TEXTURE_SIZE,
        {
            minFilter:
                THREE.NearestFilter,

            magFilter:
                THREE.NearestFilter,

            wrapS:
                THREE.ClampToEdgeWrapping,

            wrapT:
                THREE.ClampToEdgeWrapping,

            format:
                THREE.RGBAFormat,

            type:
                THREE.FloatType,

            depthBuffer:
                false,

            stencilBuffer:
                false,

            generateMipmaps:
                false,
        },
    )
}

/*
 * ============================================================
 * PARTICLE SYSTEM
 * ============================================================
 */

const NebulaParticles = ({
    textEnabled = false,
    textTargetTexture = null,
    textStrength = 0.0,
}) => {
    const pointsRef =
        useRef(null)

    const simulationRef =
        useRef(null)

    const {
        gl,
    } = useThree()

    const particles =
        useMemo(
            () =>
                createParticleData(),
            [],
        )

    const initialTextures =
        useMemo(
            () =>
                createInitialTextures(
                    particles,
                ),
            [
                particles,
            ],
        )

    /*
     * --------------------------------------------------------
     * Particle geometry
     * --------------------------------------------------------
     */

    const particleGeometry =
        useMemo(
            () => {
                const geometry =
                    new THREE.BufferGeometry()

                const uvs =
                    new Float32Array(
                        PARTICLE_COUNT *
                        2,
                    )

                const dummyPositions =
                    new Float32Array(
                        PARTICLE_COUNT *
                        3,
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

                    const i2 =
                        i * 2

                    uvs[i2] =
                        (
                            x +
                            0.5
                        ) /
                        TEXTURE_SIZE

                    uvs[i2 + 1] =
                        (
                            y +
                            0.5
                        ) /
                        TEXTURE_SIZE
                }

                geometry.setAttribute(
                    'position',
                    new THREE.BufferAttribute(
                        dummyPositions,
                        3,
                    ),
                )

                geometry.setAttribute(
                    'aParticleUv',
                    new THREE.BufferAttribute(
                        uvs,
                        2,
                    ),
                )

                geometry.setAttribute(
                    'aIntensity',
                    new THREE.BufferAttribute(
                        particles.intensities,
                        1,
                    ),
                )

                geometry.setAttribute(
                    'aSize',
                    new THREE.BufferAttribute(
                        particles.sizes,
                        1,
                    ),
                )

                return geometry
            },
            [
                particles,
            ],
        )

    /*
     * --------------------------------------------------------
     * Particle material
     * --------------------------------------------------------
     */

    const particleMaterial =
        useMemo(
            () =>
                new THREE.ShaderMaterial({
                    vertexShader:
                        particleVertexShader,

                    fragmentShader:
                        particleFragmentShader,

                    uniforms: {
                        uPositionTexture: {
                            value:
                                null,
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

    /*
     * --------------------------------------------------------
     * GPU simulation setup
     * --------------------------------------------------------
     */

    useEffect(
        () => {
            if (
                !gl ||
                !gl.capabilities.isWebGL2
            ) {
                console.error(
                    '[Nebula] WebGL2 is required for GPU simulation.',
                )

                return undefined
            }

            const positionA =
                createStateTarget()

            const positionB =
                createStateTarget()

            const velocityA =
                createStateTarget()

            const velocityB =
                createStateTarget()

            const simulationScene =
                new THREE.Scene()

            const simulationCamera =
                new THREE.OrthographicCamera(
                    -1,
                    1,
                    1,
                    -1,
                    0,
                    1,
                )

            /*
             * Initialization material
             */

            const initializationMaterial =
                new THREE.ShaderMaterial({
                    vertexShader:
                        simulationVertexShader,

                    fragmentShader:
                        initializeFragmentShader,

                    uniforms: {
                        uInitialTexture: {
                            value:
                                null,
                        },
                    },

                    depthTest:
                        false,

                    depthWrite:
                        false,
                })

            const initializationQuad =
                createSimulationQuad(
                    initializationMaterial,
                )

            simulationScene.add(
                initializationQuad,
            )

            const initializeTarget =
                (
                    target,
                    texture,
                ) => {
                    initializationMaterial
                        .uniforms
                        .uInitialTexture
                        .value =
                        texture

                    gl.setRenderTarget(
                        target,
                    )

                    gl.clear()

                    gl.render(
                        simulationScene,
                        simulationCamera,
                    )
                }

            initializeTarget(
                positionA,
                initialTextures.position,
            )

            initializeTarget(
                positionB,
                initialTextures.position,
            )

            initializeTarget(
                velocityA,
                initialTextures.velocity,
            )

            initializeTarget(
                velocityB,
                initialTextures.velocity,
            )

            gl.setRenderTarget(
                null,
            )

            /*
             * Velocity material
             */

            const velocityMaterial =
                new THREE.ShaderMaterial({
                    vertexShader:
                        simulationVertexShader,

                    fragmentShader:
                        velocityFlowFragmentShader,

                    uniforms: {
                        uPositionTexture: {
                            value:
                                null,
                        },

                        uVelocityTexture: {
                            value:
                                null,
                        },

                        uMetadataTexture: {
                            value:
                                initialTextures.metadata,
                        },

                        uTextTargetTexture: {
                            value:
                                initialTextures.position,
                        },

                        uTextEnabled: {
                            value:
                                0,
                        },

                        uTextStrength: {
                            value:
                                0.0,
                        },

                        uTime: {
                            value:
                                0,
                        },
                    },

                    depthTest:
                        false,

                    depthWrite:
                        false,
                })

            /*
             * Position material
             */

            const positionMaterial =
                new THREE.ShaderMaterial({
                    vertexShader:
                        simulationVertexShader,

                    fragmentShader:
                        positionFragmentShader,

                    uniforms: {
                        uPositionTexture: {
                            value:
                                null,
                        },

                        uVelocityTexture: {
                            value:
                                null,
                        },
                    },

                    depthTest:
                        false,

                    depthWrite:
                        false,
                })

            /*
             * Containment material
             */

            const containmentMaterial =
                new THREE.ShaderMaterial({
                    vertexShader:
                        simulationVertexShader,

                    fragmentShader:
                        containmentFragmentShader,

                    uniforms: {
                        uPositionTexture: {
                            value:
                                null,
                        },

                        uVelocityTexture: {
                            value:
                                null,
                        },
                    },

                    depthTest:
                        false,

                    depthWrite:
                        false,
                })

            const simulationQuad =
                createSimulationQuad(
                    velocityMaterial,
                )

            simulationScene.add(
                simulationQuad,
            )

            simulationRef.current = {
                positionA,
                positionB,

                velocityA,
                velocityB,

                velocityMaterial,
                positionMaterial,
                containmentMaterial,

                simulationScene,
                simulationCamera,
                simulationQuad,

                initialized:
                    true,
            }

            particleMaterial
                .uniforms
                .uPositionTexture
                .value =
                positionA.texture

            return () => {
                simulationRef.current =
                    null

                positionA.dispose()
                positionB.dispose()

                velocityA.dispose()
                velocityB.dispose()

                initializationMaterial.dispose()
                velocityMaterial.dispose()
                positionMaterial.dispose()
                containmentMaterial.dispose()

                initializationQuad
                    .geometry
                    .dispose()

                simulationQuad
                    .geometry
                    .dispose()
            }
        },
        [
            gl,
            initialTextures,
            particleMaterial,
        ],
    )

    /*
     * --------------------------------------------------------
     * Simulation loop
     * --------------------------------------------------------
     */

    useFrame(
        (state) => {
            const simulation =
                simulationRef.current

            if (
                !simulation ||
                !simulation.initialized
            ) {
                return
            }

            const {
                positionA,
                positionB,

                velocityA,
                velocityB,

                velocityMaterial,
                positionMaterial,
                containmentMaterial,

                simulationScene,
                simulationCamera,
                simulationQuad,
            } =
                simulation

            /*
             * Velocity pass
             */

            velocityMaterial
                .uniforms
                .uPositionTexture
                .value =
                positionA.texture

            velocityMaterial
                .uniforms
                .uVelocityTexture
                .value =
                velocityA.texture

            velocityMaterial
                .uniforms
                .uTime
                .value =
                state.clock.elapsedTime

            velocityMaterial
                .uniforms
                .uTextTargetTexture
                .value =
                textTargetTexture ||
                initialTextures.position

            velocityMaterial
                .uniforms
                .uTextEnabled
                .value =
                textEnabled
                    ? 1
                    : 0

            velocityMaterial
                .uniforms
                .uTextStrength
                .value =
                textStrength

            simulationQuad.material =
                velocityMaterial

            gl.setRenderTarget(
                velocityB,
            )

            gl.clear()

            gl.render(
                simulationScene,
                simulationCamera,
            )

            /*
             * Position pass
             */

            positionMaterial
                .uniforms
                .uPositionTexture
                .value =
                positionA.texture

            positionMaterial
                .uniforms
                .uVelocityTexture
                .value =
                velocityB.texture

            simulationQuad.material =
                positionMaterial

            gl.setRenderTarget(
                positionB,
            )

            gl.clear()

            gl.render(
                simulationScene,
                simulationCamera,
            )

            /*
             * Containment pass
             */

            containmentMaterial
                .uniforms
                .uPositionTexture
                .value =
                positionB.texture

            containmentMaterial
                .uniforms
                .uVelocityTexture
                .value =
                velocityB.texture

            simulationQuad.material =
                containmentMaterial

            gl.setRenderTarget(
                velocityA,
            )

            gl.clear()

            gl.render(
                simulationScene,
                simulationCamera,
            )

            /*
             * Ping-pong positions.
             *
             * velocityA receives the newly contained velocity,
             * while velocityB remains the previous input.
             */

            simulation.positionA =
                positionB

            simulation.positionB =
                positionA

            particleMaterial
                .uniforms
                .uPositionTexture
                .value =
                positionB.texture

            gl.setRenderTarget(
                null,
            )
        },
        -1,
    )

    /*
     * --------------------------------------------------------
     * Cleanup
     * --------------------------------------------------------
     */

    useEffect(
        () => {
            return () => {
                particleGeometry.dispose()

                particleMaterial.dispose()

                initialTextures
                    .position
                    .dispose()

                initialTextures
                    .velocity
                    .dispose()

                initialTextures
                    .metadata
                    .dispose()
            }
        },
        [
            particleGeometry,
            particleMaterial,
            initialTextures,
        ],
    )

    return (
        <points
            ref={
                pointsRef
            }
            geometry={
                particleGeometry
            }
            material={
                particleMaterial
            }
            frustumCulled={
                false
            }
        />
    )
}

/*
 * ============================================================
 * BACKGROUND
 * ============================================================
 */

const NebulaBackground = ({
    textEnabled = false,
    textTargetTexture = null,
    textStrength = 0.0,
}) => {
    return (
        <Canvas
            orthographic={
                false
            }
            camera={{
                position: [
                    0,
                    0,
                    10,
                ],

                fov:
                    60,
            }}
            dpr={[
                1,
                1.5,
            ]}
            gl={{
                antialias:
                    true,

                alpha:
                    false,

                powerPreference:
                    'high-performance',
            }}
            style={{
                position:
                    'absolute',

                inset:
                    0,

                width:
                    '100%',

                height:
                    '100%',

                pointerEvents:
                    'none',

                background:
                    '#050403',
            }}
        >
            <NebulaParticles
                textEnabled={
                    textEnabled
                }

                textTargetTexture={
                    textTargetTexture
                }

                textStrength={
                    textStrength
                }
            />
        </Canvas>
    )
}

export default NebulaBackground