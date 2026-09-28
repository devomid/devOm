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

    uniform float uRectangleStrength;

    uniform vec2 uWipeCenter;
    uniform vec2 uWipeHalfSize;
    uniform vec2 uWipeDirection;
    uniform float uWipeStrength;

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
         * ------------------------------------------------
         * BUILD TILE / TEXT DISTURBANCE
         * ------------------------------------------------
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
                    0.00320;

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
         * ------------------------------------------------
         * TARGET FORMATION
         * ------------------------------------------------
         *
         * THIS is the important change.
         *
         * The same particle samples both targets.
         *
         * During the cloud phase:
         *
         * TEXT TARGET
         *      |
         *      | GPU interpolation
         *      v
         * CLOUD TARGET
         *
         * There is no JavaScript-side particle mutation.
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
 * ------------------------------------
 * SUBTLE CD-STYLE CLOUD SPIN
 * ------------------------------------
 *
 * Rotate the cloud around the Z axis.
 *
 * This is a face-on rotation:
 *
 *       camera
 *         |
 *         v
 *
 *      [ CLOUD ]
 *          |
 *          Z axis
 *
 * X/Y rotate around Z.
 * Z itself does not rotate.
 *
 * This keeps the cloud's 2D gaseous
 * silhouette visible instead of turning
 * it into a thin 3D edge.
 */

float cloudSpinAngle =
    -uTime *
    0.035 *
    cloudAmount;

float cloudSpinCos =
    cos(
        cloudSpinAngle
    );

float cloudSpinSin =
    sin(
        cloudSpinAngle
    );

vec3 rotatedCloudTarget =
    cloudTargetSample.xyz;

rotatedCloudTarget.xz =
    vec2(
        rotatedCloudTarget.x *
            cloudSpinCos -
        rotatedCloudTarget.z *
            cloudSpinSin,

        rotatedCloudTarget.x *
            cloudSpinSin +
        rotatedCloudTarget.z *
            cloudSpinCos
    );

vec3 target =
    mix(
        textTargetSample.xyz,
        rotatedCloudTarget,
        cloudAmount
    );

/*
 * ------------------------------------
 * MORPH VOLUME RELEASE
 * ------------------------------------
 *
 * During the transition the particles
 * must NOT collapse onto a shallow
 * intermediate surface.
 *
 * The release is strongest in the middle
 * of the morph and disappears completely
 * when the cloud is fully formed.
 *
 * X/Y stay restrained so this does not
 * throw the cloud off-screen.
 *
 * Z receives most of the separation,
 * giving the transition real volume.
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
 * ------------------------------------
 * DYNAMIC CLOUD FORMATION
 * ------------------------------------
 *
 * The cloud target itself continuously
 * breathes, stretches and folds.
 *
 * This makes the cloud FORM and REFORM
 * instead of behaving like a static mask.
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
                     * ------------------------------------
                     * PARTICLE ATTACHMENT
                     * ------------------------------------
                     *
                     * Text keeps its original organic
                     * membership.
                     *
                     * Cloud phase makes attachment nearly
                     * universal so the cloud does not split
                     * into disconnected glyph remnants.
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

                    /*
                     * During cloud formation the variation
                     * is reduced so there are no missing
                     * particle populations.
                     */

                    attachment *=
                        mix(
                            personalVariation,
                            1.0,
                            cloudAmount
                        );

                    /*
                     * ------------------------------------
                     * DISTANCE PARTICIPATION
                     * ------------------------------------
                     */

                    float distanceInfluence =
                        1.0 -
                        smoothstep(
                            4.0,
                            10.0,
                            distanceToTarget
                        );

                    float formationWeight =
                        attachment *
                        (
                            0.84 +
                            distanceInfluence *
                            0.28
                        );

                    /*
                     * ------------------------------------
                     * TARGET SPRING
                     * ------------------------------------
                     */

                    float normalSpringAcceleration =
                        clamp(
                            distanceToTarget *
                            0.00250,
                            0.00028,
                            0.0075
                        );

                    /*
                     * Strong enough to form the cloud,
                     * but not so aggressive that the whole
                     * nebula becomes a heavy solid mass.
                     */

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
                     * ------------------------------------
                     * RADIAL VELOCITY CONTROL
                     * ------------------------------------
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
 * ------------------------------------
 * NEBULA TURBULENCE
 * ------------------------------------
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
 * ------------------------------------
 * LOCAL VORTEX
 * ------------------------------------
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
 * ------------------------------------
 * GLOBAL CLOUD SWIRL
 * ------------------------------------
 *
 * One large rotational field for the
 * entire cloud.
 *
 * This is deliberately stronger than
 * the local vortex so the whole cloud
 * develops a visible circulation.
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
 * ------------------------------------
 * NEBULA INTERNAL TURBULENCE
 * ------------------------------------
 *
 * Stronger than the original cloud swirl.
 * Multiple scales interfere with each
 * other so the cloud never settles.
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
 * ------------------------------------
 * GAS ESCAPE / REJOIN
 * ------------------------------------
 *
 * Particles periodically leave the cloud,
 * travel outward, then get captured again.
 *
 * This creates the gas-like "escape,
 * dissolve, reform" behavior.
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

