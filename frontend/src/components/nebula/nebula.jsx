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
const TEXTURE_CAPACITY =
    TEXTURE_SIZE * TEXTURE_SIZE

/*
 * ============================================================
 * PARTICLE RENDER SHADERS
 * ============================================================
 */

const particleVertexShader = `
    attribute vec2 aParticleUv;
    attribute float aIntensity;
    attribute float aSize;

    uniform sampler2D uPositionTexture;

    varying float vIntensity;

    void main() {
        vIntensity = aIntensity;

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
            (440.0 / depth);

        gl_Position =
            projectionMatrix *
            mvPosition;
    }
`

const particleFragmentShader = `
    varying float vIntensity;

    vec3 getColor(float t) {
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

        if (t < 0.20) {
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

        if (t < 0.52) {
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

        if (t < 0.82) {
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

        float d =
            length(uv);

        if (d > 0.5) {
            discard;
        }

        float edge =
            1.0 -
            smoothstep(
                0.16,
                0.50,
                d
            );

        float core =
            1.0 -
            smoothstep(
                0.0,
                0.44,
                d
            );

        vec3 color =
            getColor(
                vIntensity
            );

        float alpha =
            edge *
            (
                0.43 +
                core * 0.30
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
 * GPU SIMULATION
 * ============================================================
 */

const simulationVertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;

        gl_Position =
            vec4(
                position.xy,
                0.0,
                1.0
            );
    }
`

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

        float x =
            position.x;

        float y =
            position.y;

        float z =
            position.z;

        /*
         * ------------------------------------------------
         * LARGE-SCALE CLOUD FLOW
         * ------------------------------------------------
         */

        float largeX =
            sin(
                y * 0.29 +
                z * 0.63 +
                uTime * 0.075 +
                phase
            );

        float largeY =
            cos(
                x * 0.25 -
                z * 0.57 -
                uTime * 0.068 +
                phase * 1.37
            );

        float largeZ =
            sin(
                x * 0.31 +
                y * 0.28 +
                uTime * 0.059 +
                phase * 0.71
            );

        /*
         * ------------------------------------------------
         * MEDIUM TURBULENCE
         * ------------------------------------------------
         */

        float mediumX =
            sin(
                y * 0.78 +
                z * 1.17 +
                uTime * 0.16 +
                phase * 1.3
            );

        float mediumY =
            cos(
                x * 0.83 -
                z * 0.91 -
                uTime * 0.14 +
                phase * 0.8
            );

        float mediumZ =
            sin(
                x * 0.68 -
                y * 0.74 +
                uTime * 0.12 +
                phase * 1.7
            );

        /*
         * ------------------------------------------------
         * SMALL TURBULENCE
         * ------------------------------------------------
         */

        float smallX =
            sin(
                y * 1.65 +
                z * 1.30 +
                uTime * 0.24 +
                phase
            );

        float smallY =
            cos(
                x * 1.48 -
                z * 1.16 -
                uTime * 0.21 +
                phase * 1.2
            );

        float smallZ =
            sin(
                x * 1.34 +
                y * 1.21 +
                uTime * 0.19 +
                phase * 0.6
            );

        /*
         * ------------------------------------------------
         * 3D CURL
         * ------------------------------------------------
         */

        float curlX =
            sin(
                y * 0.46 +
                z * 0.82 +
                uTime * 0.10 +
                phase
            ) -
            cos(
                z * 0.37 -
                uTime * 0.08 +
                phase * 1.4
            );

        float curlY =
            cos(
                x * 0.43 -
                z * 0.69 -
                uTime * 0.09 +
                phase
            ) -
            sin(
                z * 0.32 +
                uTime * 0.07 +
                phase * 0.8
            );

        float curlZ =
            sin(
                x * 0.39 +
                y * 0.51 +
                uTime * 0.08 +
                phase * 1.1
            ) -
            cos(
                y * 0.34 -
                uTime * 0.06 +
                phase
            );

        /*
         * ------------------------------------------------
         * TEMPORARY COHERENCE
         * ------------------------------------------------
         */

        float coherenceA =
            sin(
                x * 0.34 +
                y * 0.27 +
                z * 0.61 +
                uTime * 0.19 +
                phase
            );

        float coherenceB =
            cos(
                x * 0.51 -
                y * 0.37 +
                z * 0.43 -
                uTime * 0.23 +
                phase * 1.4
            );

        float coherence =
            coherenceA *
            coherenceB;

        /*
         * ------------------------------------------------
         * SHAPE FORMATION
         * ------------------------------------------------
         */

        float shapeX =
            coherence *
            sin(
                y * 0.59 +
                z * 0.42 +
                phase
            ) *
            0.13;

        float shapeY =
            coherence *
            cos(
                x * 0.53 -
                z * 0.38 +
                phase * 1.2
            ) *
            0.12;

        float shapeZ =
            coherence *
            sin(
                x * 0.47 +
                y * 0.64 +
                phase * 0.8
            ) *
            0.055;

        /*
         * ------------------------------------------------
         * SHAPE BREAKER
         * ------------------------------------------------
         */

        float breakup =
            sin(
                x * 0.91 -
                y * 0.73 +
                z * 1.17 +
                uTime * 0.31 +
                phase * 1.7
            ) *
            cos(
                y * 0.82 +
                z * 0.91 -
                uTime * 0.27 +
                phase
            );

        float breakupX =
            breakup *
            cos(
                y * 0.71 +
                phase
            ) *
            0.065;

        float breakupY =
            breakup *
            sin(
                x * 0.67 -
                phase
            ) *
            0.060;

        float breakupZ =
            breakup *
            cos(
                z * 0.94 +
                phase
            ) *
            0.035;

        /*
         * ------------------------------------------------
         * COMBINE
         * ------------------------------------------------
         */

        float flowX =
            largeX * 0.19 +
            largeY * 0.13 +
            mediumX * 0.095 +
            mediumY * 0.07 +
            smallX * 0.035 +
            curlX * 0.095 +
            shapeX +
            breakupX;

        float flowY =
            largeY * 0.17 +
            largeZ * 0.13 +
            mediumY * 0.095 +
            mediumZ * 0.07 +
            smallY * 0.035 +
            curlY * 0.095 +
            shapeY +
            breakupY;

        float flowZ =
            largeZ * 0.075 +
            largeX * 0.035 +
            mediumZ * 0.045 +
            smallZ * 0.025 +
            curlZ * 0.075 +
            shapeZ +
            breakupZ;

        /*
         * ------------------------------------------------
         * ORIGINAL NEBULA MOTION
         * ------------------------------------------------
         */

        velocity.x +=
            flowX *
            0.00105 *
            particleSpeed;

        velocity.y +=
            flowY *
            0.00105 *
            particleSpeed;

        velocity.z +=
            flowZ *
            0.00105 *
            particleSpeed;

        velocity.x *= 0.965;
        velocity.y *= 0.965;
        velocity.z *= 0.978;

        /*
         * ------------------------------------------------
         * TEXT FORMATION
         * ------------------------------------------------
         *
         * Important:
         *
         * The text particles NEVER become static.
         *
         * We add a spring toward the target while retaining
         * the original Nebula velocity and adding a small
         * moving tangent force around the target.
         *
         * This makes the letters continuously breathe,
         * crawl, break apart and reform.
         * ------------------------------------------------
         */

        if (uTextEnabled > 0.5) {
            vec4 textTarget =
                texture2D(
                    uTextTargetTexture,
                    vUv
                );

            float textWeight =
                textTarget.a;

            if (textWeight > 0.001) {
                vec3 target =
                    textTarget.xyz;

                vec3 toTarget =
                    target -
                    position;

                float distanceToTarget =
                    length(
                        toTarget
                    );

                if (
                    distanceToTarget >
                    0.0001
                ) {
                    vec3 direction =
                        toTarget /
                        distanceToTarget;

                    /*
                     * Strong enough to visibly pull the
                     * existing Nebula into the letters.
                     */
                    float spring =
                        0.00026 +
                        min(
                            distanceToTarget,
                            8.0
                        ) *
                        0.000035;

                    /*
                     * uTextStrength is intentionally used
                     * as a simple multiplier.
                     */
                    velocity +=
                        direction *
                        spring *
                        uTextStrength *
                        textWeight;

                    /*
                     * Moving organic disturbance around
                     * the target.
                     */
                    vec3 swirl;

                    swirl.x =
                        sin(
                            target.y * 0.85 +
                            uTime * 0.70 +
                            phase
                        );

                    swirl.y =
                        cos(
                            target.x * 0.78 -
                            uTime * 0.62 +
                            phase * 1.31
                        );

                    swirl.z =
                        sin(
                            target.x * 0.55 +
                            target.y * 0.43 +
                            uTime * 0.52 +
                            phase * 0.71
                        );

                    /*
                     * Only a subtle amount of swirl is
                     * necessary. The original flow remains
                     * dominant.
                     */
                    velocity +=
                        swirl *
                        0.000035 *
                        uTextStrength *
                        textWeight;

                    /*
                     * Near the target, remove only the
                     * velocity component that points directly
                     * away from the target.
                     *
                     * Tangential movement survives.
                     */
                    float radialVelocity =
                        dot(
                            velocity,
                            direction
                        );

                    if (
                        radialVelocity >
                        0.00055
                    ) {
                        velocity -=
                            direction *
                            (
                                radialVelocity -
                                0.00055
                            ) *
                            0.42 *
                            textWeight;
                    }
                }
            }
        }

        gl_FragColor =
            vec4(
                velocity,
                1.0
            );
    }
