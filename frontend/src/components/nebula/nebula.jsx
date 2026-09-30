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

import {
    nebulaWipeState,
} from '../whatibuildComps/nebulaWipe'

const PARTICLE_COUNT = 262144

const TEXTURE_SIZE = 512

const TEXTURE_CAPACITY =
    TEXTURE_SIZE *
    TEXTURE_SIZE

const RING_FORM_DURATION = 1800

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
    varying vec3 vParticlePosition;

    void main() {
        vIntensity = aIntensity;

        vec3 particlePosition =
            texture2D(
                uPositionTexture,
                aParticleUv
            ).xyz;

        vParticlePosition =
            particlePosition;

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
                0.68 +
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
    uniform sampler2D uCloudTargetTexture;

    uniform float uTime;
    uniform float uTextEnabled;
    uniform float uTextStrength;

    uniform vec2 uInteractionCenter;
    uniform float uInteractionStrength;

    uniform float uRectangleStrength;

    uniform float uHomeWindActive;
    uniform float uHomeWindTime;


    /*
     * ========================================================
     * BUILD TILE WIPE / TEXT DISTURBANCE
     *
     * This is the original WhatIBuild behavior.
     *
     * The tile does NOT hide particles.
     * The tile does NOT discard particles.
     *
     * It acts as a soft force field against the particles
     * belonging to the current text target.
     *
     * The normal text spring remains active underneath it,
     * which allows the text to reform naturally after the
     * tile passes.
     * ========================================================
     */

    uniform vec2 uWipeCenter;
    uniform vec2 uWipeHalfSize;
    uniform vec2 uWipeDirection;
    uniform float uWipeStrength;

    varying vec2 vUv;

    /*
     * ========================================================
     * WORK CLOUD ORBIT
     * ========================================================
     */

    const float ORBIT_WIDTH =
        15.9;

    const float ORBIT_HEIGHT =
        6.35;

    const float ORBIT_RADIUS =
        1.25;

    const float ORBIT_DEPTH =
        1.55;

    float orbitPerimeter() {
        float straightWidth =
            ORBIT_WIDTH -
            ORBIT_RADIUS * 2.0;

        float straightHeight =
            ORBIT_HEIGHT -
            ORBIT_RADIUS * 2.0;

        float cornerLength =
            1.57079632679 *
            ORBIT_RADIUS;

        return
            straightWidth * 2.0 +
            straightHeight * 2.0 +
            cornerLength * 4.0;
    }

    vec3 getOrbitPoint(
        float orbitT
    ) {
        float halfWidth =
            ORBIT_WIDTH *
            0.5;

        float halfHeight =
            ORBIT_HEIGHT *
            0.5;

        float straightWidth =
            ORBIT_WIDTH -
            ORBIT_RADIUS * 2.0;

        float straightHeight =
            ORBIT_HEIGHT -
            ORBIT_RADIUS * 2.0;

        float cornerLength =
            1.57079632679 *
            ORBIT_RADIUS;

        float distanceAlong =
            fract(
                orbitT
            ) *
            orbitPerimeter();

        /*
         * TOP
         */
        if (
            distanceAlong <
            straightWidth
        ) {
            float local =
                distanceAlong /
                straightWidth;

            return vec3(
                -halfWidth +
                ORBIT_RADIUS +
                local *
                straightWidth,

                halfHeight,

                0.0
            );
        }

        distanceAlong -=
            straightWidth;

        /*
         * TOP-RIGHT
         */
        if (
            distanceAlong <
            cornerLength
        ) {
            float angle =
                1.57079632679 -
                distanceAlong /
                ORBIT_RADIUS;

            return vec3(
                halfWidth -
                ORBIT_RADIUS +
                cos(angle) *
                ORBIT_RADIUS,

                halfHeight -
                ORBIT_RADIUS +
                sin(angle) *
                ORBIT_RADIUS,

                0.0
            );
        }

        distanceAlong -=
            cornerLength;

        /*
         * RIGHT
         */
        if (
            distanceAlong <
            straightHeight
        ) {
            float local =
                distanceAlong /
                straightHeight;

            return vec3(
                halfWidth,

                halfHeight -
                ORBIT_RADIUS -
                local *
                straightHeight,

                0.0
            );
        }

        distanceAlong -=
            straightHeight;

        /*
         * BOTTOM-RIGHT
         */
        if (
            distanceAlong <
            cornerLength
        ) {
            float angle =
                -distanceAlong /
                ORBIT_RADIUS;

            return vec3(
                halfWidth -
                ORBIT_RADIUS +
                cos(angle) *
                ORBIT_RADIUS,

                -halfHeight +
                ORBIT_RADIUS +
                sin(angle) *
                ORBIT_RADIUS,

                0.0
            );
        }

        distanceAlong -=
            cornerLength;

        /*
         * BOTTOM
         */
        if (
            distanceAlong <
            straightWidth
        ) {
            float local =
                distanceAlong /
                straightWidth;

            return vec3(
                halfWidth -
                ORBIT_RADIUS -
                local *
                straightWidth,

                -halfHeight,

                0.0
            );
        }

        distanceAlong -=
            straightWidth;

        /*
         * BOTTOM-LEFT
         */
        if (
            distanceAlong <
            cornerLength
        ) {
            float angle =
                -1.57079632679 -
                distanceAlong /
                ORBIT_RADIUS;

            return vec3(
                -halfWidth +
                ORBIT_RADIUS +
                cos(angle) *
                ORBIT_RADIUS,

                -halfHeight +
                ORBIT_RADIUS +
                sin(angle) *
                ORBIT_RADIUS,

                0.0
            );
        }

        distanceAlong -=
            cornerLength;

        /*
         * LEFT
         */
        if (
            distanceAlong <
            straightHeight
        ) {
            float local =
                distanceAlong /
                straightHeight;

            return vec3(
                -halfWidth,

                -halfHeight +
                ORBIT_RADIUS +
                local *
                straightHeight,

                0.0
            );
        }

        distanceAlong -=
            straightHeight;

        /*
         * TOP-LEFT
         */
        float angle =
            3.14159265359 -
            distanceAlong /
            ORBIT_RADIUS;

        return vec3(
            -halfWidth +
            ORBIT_RADIUS +
            cos(angle) *
            ORBIT_RADIUS,

            halfHeight -
            ORBIT_RADIUS +
            sin(angle) *
            ORBIT_RADIUS,

            0.0
        );
    }

    vec3 getOrbitTangent(
        float orbitT
    ) {
        float epsilon =
            0.0005;

        vec3 previous =
            getOrbitPoint(
                orbitT -
                epsilon
            );

        vec3 next =
            getOrbitPoint(
                orbitT +
                epsilon
            );

        return normalize(
            next -
            previous
        );
    }

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

        /*
         * ====================================================
         * LARGE-SCALE CLOUD FLOW
         * ====================================================
         */

        float largeX =
            sin(
                position.y * 0.29 +
                position.z * 0.63 +
                uTime * 0.075 +
                phase
            );

        float largeY =
            cos(
                position.x * 0.25 -
                position.z * 0.57 -
                uTime * 0.068 +
                phase * 1.37
            );

        float largeZ =
            sin(
                position.x * 0.31 +
                position.y * 0.28 +
                uTime * 0.059 +
                phase * 0.71
            );

        /*
         * ====================================================
         * MEDIUM TURBULENCE
         * ====================================================
         */

        float mediumX =
            sin(
                position.y * 0.78 +
                position.z * 1.17 +
                uTime * 0.16 +
                phase * 1.3
            );

        float mediumY =
            cos(
                position.x * 0.83 -
                position.z * 0.91 -
                uTime * 0.14 +
                phase * 0.8
            );

        float mediumZ =
            sin(
                position.x * 0.68 -
                position.y * 0.74 +
                uTime * 0.12 +
                phase * 1.7
            );

        /*
         * ====================================================
         * SMALL TURBULENCE
         * ====================================================
         */

        float smallX =
            sin(
                position.y * 1.65 +
                position.z * 1.30 +
                uTime * 0.24 +
                phase
            );

        float smallY =
            cos(
                position.x * 1.48 -
                position.z * 1.16 -
                uTime * 0.21 +
                phase * 1.2
            );

        float smallZ =
            sin(
                position.x * 1.34 +
                position.y * 1.21 +
                uTime * 0.19 +
                phase * 0.6
            );

        /*
         * ====================================================
         * 3D CURL
         * ====================================================
         */

        float curlX =
            sin(
                position.y * 0.46 +
                position.z * 0.82 +
                uTime * 0.10 +
                phase
            ) -
            cos(
                position.z * 0.37 -
                uTime * 0.08 +
                phase * 1.4
            );

        float curlY =
            cos(
                position.x * 0.43 -
                position.z * 0.69 -
                uTime * 0.09 +
                phase
            ) -
            sin(
                position.z * 0.32 +
                uTime * 0.07 +
                phase * 0.8
            );

        float curlZ =
            sin(
                position.x * 0.39 +
                position.y * 0.51 +
                uTime * 0.08 +
                phase * 1.1
            ) -
            cos(
                position.y * 0.34 -
                uTime * 0.06 +
                phase
            );

        /*
         * ====================================================
         * TEMPORARY COHERENCE
         * ====================================================
         */

        float coherenceA =
            sin(
                position.x * 0.34 +
                position.y * 0.27 +
                position.z * 0.61 +
                uTime * 0.19 +
                phase
            );

        float coherenceB =
            cos(
                position.x * 0.51 -
                position.y * 0.37 +
                position.z * 0.43 -
                uTime * 0.23 +
                phase * 1.4
            );

        float coherence =
            coherenceA *
            coherenceB;

        /*
         * ====================================================
         * SHAPE FORMATION
         * ====================================================
         */

        float shapeX =
            coherence *
            sin(
                position.y * 0.59 +
                position.z * 0.42 +
                phase
            ) *
            0.13;

        float shapeY =
            coherence *
            cos(
                position.x * 0.53 -
                position.z * 0.38 +
                phase * 1.2
            ) *
            0.12;

        float shapeZ =
            coherence *
            sin(
                position.x * 0.47 +
                position.y * 0.64 +
                phase * 0.8
            ) *
            0.055;

        /*
         * ====================================================
         * SHAPE BREAKER
         * ====================================================
         */

        float breakup =
            sin(
                position.x * 0.91 -
                position.y * 0.73 +
                position.z * 1.17 +
                uTime * 0.31 +
                phase * 1.7
            ) *
            cos(
                position.y * 0.82 +
                position.z * 0.91 -
                uTime * 0.27 +
                phase
            );

        float breakupX =
            breakup *
            cos(
                position.y * 0.71 +
                phase
            ) *
            0.065;

        float breakupY =
            breakup *
            sin(
                position.x * 0.67 -
                phase
            ) *
            0.060;

        float breakupZ =
            breakup *
            cos(
                position.z * 0.94 +
                phase
            ) *
            0.035;

        /*
         * ====================================================
         * COMBINE
         * ====================================================
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
         * ====================================================
         * ORIGINAL NEBULA MOTION
         * ====================================================
         */

        velocity.x +=
            flowX *
            0.00155 *
            particleSpeed;

        velocity.y +=
            flowY *
            0.00155 *
            particleSpeed;

        velocity.z +=
            flowZ *
            0.00155 *
            particleSpeed;

        velocity.x *= 0.965;
        velocity.y *= 0.965;
        velocity.z *= 0.978;

        /*
         * ====================================================
         * BUILD TILE / TEXT DISTURBANCE
         * ====================================================
         *
         * This is the historical WhatIBuild wipe behavior.
         *
         * It is deliberately NOT a render mask.
         * It does not discard particles.
         *
         * It pushes the particles belonging to the text
         * target away from the moving build tile.
         */

        if (
            uWipeStrength > 0.001 &&
            uTextEnabled > 0.5
        ) {
            vec4 wipeTarget =
                texture2D(
                    uTextTargetTexture,
                    vUv
                );

            if (
                wipeTarget.a >
                0.001
            ) {
                vec2 halfSize =
                    max(
                        uWipeHalfSize,
                        vec2(
                            0.001
                        )
                    );

                vec2 delta =
                    position.xy -
                    uWipeCenter;

                vec2 normalizedDelta =
                    abs(delta) /
                    halfSize;

                float boxDistance =
                    max(
                        normalizedDelta.x,
                        normalizedDelta.y
                    );

                float influence =
                    1.0 -
                    smoothstep(
                        0.45,
                        2.25,
                        boxDistance
                    );

                float core =
                    1.0 -
                    smoothstep(
                        0.38,
                        1.12,
                        boxDistance
                    );

                vec2 radialVector =
                    vec2(
                        delta.x /
                        (
                            halfSize.x *
                            halfSize.x
                        ),

                        delta.y /
                        (
                            halfSize.y *
                            halfSize.y
                        )
                    );

                radialVector +=
                    vec2(
                        cos(phase),
                        sin(phase)
                    ) *
                    0.025;

                radialVector =
                    normalize(
                        radialVector
                    );

                vec2 tangent =
                    vec2(
                        -radialVector.y,
                        radialVector.x
                    );

                vec2 wipeDirection =
                    normalize(
                        uWipeDirection +
                        vec2(
                            0.00001
                        )
                    );

                vec2 disturbance =
                    radialVector *
                    (
                        1.05 +
                        core * 0.85
                    );

                disturbance +=
                    wipeDirection *
                    (
                        0.52 +
                        core * 0.44
                    );

                disturbance +=
                    tangent *
                    (
                        sin(
                            phase * 1.71 +
                            uTime * 0.85
                        ) *
                        0.24
                    );

                float disturbanceStrength =
                    uWipeStrength *
                    influence *
                    (
                        0.92 +
                        core * 0.68
                    );

                velocity.xy +=
                    disturbance *
                    disturbanceStrength *
                    0.00420;

                float depthImpulse =
                    (
                        0.16 +
                        0.10 *
                        sin(
                            phase +
                            uTime * 0.71
                        )
                    ) *
                    disturbanceStrength;

                velocity.z +=
                    depthImpulse *
                    0.00078 *
                    (
                        position.z >= 0.0
                            ? 1.0
                            : -1.0
                    );
            }
        }

        /*
         * ====================================================
         * HOME TEXT WIND
         *
         * Activated only by HomeNebulaText.
         * The text target is disabled at the same moment,
         * so the particles cannot reform while being blown.
         * ====================================================
         */

        if (uHomeWindActive > 0.5) {

/*
             * Main wind direction:
             * strongly toward the right.
             */
            float windTime =
    uHomeWindTime;

// ============================================================
// HOME WIND TIMING
//
// WIND START:
// Immediately when homeWindActive becomes true.
//
// WIND RAMP:
// 0.00 -> 0.22 seconds
//
// WIND END:
// Starts fading at 2.00 seconds.
// Completely stops at 2.50 seconds.
// ============================================================

float windRamp =
    smoothstep(
        0.0,
        0.22,
        windTime
    );

float windEnd =
    1.0 -
    smoothstep(
        4.0,
        4.5,
        windTime
    );


// ============================================================
// WIND A
// Right + slightly upward
// Gentle / slow
// ============================================================

float windSpeedA =
    0.72;

float windForceA =
    0.0016;

vec3 windA =
    vec3(
        1.0,
        0.25,
        0.05
    );

float flowA =
    0.5 +
    0.5 *
    sin(
        position.y * 1.10 +
        phase * 2.10 +
        windTime * windSpeedA
    );


// ============================================================
// WIND B
// Left + upward
// Faster / weaker
// ============================================================

float windSpeedB =
    0.75;

float windForceB =
    0.0030;

vec3 windB =
    vec3(
        -0.55,
        0.75,
        0.10
    );

float flowB =
    0.5 +
    0.5 *
    sin(
        position.x * 0.90 +
        phase * 2.70 +
        windTime * windSpeedB
    );


// ============================================================
// WIND C
// Right + downward
// Slow / weakest
// ============================================================

float windSpeedC =
    0.58;

float windForceC =
    0.0020;

vec3 windC =
    vec3(
        0.30,
        -0.90,
        -0.05
    );

float flowC =
    0.5 +
    0.5 *
    sin(
        position.x * 1.20 +
        position.y * 0.60 +
        phase * 1.80 +
        windTime * windSpeedC
    );


// ============================================================
// WIND D
// Right + slight depth
// Medium speed / medium force
// ============================================================

float windSpeedD =
    0.88;

float windForceD =
    0.0020;

vec3 windD =
    vec3(
        0.75,
        0.05,
        0.20
    );

float flowD =
    0.5 +
    0.5 *
    sin(
        position.z * 1.40 +
        phase * 3.20 +
        windTime * windSpeedD
    );


// ============================================================
// COMBINE FOUR WINDS
// ============================================================

vec3 sceneWind =
    windA *
    flowA *
    windForceA +

    windB *
    flowB *
    windForceB +

    windC *
    flowC *
    windForceC +

    windD *
    flowD *
    windForceD;

velocity +=
    sceneWind *
    particleSpeed *
    windRamp*
    windEnd;
}

        /*
         * ====================================================
         * TARGET FORMATION
         * ====================================================
         */

        if (
            uTextEnabled > 0.5
        ) {
            vec4 textTargetSample =
                texture2D(
                    uTextTargetTexture,
                    vUv
                );

            vec4 cloudTargetSample =
                texture2D(
                    uCloudTargetTexture,
                    vUv
                );

            float cloudAmount =
                smoothstep(
                    0.0,
                    1.0,
                    uRectangleStrength
                );

            /*
             * =================================================
             * PARTICLE ORBIT POSITION
             * =================================================
             */

            float baseOrbitT =
                clamp(
                    (
                        cloudTargetSample.a -
                        0.10
                    ) /
                    0.90,

                    0.0,
                    1.0
                );

            float orbitSpeed =
                0.020 *
                particleSpeed;

            float currentOrbitT =
                fract(
                    baseOrbitT +
                    uTime *
                    orbitSpeed
                );

            vec3 orbitCenter =
                getOrbitPoint(
                    currentOrbitT
                );

            vec3 orbitTangent =
                getOrbitTangent(
                    currentOrbitT
                );

            /*
             * =================================================
             * PRESERVE PARTICLE TUBE OFFSET
             * =================================================
             */

            vec3 baseOrbitCenter =
                getOrbitPoint(
                    baseOrbitT
                );

            vec3 baseOffset =
                cloudTargetSample.xyz -
                baseOrbitCenter;

            vec3 currentOrbitTarget =
                orbitCenter +
                baseOffset;

            /*
             * =================================================
             * DEPTH WAVE
             * =================================================
             */

            currentOrbitTarget.z +=
                sin(
                    currentOrbitT *
                    6.28318530718
                ) *
                ORBIT_DEPTH;

            currentOrbitTarget.z +=
                sin(
                    phase * 1.71 +
                    currentOrbitT * 12.0
                ) *
                0.18;

            vec3 rotatedCloudTarget =
                currentOrbitTarget;

            vec3 target =
                mix(
                    textTargetSample.xyz,
                    rotatedCloudTarget,
                    cloudAmount
                );

            /*
             * =================================================
             * MORPH VOLUME RELEASE
             * =================================================
             */

            float morphRelease =
                4.0 *
                cloudAmount *
                (
                    1.0 -
                    cloudAmount
                );

            vec3 morphVolumeDirection =
                normalize(
                    vec3(
                        sin(
                            phase * 1.91 +
                            uTime * 0.37
                        ),

                        cos(
                            phase * 1.37 -
                            uTime * 0.29
                        ),

                        sin(
                            phase * 0.83 +
                            uTime * 0.21
                        )
                    )
                );

            target +=
                morphVolumeDirection *
                vec3(
                    0.28,
                    0.22,
                    1.15
                ) *
                morphRelease;

            /*
             * =================================================
             * DYNAMIC CLOUD FORMATION
             * =================================================
             */

            float cloudFormA =
                sin(
                    target.y * 0.72 +
                    target.z * 0.41 +
                    uTime * 0.31 +
                    phase * 1.73
                );

            float cloudFormB =
                cos(
                    target.x * 0.64 -
                    target.z * 0.53 -
                    uTime * 0.27 +
                    phase * 1.31
                );

            float cloudFormC =
                sin(
                    target.x * 0.91 +
                    target.y * 0.47 +
                    uTime * 0.19 +
                    phase * 2.17
                );

            float cloudFormD =
                sin(
                    target.x * 1.37 -
                    target.y * 1.12 +
                    target.z * 0.74 +
                    uTime * 0.43 +
                    phase * 3.11
                );

            vec3 cloudDeformation =
                vec3(
                    cloudFormA * 0.0018 +
                    cloudFormD * 0.0010,

                    cloudFormB * 0.0017 +
                    cloudFormD * 0.0008,

                    cloudFormC * 0.0009
                );

            target +=
                cloudDeformation *
                cloudAmount;

            float targetAvailable =
                mix(
                    textTargetSample.a,
                    cloudTargetSample.a,
                    cloudAmount
                );

            if (
                targetAvailable >
                0.001
            ) {
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
                     * =================================================
                     * PARTICLE ATTACHMENT
                     * =================================================
                     */

                    float attachmentWave =
                        sin(
                            phase * 1.73 +
                            uTime * 0.15
                        );

                    float attachmentWave2 =
                        sin(
                            phase * 3.91 -
                            uTime * 0.09
                        );

                    float attachmentNoise =
                        attachmentWave * 0.82 +
                        attachmentWave2 * 0.18;

                    float normalAttachment =
                        smoothstep(
                            -0.45,
                            0.1,
                            attachmentNoise
                        );

                    float attachment =
                        mix(
                            normalAttachment,
                            1.0,
                            cloudAmount
                        );

                    float personalVariation =
                        0.93 +
                        0.07 *
                        sin(
                            phase * 2.37 +
                            1.7
                        );

                    attachment *=
                        mix(
                            personalVariation,
                            1.0,
                            cloudAmount
                        );

                    /*
                     * =================================================
                     * DISTANCE PARTICIPATION
                     * =================================================
                     */

                    float distanceInfluence =
                        1.0 -
                        smoothstep(
                            4.0,
                            10.0,
                            distanceToTarget
                        );

                    float transitionRelease =
                        smoothstep(
                            0.08,
                            0.42,
                            cloudAmount
                        );

                    float transitionReattach =
                        smoothstep(
                            0.48,
                            0.82,
                            cloudAmount
                        );

                    float targetControl =
                        mix(
                            1.0,
                            0.32,
                            transitionRelease
                        );

                    targetControl =
                        max(
                            targetControl,
                            transitionReattach
                        );

                    float formationWeight =
                        attachment *
                        (
                            0.84 +
                            distanceInfluence *
                            0.28
                        ) *
                        targetControl;

                    /*
                     * =================================================
                     * TARGET SPRING
                     * =================================================
                     */

                    float normalSpringAcceleration =
                        clamp(
                            distanceToTarget *
                            0.00250,
                            0.00028,
                            0.0075
                        );

                    float cloudSpringAcceleration =
                        clamp(
                            distanceToTarget *
                            0.00720,
                            0.00085,
                            0.0200
                        );

                    float springAcceleration =
                        mix(
                            normalSpringAcceleration,
                            cloudSpringAcceleration,
                            cloudAmount
                        );

                    velocity +=
                        direction *
                        springAcceleration *
                        uTextStrength *
                        formationWeight;

                    /*
                     * =================================================
                     * BACK -> FRONT WIND
                     * =================================================
                     */

                    float windIn =
                        smoothstep(
                            0.02,
                            0.28,
                            cloudAmount
                        );

                    float windOut =
                        1.0 -
                        smoothstep(
                            0.52,
                            0.82,
                            cloudAmount
                        );

                    float windPulse =
                        windIn *
                        windOut;

                    float windStrength =
                        windPulse *
                        0.00115 *
                        particleSpeed;

                    velocity.z +=
                        windStrength;

                    /*
                     * =================================================
                     * GENTLE CROSS-FLOW
                     * =================================================
                     */

                    float windWaveX =
                        sin(
                            phase * 1.73 +
                            position.y * 0.42 +
                            uTime * 0.38
                        );

                    float windWaveY =
                        cos(
                            phase * 1.31 +
                            position.x * 0.37 -
                            uTime * 0.31
                        );

                    velocity.x +=
                        windWaveX *
                        windStrength *
                        0.28;

                    velocity.y +=
                        windWaveY *
                        windStrength *
                        0.22;

                    /*
                     * =================================================
                     * ORBITAL FLOW
                     * =================================================
                     */

                    float orbitFlowStrength =
                        0.0028 *
                        cloudAmount *
                        particleSpeed *
                        uTextStrength *
                        formationWeight;

                    velocity +=
                        orbitTangent *
                        orbitFlowStrength;

                    /*
                     * =================================================
                     * RADIAL VELOCITY CONTROL
                     * =================================================
                     */

                    float radialVelocity =
                        dot(
                            velocity,
                            direction
                        );

                    float desiredRadialVelocity =
                        clamp(
                            distanceToTarget *
                            0.00064,
                            -0.0010,
                            0.0048
                        );

                    float radialCorrectionStrength =
                        mix(
                            0.080,
                            0.155,
                            cloudAmount
                        );

                    float radialCorrection =
                        (
                            desiredRadialVelocity -
                            radialVelocity
                        ) *
                        radialCorrectionStrength;

                    velocity +=
                        direction *
                        radialCorrection *
                        uTextStrength *
                        formationWeight;

                    /*
                     * =================================================
                     * TANGENTIAL CLOUD FLOW
                     * =================================================
                     */

                    vec3 cloudFlow =
                        vec3(
                            flowX,
                            flowY,
                            flowZ
                        );

                    float flowAlongTarget =
                        dot(
                            cloudFlow,
                            direction
                        );

                    vec3 tangentialFlow =
                        cloudFlow -
                        direction *
                        flowAlongTarget;

                    velocity +=
                        tangentialFlow *
                        0.00230 *
                        cloudAmount *
                        particleSpeed *
                        uTextStrength *
                        formationWeight;

                    /*
                     * =================================================
                     * NEBULA TURBULENCE
                     * =================================================
                     */

                    vec3 localTurbulence;

                    localTurbulence.x =
                        sin(
                            position.y * 1.35 +
                            position.z * 0.82 +
                            uTime * 1.35 +
                            phase * 2.17
                        );

                    localTurbulence.y =
                        cos(
                            position.x * 1.17 -
                            position.z * 1.08 -
                            uTime * 1.18 +
                            phase * 1.73
                        );

                    localTurbulence.z =
                        sin(
                            position.x * 0.91 +
                            position.y * 1.42 +
                            uTime * 1.07 +
                            phase * 2.61
                        );

                    velocity +=
                        localTurbulence *
                        0.00082 *
                        cloudAmount *
                        particleSpeed *
                        uTextStrength *
                        formationWeight;

                    /*
                     * =================================================
                     * LOCAL VORTEX
                     * =================================================
                     */

                    vec3 vortexAxis =
                        normalize(
                            vec3(
                                sin(
                                    target.y * 0.72 +
                                    uTime * 0.41 +
                                    phase
                                ),

                                cos(
                                    target.x * 0.68 -
                                    uTime * 0.37 +
                                    phase * 1.43
                                ),

                                sin(
                                    target.x * 0.51 +
                                    target.y * 0.63 +
                                    uTime * 0.29 +
                                    phase * 0.71
                                )
                            )
                        );

                    vec3 vortexFlow =
                        cross(
                            vortexAxis,
                            direction
                        );

                    velocity +=
                        vortexFlow *
                        0.00068 *
                        cloudAmount *
                        particleSpeed *
                        uTextStrength *
                        formationWeight;

                    /*
                     * =================================================
                     * GLOBAL CLOUD SWIRL
                     * =================================================
                     */

                    vec2 cloudCenterOffset =
                        position.xy;

                    float cloudRadiusLength =
                        length(
                            cloudCenterOffset
                        );

                    vec2 cloudRadial =
                        normalize(
                            cloudCenterOffset +
                            vec2(
                                0.00001
                            )
                        );

                    vec2 cloudTangent =
                        vec2(
                            -cloudRadial.y,
                            cloudRadial.x
                        );

                    float cloudRotationFalloff =
                        smoothstep(
                            0.15,
                            7.5,
                            cloudRadiusLength
                        );

                    float cloudRotationWave =
                        0.72 +
                        0.28 *
                        sin(
                            cloudRadiusLength * 0.72 -
                            uTime * 0.45 +
                            phase * 0.37
                        );

                    velocity.xy +=
                        cloudTangent *
                        0.00125 *
                        cloudRotationFalloff *
                        cloudRotationWave *
                        cloudAmount *
                        particleSpeed *
                        uTextStrength *
                        formationWeight;

                    /*
                     * =================================================
                     * NEBULA INTERNAL TURBULENCE
                     * =================================================
                     */

                    vec3 swirl;

                    swirl.x =
                        sin(
                            target.y * 0.91 +
                            target.z * 0.47 +
                            uTime * 0.73 +
                            phase
                        );

                    swirl.y =
                        cos(
                            target.x * 0.83 -
                            target.z * 0.61 -
                            uTime * 0.67 +
                            phase * 1.31
                        );

                    swirl.z =
                        sin(
                            target.x * 0.57 +
                            target.y * 0.76 +
                            uTime * 0.59 +
                            phase * 0.71
                        );

                    vec3 fineSwirl;

                    fineSwirl.x =
                        sin(
                            target.y * 2.31 +
                            target.x * 1.17 +
                            uTime * 1.21 +
                            phase * 2.17
                        );

                    fineSwirl.y =
                        cos(
                            target.x * 2.07 -
                            target.y * 1.43 -
                            uTime * 1.07 +
                            phase * 1.73
                        );

                    fineSwirl.z =
                        sin(
                            target.x * 1.61 +
                            target.y * 2.19 +
                            uTime * 0.93 +
                            phase * 2.61
                        );

                    velocity +=
                        swirl *
                        0.000018 *
                        cloudAmount *
                        uTextStrength *
                        formationWeight;

                    velocity +=
                        fineSwirl *
                        0.000095 *
                        cloudAmount *
                        uTextStrength *
                        formationWeight;

                    /*
                     * =================================================
                     * GAS ESCAPE / REJOIN
                     * =================================================
                     */

                    float escapeWaveA =
                        sin(
                            phase * 2.17 +
                            uTime * 0.73
                        );

                    float escapeWaveB =
                        sin(
                            phase * 4.71 -
                            uTime * 0.41
                        );

                    float escapeWaveC =
                        cos(
                            phase * 7.13 +
                            uTime * 0.27
                        );

                    float escapeNoise =
                        escapeWaveA * 0.52 +
                        escapeWaveB * 0.31 +
                        escapeWaveC * 0.17;

                    float escapeAmount =
                        smoothstep(
                            0.48,
                            0.91,
                            escapeNoise
                        );

                    float escapeProximity =
                        smoothstep(
                            0.35,
                            2.80,
                            distanceToTarget
                        );

                    escapeAmount *=
                        escapeProximity;

                    escapeAmount *=
                        cloudAmount *
                        0.92;

                    vec3 gasDirection =
                        normalize(
                            vec3(
                                direction.x +
                                sin(
                                    phase * 1.71 +
                                    uTime * 0.83
                                ) *
                                0.78,

                                direction.y +
                                cos(
                                    phase * 2.37 -
                                    uTime * 0.67
                                ) *
                                0.78,

                                direction.z +
                                sin(
                                    phase * 0.93 +
                                    uTime * 0.51
                                ) *
                                0.36
                            )
                        );

                    vec3 gasTangent =
                        cross(
                            direction,
                            gasDirection
                        );

                    velocity +=
                        gasDirection *
                        escapeAmount *
                        0.00058 *
                        uTextStrength *
                        formationWeight;

                    velocity +=
                        gasTangent *
                        escapeAmount *
                        0.00040 *
                        uTextStrength *
                        formationWeight;

                    /*
                     * =================================================
                     * GAS REJOIN
                     * =================================================
                     */

                    float rejoinWave =
                        0.5 +
                        0.5 *
                        sin(
                            phase * 1.37 -
                            uTime * 0.29
                        );

                    float rejoinStrength =
                        smoothstep(
                            1.25,
                            4.20,
                            distanceToTarget
                        );

                    velocity +=
                        direction *
                        rejoinStrength *
                        rejoinWave *
                        0.00034 *
                        cloudAmount *
                        uTextStrength *
                        formationWeight;

                    /*
                     * =================================================
                     * CLOSE-RANGE STABILITY
                     * =================================================
                     */

                    if (
                        distanceToTarget <
                        0.78
                    ) {
                        float closeRadialVelocity =
                            dot(
                                velocity,
                                direction
                            );

                        velocity -=
                            direction *
                            closeRadialVelocity *
                            mix(
                                0.060,
                                0.090,
                                cloudAmount
                            ) *
                            formationWeight;
                    }
                }
            }

            /*
             * =================================================
             * CONTACTS POINTER / TOUCH DISTURBANCE
             * =================================================
             */

            if (
                uInteractionStrength >
                0.0001 &&
                textTargetSample.a >
                0.001
            ) {
                vec2 interactionOffset =
                    position.xy -
                    uInteractionCenter;

                float interactionDistance =
                    length(
                        interactionOffset
                    );

                float interactionInfluence =
                    1.0 -
                    smoothstep(
                        0.0,
                        4.8,
                        interactionDistance
                    );

                vec2 interactionDirection =
                    interactionDistance >
                    0.0001
                        ? normalize(
                            interactionOffset
                        )
                        : vec2(
                            0.0,
                            0.0
                        );

                float push =
                    interactionInfluence *
                    uInteractionStrength;

                velocity.xy +=
                    interactionDirection *
                    push *
                    0.012;

                velocity.z +=
                    push *
                    0.0035;
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

        position +=
            velocity;

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

        if (
            edgeX >
            0.82
        ) {
            velocity.x +=
                -sign(position.x) *
                pow(
                    edgeX - 0.82,
                    2.0
                ) *
                0.00085;
        }

        if (
            edgeY >
            0.82
        ) {
            velocity.y +=
                -sign(position.y) *
                pow(
                    edgeY - 0.82,
                    2.0
                ) *
                0.00070;
        }

        if (
            edgeZ >
            0.80
        ) {
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
            x *
            spread

        positions[i3 + 1] =
            y *
            spread

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
    cloudTargetTexture = null,
    textStrength = 0.0,
    homeWindActive = false,
    rectangleStrengthRef = null,
    cardRect = null,
    interactionRef = null,
    onRingComplete = null,
    ringCompletionDuration = RING_FORM_DURATION,
}) => {
    const pointsRef =
        useRef(null)

    const simulationRef =
        useRef(null)

    const previousWipeRef =
        useRef(null)
    
    const homeWindTimeRef =
        useRef(0)
    
    const homeWindStartTimeRef =
        useRef(null)

    const previousTargetTextureRef =
        useRef(null)

    const ringCompletionTimerRef =
        useRef(null)

    const {
        gl,
        size,
        camera,
    } = useThree()

    /*
     * --------------------------------------------------------
     * PARTICLE DATA
     * --------------------------------------------------------
     */

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

    /*
     * --------------------------------------------------------
     * PARTICLE GEOMETRY
     * --------------------------------------------------------
     */

    const particleGeometry =
        useMemo(
            () => {
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
            [particles],
        )

    /*
     * --------------------------------------------------------
     * PARTICLE MATERIAL
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
                        true,

                    depthTest:
                        true,

                    blending:
                        THREE.NormalBlending,

                    side:
                        THREE.DoubleSide,
                }),
            [],
        )

    /*
     * --------------------------------------------------------
     * CARD WORLD RECT DEBUG
     * --------------------------------------------------------
     */

    useEffect(
        () => {
            if (
                !cardRect
            ) {
                return
            }

            const distance =
                Math.abs(
                    camera.position.z,
                )

            const visibleHeight =
                2 *
                distance *
                Math.tan(
                    THREE.MathUtils.degToRad(
                        camera.fov / 2,
                    ),
                )

            const visibleWidth =
                visibleHeight *
                camera.aspect

            const centerX =
                cardRect.left +
                cardRect.width / 2

            const centerY =
                cardRect.top +
                cardRect.height / 2

            const worldX =
                (
                    centerX /
                    size.width -
                    0.5
                ) *
                visibleWidth

            const worldY =
                (
                    0.5 -
                    centerY /
                    size.height
                ) *
                visibleHeight

            const worldWidth =
                (
                    cardRect.width /
                    size.width
                ) *
                visibleWidth

            const worldHeight =
                (
                    cardRect.height /
                    size.height
                ) *
                visibleHeight

            console.log(
                '[DEBUG] card world rect:',
                {
                    x:
                        worldX,

                    y:
                        worldY,

                    width:
                        worldWidth,

                    height:
                        worldHeight,
                },
            )
        },
        [
            cardRect,
            camera,
            size,
        ],
    )

    /*
     * ========================================================
     * RING FORMATION COMPLETION
     * ========================================================
     */

    useEffect(
        () => {
            if (
                !textTargetTexture
            ) {
                return undefined
            }

            const previousTexture =
                previousTargetTextureRef.current

            if (
                !previousTexture
            ) {
                previousTargetTextureRef.current =
                    textTargetTexture

                return undefined
            }

            if (
                previousTexture ===
                textTargetTexture
            ) {
                return undefined
            }

            previousTargetTextureRef.current =
                textTargetTexture

            if (
                ringCompletionTimerRef.current
            ) {
                window.clearTimeout(
                    ringCompletionTimerRef.current,
                )
            }

            ringCompletionTimerRef.current =
                window.setTimeout(
                    () => {
                        ringCompletionTimerRef.current =
                            null

                        if (
                            onRingComplete
                        ) {
                            onRingComplete()
                        }
                    },
                    Math.max(
                        0,
                        ringCompletionDuration,
                    ),
                )

            return () => {
                if (
                    ringCompletionTimerRef.current
                ) {
                    window.clearTimeout(
                        ringCompletionTimerRef.current,
                    )

                    ringCompletionTimerRef.current =
                        null
                }
            }
        },
        [
            textTargetTexture,
            onRingComplete,
            ringCompletionDuration,
        ],
    )

    /*
     * ========================================================
     * GPU SIMULATION INITIALIZATION
     * ========================================================
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
             * ------------------------------------------------
             * INITIALIZATION MATERIAL
             * ------------------------------------------------
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

            /*
             * ------------------------------------------------
             * VELOCITY MATERIAL
             * ------------------------------------------------
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

                        uHomeWindActive: {
                            value: 0.0,
                        },

                        uHomeWindTime: {
                            value: 0.0,
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

                        uCloudTargetTexture: {
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

                        uRectangleStrength: {
                            value:
                                0.0,
                        },

                        uInteractionCenter: {
                            value:
                                new THREE.Vector2(
                                    0,
                                    0,
                                ),
                        },

                        uInteractionStrength: {
                            value:
                                0.0,
                        },

                        /*
                         * ------------------------------------------------
                         * BUILD TILE WIPE
                         * ------------------------------------------------
                         */

                        uWipeCenter: {
                            value:
                                new THREE.Vector2(
                                    0,
                                    0,
                                ),
                        },

                        uWipeHalfSize: {
                            value:
                                new THREE.Vector2(
                                    0,
                                    0,
                                ),
                        },

                        uWipeDirection: {
                            value:
                                new THREE.Vector2(
                                    0,
                                    0,
                                ),
                        },

                        uWipeStrength: {
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
             * ------------------------------------------------
             * POSITION MATERIAL
             * ------------------------------------------------
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
             * ------------------------------------------------
             * CONTAINMENT MATERIAL
             * ------------------------------------------------
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

            /*
             * ------------------------------------------------
             * SIMULATION QUAD
             * ------------------------------------------------
             */

            const simulationQuad =
                createSimulationQuad(
                    velocityMaterial,
                )

            simulationScene.add(
                simulationQuad,
            )

            /*
             * ------------------------------------------------
             * STORE SIMULATION STATE
             * ------------------------------------------------
             */

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
     * ========================================================
     * GPU SIMULATION FRAME LOOP
     * ========================================================
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
            } = simulation

            /*
             * ------------------------------------------------
             * CLOUD AMOUNT
             * ------------------------------------------------
             */

            const cloudAmount =
                rectangleStrengthRef?.current ??
                0.0

            /*
             * ------------------------------------------------
             * VELOCITY INPUTS
             * ------------------------------------------------
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
                .uCloudTargetTexture
                .value =
                cloudTargetTexture ||
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
            
            if (
                homeWindActive
            ) {
                if (
                    homeWindStartTimeRef.current ===
                    null
                ) {
                    homeWindStartTimeRef.current =
                        state.clock.elapsedTime
                }

                homeWindTimeRef.current =
                    state.clock.elapsedTime -
                    homeWindStartTimeRef.current
            } else {
                homeWindStartTimeRef.current =
                    null

                homeWindTimeRef.current =
                    0
            }

            velocityMaterial
                .uniforms
                .uHomeWindActive
                .value =
                homeWindActive
                    ? 1.0
                    : 0.0

            velocityMaterial
                .uniforms
                .uHomeWindTime
                .value =
                homeWindTimeRef.current

            velocityMaterial
                .uniforms
                .uRectangleStrength
                .value =
                THREE.MathUtils.clamp(
                    cloudAmount,
                    0.0,
                    1.0,
                )

            /*
             * =================================================
             * CONTACTS POINTER / TOUCH -> WORLD SPACE
             * =================================================
             */

            const interaction =
                interactionRef?.current

            if (
                interaction
            ) {
                const viewportWidth =
                    size.width

                const viewportHeight =
                    size.height

                const cameraDistance =
                    Math.abs(
                        camera.position.z,
                    )

                const fovRadians =
                    THREE.MathUtils.degToRad(
                        camera.fov,
                    )

                const worldHeight =
                    2 *
                    cameraDistance *
                    Math.tan(
                        fovRadians /
                        2,
                    )

                const worldWidth =
                    worldHeight *
                    (
                        viewportWidth /
                        viewportHeight
                    )

                const worldInteractionX =
                    (
                        interaction.x /
                        viewportWidth -
                        0.5
                    ) *
                    worldWidth

                const worldInteractionY =
                    (
                        0.5 -
                        interaction.y /
                        viewportHeight
                    ) *
                    worldHeight

                velocityMaterial
                    .uniforms
                    .uInteractionCenter
                    .value.set(
                        worldInteractionX,
                        worldInteractionY,
                    )

                velocityMaterial
                    .uniforms
                    .uInteractionStrength
                    .value =
                    interaction.active
                        ? interaction.strength
                        : 0.0
            } else {
                velocityMaterial
                    .uniforms
                    .uInteractionStrength
                    .value =
                    0.0
            }

            /*
             * =================================================
             * BUILD TILE -> WORLD SPACE WIPE
             *
             * This is the historical WhatIBuild behavior.
             *
             * IMPORTANT:
             *
             * This does NOT modify particle rendering.
             * This does NOT discard particles.
             *
             * It feeds the tile position into the GPU velocity
             * shader as a soft moving force field.
             * =================================================
             */

            const wipe =
                nebulaWipeState.current

            if (
                wipe
            ) {
                const viewportHeight =
                    size.height

                const viewportWidth =
                    size.width

                const cameraDistance =
                    Math.abs(
                        camera.position.z,
                    )

                const fovRadians =
                    THREE.MathUtils.degToRad(
                        camera.fov,
                    )

                const worldHeight =
                    2 *
                    cameraDistance *
                    Math.tan(
                        fovRadians /
                        2,
                    )

                const worldWidth =
                    worldHeight *
                    (
                        viewportWidth /
                        viewportHeight
                    )

                const centerX =
                    wipe.x +
                    wipe.width /
                    2

                const centerY =
                    wipe.y +
                    wipe.height /
                    2

                const worldCenterX =
                    (
                        centerX /
                        viewportWidth -
                        0.5
                    ) *
                    worldWidth

                const worldCenterY =
                    (
                        0.5 -
                        centerY /
                        viewportHeight
                    ) *
                    worldHeight

                const worldHalfWidth =
                    (
                        wipe.width /
                        viewportWidth
                    ) *
                    worldWidth *
                    0.5

                const worldHalfHeight =
                    (
                        wipe.height /
                        viewportHeight
                    ) *
                    worldHeight *
                    0.5

                /*
                 * ------------------------------------------------
                 * WIPE CENTER
                 * ------------------------------------------------
                 */

                velocityMaterial
                    .uniforms
                    .uWipeCenter
                    .value.set(
                        worldCenterX,
                        worldCenterY,
                    )

                /*
                 * ------------------------------------------------
                 * WIPE SIZE
                 * ------------------------------------------------
                 */

                velocityMaterial
                    .uniforms
                    .uWipeHalfSize
                    .value.set(
                        worldHalfWidth,
                        worldHalfHeight,
                    )

                /*
                 * ------------------------------------------------
                 * WIPE MOVEMENT DIRECTION
                 *
                 * Only derive movement from the same tile.
                 * When the active tile changes, we don't invent
                 * a direction from one tile to another.
                 * ------------------------------------------------
                 */

                let wipeDirectionX =
                    0.0

                let wipeDirectionY =
                    0.0

                const previousWipe =
                    previousWipeRef.current

                if (
                    previousWipe &&
                    previousWipe.index ===
                    wipe.index
                ) {
                    const previousCenterX =
                        previousWipe.x +
                        previousWipe.width /
                        2

                    const previousCenterY =
                        previousWipe.y +
                        previousWipe.height /
                        2

                    const previousWorldCenterX =
                        (
                            previousCenterX /
                            viewportWidth -
                            0.5
                        ) *
                        worldWidth

                    const previousWorldCenterY =
                        (
                            0.5 -
                            previousCenterY /
                            viewportHeight
                        ) *
                        worldHeight

                    wipeDirectionX =
                        worldCenterX -
                        previousWorldCenterX

                    wipeDirectionY =
                        worldCenterY -
                        previousWorldCenterY

                    const movementLength =
                        Math.sqrt(
                            wipeDirectionX *
                            wipeDirectionX +
                            wipeDirectionY *
                            wipeDirectionY
                        )

                    if (
                        movementLength >
                        0.00001
                    ) {
                        wipeDirectionX /=
                            movementLength

                        wipeDirectionY /=
                            movementLength
                    } else {
                        wipeDirectionX =
                            0.0

                        wipeDirectionY =
                            0.0
                    }
                }

                velocityMaterial
                    .uniforms
                    .uWipeDirection
                    .value.set(
                        wipeDirectionX,
                        wipeDirectionY,
                    )

                /*
                 * ------------------------------------------------
                 * WIPE STRENGTH
                 * ------------------------------------------------
                 */

                velocityMaterial
                    .uniforms
                    .uWipeStrength
                    .value =
                    1.0

                /*
                 * ------------------------------------------------
                 * STORE CURRENT WIPE
                 * ------------------------------------------------
                 */

                previousWipeRef.current = {
                    index:
                        wipe.index,

                    x:
                        wipe.x,

                    y:
                        wipe.y,

                    width:
                        wipe.width,

                    height:
                        wipe.height,
                }
            } else {
                /*
                 * ------------------------------------------------
                 * NO ACTIVE TILE
                 * ------------------------------------------------
                 */

                velocityMaterial
                    .uniforms
                    .uWipeStrength
                    .value =
                    0.0

                velocityMaterial
                    .uniforms
                    .uWipeDirection
                    .value.set(
                        0,
                        0,
                    )

                previousWipeRef.current =
                    null
            }

            /*
             * =================================================
             * PASS 1
             *
             * positionA + velocityA
             *              |
             *              v
             *         velocityB
             * =================================================
             */

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
             * =================================================
             * PASS 2
             *
             * positionA + velocityB
             *              |
             *              v
             *         positionB
             * =================================================
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
             * =================================================
             * PASS 3
             *
             * positionB + velocityB
             *              |
             *              v
             *         velocityA
             * =================================================
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
             * ------------------------------------------------
             * PING-PONG STATE
             * ------------------------------------------------
             */

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

    /*
     * ========================================================
     * DISPOSAL
     * ========================================================
     */

    useEffect(
        () => {
            return () => {
                if (
                    ringCompletionTimerRef.current
                ) {
                    window.clearTimeout(
                        ringCompletionTimerRef.current,
                    )

                    ringCompletionTimerRef.current =
                        null
                }

                particleGeometry.dispose()

                particleMaterial.dispose()

                initialTextures.position.dispose()
                initialTextures.velocity.dispose()
                initialTextures.metadata.dispose()
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
            ref={pointsRef}
            geometry={particleGeometry}
            material={particleMaterial}
            frustumCulled={false}
            renderOrder={10}
        />
    )
}

const NebulaBackground = ({
    textEnabled = false,
    textTargetTexture = null,
    cloudTargetTexture = null,
    textStrength = 0.0,
    homeWindActive = false,
    rectangleStrengthRef = null,
    cardRect = null,
    interactionRef = null,
    onRingComplete = null,
    ringCompletionDuration = RING_FORM_DURATION,
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
                    true,

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
            }}
        >
            <NebulaParticles
                textEnabled={
                    textEnabled
                }

                textTargetTexture={
                    textTargetTexture
                }

                cloudTargetTexture={
                    cloudTargetTexture
                }

                textStrength={
                    textStrength
                }

                homeWindActive={
                    homeWindActive
                }

                rectangleStrengthRef={
                    rectangleStrengthRef
                }

                cardRect={
                    cardRect
                }

                interactionRef={
                    interactionRef
                }

                onRingComplete={
                    onRingComplete
                }
                ringCompletionDuration={
                    ringCompletionDuration
                }
            />
        </Canvas>
    )
}

export default NebulaBackground