/*
 * Escape is stronger near the outer
 * regions of the cloud and weaker deep
 * inside it.
 */

float escapeProximity =
    smoothstep(
        0.35,
        2.80,
        distanceToTarget
    );

escapeAmount *=
    escapeProximity;

/*
 * Only a portion of the cloud escapes
 * at any moment.
 */

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

/*
 * Tangential component makes escaping
 * particles curve instead of shooting
 * straight away.
 */

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
 * ------------------------------------
 * GAS REJOIN
 * ------------------------------------
 *
 * Once particles drift away, the target
 * spring pulls them back.
 *
 * This creates continuous:
 *
 * ESCAPE -> DRIFT -> REJOIN -> ESCAPE
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
                     * ------------------------------------
                     * CLOSE-RANGE STABILITY
                     * ------------------------------------
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
            particles.positions[
            i3 + 1
            ]

        positionData[i4 + 2] =
            particles.positions[
            i3 + 2
            ]

        positionData[i4 + 3] =
            1.0

        velocityData[i4] =
            particles.velocities[i3]

        velocityData[i4 + 1] =
            particles.velocities[
            i3 + 1
            ]

        velocityData[i4 + 2] =
            particles.velocities[
            i3 + 2
            ]

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

const CardDepthProxy = ({
    cardRect,
    depthStrength = 0,
}) => {
    const meshRef = useRef(null)

    const { size, camera } = useThree()

    useFrame(() => {
        if (!meshRef.current || !cardRect) return

        const distance = camera.position.z

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
                centerX / size.width -
                0.5
            ) *
            visibleWidth

        const worldY =
            (
                0.5 -
                centerY / size.height
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

        const depthZ =
            THREE.MathUtils.lerp(
                -10,
                0,
                depthStrength,
            )

        meshRef.current.position.set(
            worldX,
            worldY,
            depthZ,
        )

        meshRef.current.scale.set(
            worldWidth,
            worldHeight,
            1,
        )
    })

    const material = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                colorWrite: false,
                depthWrite: true,
                depthTest: true,
            }),
        [],
    )

    return (
        <mesh
            ref={meshRef}
            renderOrder={0}
            material={material}
        >
            <planeGeometry args={[1, 1]} />
        </mesh>
    )
}