`

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

        position += velocity;

        gl_FragColor =
            vec4(
                position,
                1.0
            );
    }
`

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
            abs(position.x) /
            10.8;

        float edgeY =
            abs(position.y) /
            5.95;

        float edgeZ =
            abs(position.z) /
            2.05;

        if (edgeX > 0.82) {
            velocity.x +=
                -sign(position.x) *
                pow(
                    edgeX - 0.82,
                    2.0
                ) *
                0.00085;
        }

        if (edgeY > 0.82) {
            velocity.y +=
                -sign(position.y) *
                pow(
                    edgeY - 0.82,
                    2.0
                ) *
                0.00070;
        }

        if (edgeZ > 0.80) {
            velocity.z +=
                -sign(position.z) *
                pow(
                    edgeZ - 0.80,
                    2.0
                ) *
                0.00032;
        }

        gl_FragColor =
            vec4(
                velocity,
                1.0
            );
    }
`

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

const createParticleData = () => {
    const positions =
        new Float32Array(
            PARTICLE_COUNT * 3,
        )

    const velocities =
        new Float32Array(
            PARTICLE_COUNT * 3,
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

        const x =
            (
                Math.random() -
                0.5
            ) *
            21.0

        const y =
            (
                Math.random() -
                0.5
            ) *
            11.5

        const z =
            (
                Math.random() -
                0.5
            ) *
            3.8

        const spread =
            0.84 +
            Math.pow(
                Math.random(),
                2.2,
            ) *
            0.16

        positions[i3] =
            x * spread

        positions[i3 + 1] =
            y * spread

        positions[i3 + 2] =
            z

        velocities[i3] =
            (
                Math.random() -
                0.5
            ) *
            0.0015

        velocities[i3 + 1] =
            (
                Math.random() -
                0.5
            ) *
            0.0015

        velocities[i3 + 2] =
            (
                Math.random() -
                0.5
            ) *
            0.00065

        phases[i] =
            Math.random() *
            Math.PI *
            2.1

        speeds[i] =
            0.72 +
            Math.random() *
            0.56

        intensities[i] =
            0.13 +
            Math.pow(
                Math.random(),
                1.8,
            ) *
            0.70

        sizes[i] =
            0.040 +
            Math.pow(
                Math.random(),
                3,
            ) *
            0.068
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

const createInitialTextures = (
    particles,
) => {
    const positionData =
        new Float32Array(
            TEXTURE_CAPACITY * 4,
        )

    const velocityData =
        new Float32Array(
            TEXTURE_CAPACITY * 4,
        )

    const metadataData =
        new Float32Array(
            TEXTURE_CAPACITY * 4,
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

        metadataData[i4 + 2] =
            1.0

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
            [particles],
        )

    const particleGeometry =
        useMemo(() => {
            const geometry =
                new THREE.BufferGeometry()

            const uvs =
                new Float32Array(
                    PARTICLE_COUNT * 2,
                )

            const dummyPositions =
                new Float32Array(
                    PARTICLE_COUNT * 3,
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
                        x + 0.5
                    ) /
                    TEXTURE_SIZE

                uvs[i2 + 1] =
                    (
                        y + 0.5
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
        }, [particles])

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
                            value: null,
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

        const initializationMaterial =
            new THREE.ShaderMaterial({
                vertexShader:
                    simulationVertexShader,

                fragmentShader:
                    initializeFragmentShader,

                uniforms: {
                    uInitialTexture: {
                        value: null,
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

        const initializeTarget = (
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

        const velocityMaterial =
            new THREE.ShaderMaterial({
                vertexShader:
                    simulationVertexShader,

                fragmentShader:
                    velocityFlowFragmentShader,

                uniforms: {
                    uPositionTexture: {
                        value: null,
                    },

                    uVelocityTexture: {
                        value: null,
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
                        value: 0,
                    },

                    uTextStrength: {
                        value: 0.0,
                    },

                    uTime: {
                        value: 0,
                    },
                },

                depthTest:
                    false,

                depthWrite:
                    false,
            })

        const positionMaterial =
            new THREE.ShaderMaterial({
                vertexShader:
                    simulationVertexShader,

                fragmentShader:
                    positionFragmentShader,

                uniforms: {
                    uPositionTexture: {
                        value: null,
                    },

                    uVelocityTexture: {
                        value: null,
                    },
                },

                depthTest:
                    false,

                depthWrite:
                    false,
            })

        const containmentMaterial =
            new THREE.ShaderMaterial({
                vertexShader:
                    simulationVertexShader,

                fragmentShader:
                    containmentFragmentShader,

                uniforms: {
                    uPositionTexture: {
                        value: null,
                    },

                    uVelocityTexture: {
                        value: null,
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

            initialized: true,
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
    }, [
        gl,
        initialTextures,
        particleMaterial,
    ])

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
            } = simulation

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

            simulation.positionA =
                positionB

            simulation.positionB =
                positionA

            simulation.velocityA =
                velocityA

            simulation.velocityB =
                velocityB

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

    useEffect(() => {
        return () => {
            particleGeometry.dispose()
            particleMaterial.dispose()

            initialTextures.position.dispose()
            initialTextures.velocity.dispose()
            initialTextures.metadata.dispose()
        }
    }, [
        particleGeometry,
        particleMaterial,
        initialTextures,
    ])

    return (
        <points
            ref={pointsRef}
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

const NebulaBackground = ({
    textEnabled = false,
    textTargetTexture = null,
    textStrength = 0.0,
}) => {
    return (
        <Canvas
            orthographic={false}
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
                antialias: true,
                alpha: false,
                powerPreference:
                    'high-performance',
            }}
            style={{
                position:
                    'absolute',

                inset: 0,

                width: '100%',
                height: '100%',

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