const NebulaParticles = ({
    textEnabled = false,
    textTargetTexture = null,
    cloudTargetTexture = null,
    textStrength = 0.0,
    rectangleStrengthRef = null,
    depthStrengthRef = null,
    cardRect
}) => {

    const pointsRef =
        useRef(null)

    const cardMaskRef = useRef(null)

    const simulationRef =
        useRef(null)

    const previousWipeRef =
        useRef(null)

    const {
        gl,
        size,
        camera,
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
        if (!cardRect) return

        const distance = camera.position.z

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
                centerX / size.width -
                0.5
            ) *
            visibleWidth

        const worldY =
            (
                0.5 -
                centerY / size.height
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

        console.log('[DEBUG] card world rect:', {
            x: worldX,
            y: worldY,
            width: worldWidth,
            height: worldHeight,
        })
    }, [
        cardRect,
        camera,
        size,
    ])

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

                    uCloudTargetTexture: {
                        value:
                            initialTextures.position,
                    },

                    uTextEnabled: {
                        value: 0,
                    },

                    uTextStrength: {
                        value: 0.0,
                    },

                    uRectangleStrength: {
                        value: 0.0,
                    },

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

            const cloudAmount =
                rectangleStrengthRef?.current ||
                0.0

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

            velocityMaterial
                .uniforms
                .uRectangleStrength
                .value =
                cloudAmount

            /*
             * ------------------------------------------------
             * BUILD TILE -> WORLD SPACE
             * ------------------------------------------------
             *
             * UNCHANGED.
             *
             * nebulaWipe remains independent from the new
             * text/cloud morph.
             */

            const wipe =
                nebulaWipeState.current

            const wipeUniforms =
                velocityMaterial.uniforms

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

                wipeUniforms
                    .uWipeCenter
                    .value.set(
                        worldCenterX,
                        worldCenterY,
                    )

                wipeUniforms
                    .uWipeHalfSize
                    .value.set(
                        worldHalfWidth,
                        worldHalfHeight,
                    )

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

                    const previousWorldX =
                        (
                            previousCenterX /
                            viewportWidth -
                            0.5
                        ) *
                        worldWidth

                    const previousWorldY =
                        (
                            0.5 -
                            previousCenterY /
                            viewportHeight
                        ) *
                        worldHeight

                    const movementX =
                        worldCenterX -
                        previousWorldX

                    const movementY =
                        worldCenterY -
                        previousWorldY

                    const movementLength =
                        Math.sqrt(
                            movementX *
                            movementX +
                            movementY *
                            movementY,
                        )

                    if (
                        movementLength >
                        0.00001
                    ) {
                        wipeUniforms
                            .uWipeDirection
                            .value.set(
                                movementX /
                                movementLength,

                                movementY /
                                movementLength,
                            )
                    } else {
                        wipeUniforms
                            .uWipeDirection
                            .value.set(
                                0,
                                0,
                            )
                    }
                } else {
                    wipeUniforms
                        .uWipeDirection
                        .value.set(
                            0,
                            0,
                        )
                }

                wipeUniforms
                    .uWipeStrength
                    .value =
                    1.0

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
                wipeUniforms
                    .uWipeStrength
                    .value =
                    0.0

                wipeUniforms
                    .uWipeDirection
                    .value.set(
                        0,
                        0,
                    )

                previousWipeRef.current =
                    null
            }

            /*
             * ------------------------------------------------
             * GPU SIMULATION
             * ------------------------------------------------
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
        <>
            <CardDepthProxy
                cardRect={cardRect}
                depthStrength={
                    depthStrengthRef?.current ?? 0
                }
            />

            <points
                ref={pointsRef}
                geometry={particleGeometry}
                material={particleMaterial}
                frustumCulled={false}
            />
        </>
    )
}

const NebulaBackground = ({
    textEnabled = false,
    textTargetTexture = null,
    cloudTargetTexture = null,
    textStrength = 0.0,
    rectangleStrengthRef = null,
    depthStrengthRef = null,
    cardRect
}) => {
    const canvasRef = useRef(null)
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

                rectangleStrengthRef={
                    rectangleStrengthRef
                }
                depthStrengthRef={
                    depthStrengthRef
                }
                cardRect={cardRect}
            />
        </Canvas>
    )
}

export default NebulaBackground