import {
    useMemo,
    useRef,
} from 'react'
import * as THREE from 'three'
import {
    Canvas,
    useFrame,
} from '@react-three/fiber'

const PARTICLE_COUNT = 100000

const vertexShader = `
    attribute float aSize;
    attribute float aIntensity;

    varying float vIntensity;

    void main() {
        vec4 mvPosition =
            modelViewMatrix *
            vec4(position, 1.0);

        gl_PointSize =
            aSize *
            (180.0 / -mvPosition.z);

        gl_Position =
            projectionMatrix *
            mvPosition;

        vIntensity =
            aIntensity;
    }
`

const fragmentShader = `
    varying float vIntensity;

    void main() {
        vec2 point =
            gl_PointCoord - 0.5;

        float distance =
            length(point);

        if (distance > 0.5) {
            discard;
        }

        float alpha =
            1.0 -
            smoothstep(
                0.15,
                0.5,
                distance
            );

        vec3 dark =
            vec3(
                0.28,
                0.25,
                0.21
            );

        vec3 copper =
            vec3(
                0.68,
                0.55,
                0.43
            );

        vec3 bright =
            vec3(
                0.86,
                0.76,
                0.64
            );

        vec3 color =
            mix(
                dark,
                copper,
                vIntensity
            );

        color =
            mix(
                color,
                bright,
                smoothstep(
                    0.65,
                    1.0,
                    vIntensity
                )
            );

        gl_FragColor =
            vec4(
                color,
                alpha *
                (
                    0.35 +
                    vIntensity *
                    0.65
                )
            );
    }
`

const NebulaParticles = ({
    scrollState,
}) => {
    const pointsRef =
        useRef(null)

    const geometry =
        useMemo(() => {
            const positions =
                new Float32Array(
                    PARTICLE_COUNT * 3,
                )

            const sizes =
                new Float32Array(
                    PARTICLE_COUNT,
                )

            const intensities =
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
                 * Broad cloud.
                 *
                 * No central blob.
                 * No disk.
                 */
                positions[i3] =
                    (
                        Math.random() -
                        0.5
                    ) *
                    21

                positions[i3 + 1] =
                    (
                        Math.random() -
                        0.5
                    ) *
                    11.5

                positions[i3 + 2] =
                    (
                        Math.random() -
                        0.5
                    ) *
                    3.8

                sizes[i] =
                    0.020 +
                    Math.pow(
                        Math.random(),
                        2.6,
                    ) *
                    0.055

                intensities[i] =
                    0.15 +
                    Math.random() *
                    0.85
            }

            const nextGeometry =
                new THREE.BufferGeometry()

            nextGeometry.setAttribute(
                'position',
                new THREE.BufferAttribute(
                    positions,
                    3,
                ),
            )

            nextGeometry.setAttribute(
                'aSize',
                new THREE.BufferAttribute(
                    sizes,
                    1,
                ),
            )

            nextGeometry.setAttribute(
                'aIntensity',
                new THREE.BufferAttribute(
                    intensities,
                    1,
                ),
            )

            return nextGeometry
        }, [])

    const material =
        useMemo(
            () =>
                new THREE.ShaderMaterial({
                    vertexShader,
                    fragmentShader,

                    transparent: true,

                    depthWrite: false,

                    blending:
                        THREE.NormalBlending,
                }),
            [],
        )

    useFrame(
        ({
            clock,
        }) => {
            const points =
                pointsRef.current

            if (!points) {
                return
            }

            const position =
                geometry.attributes
                    .position.array

            const time =
                clock.getElapsedTime()

            const state =
                scrollState?.current

            const progress =
                state?.progress ?? 0

            const velocity =
                state?.velocity ?? 0

            const scrollEnergy =
                Math.min(
                    1,
                    Math.abs(
                        velocity,
                    ) * 220,
                )

            for (
                let i = 0;
                i < PARTICLE_COUNT;
                i += 1
            ) {
                const i3 =
                    i * 3

                const x =
                    position[i3]

                const y =
                    position[i3 + 1]

                const z =
                    position[i3 + 2]

                const phase =
                    i * 0.00017

                /*
                 * Continuous organic movement.
                 */
                const flowX =
                    Math.sin(
                        y * 0.55 +
                        time * 0.18 +
                        phase,
                    ) *
                    0.0012

                const flowY =
                    Math.cos(
                        x * 0.42 +
                        time * 0.15 +
                        phase * 1.7,
                    ) *
                    0.0012

                const flowZ =
                    Math.sin(
                        x * 0.31 +
                        y * 0.23 +
                        time * 0.12,
                    ) *
                    0.0005

                /*
                 * Scroll adds energy without
                 * changing your chosen speed.
                 */
                const agitation =
                    scrollEnergy *
                    (
                        1 +
                        Math.sin(
                            phase * 9 +
                            time * 2,
                        ) *
                        0.5
                    )

                position[i3] =
                    x +
                    flowX *
                    (
                        1 +
                        agitation * 2
                    )

                position[i3 + 1] =
                    y +
                    flowY *
                    (
                        1 +
                        agitation * 2
                    )

                position[i3 + 2] =
                    z +
                    flowZ *
                    (
                        1 +
                        agitation
                    )

                /*
                 * Very soft containment.
                 */
                if (
                    position[i3] >
                    10.5
                ) {
                    position[i3] =
                        -10.5
                }

                if (
                    position[i3] <
                    -10.5
                ) {
                    position[i3] =
                        10.5
                }

                if (
                    position[i3 + 1] >
                    5.75
                ) {
                    position[i3 + 1] =
                        -5.75
                }

                if (
                    position[i3 + 1] <
                    -5.75
                ) {
                    position[i3 + 1] =
                        5.75
                }
            }

            geometry.attributes.position.needsUpdate =
                true
        },
    )

    return (
        <points
            ref={pointsRef}
            geometry={geometry}
            frustumCulled={false}
        >
            <primitive
                object={material}
                attach="material"
            />
        </points>
    )
}

const NebulaBackground = ({
    scrollState,
}) => {
    return (
        <Canvas
            orthographic={false}
            camera={{
                position: [
                    0,
                    0,
                    14,
                ],
                fov: 50,
                near: 0.1,
                far: 100,
            }}
            dpr={[1, 1.5]}
            gl={{
                alpha: true,
                antialias: false,
                powerPreference:
                    'high-performance',
            }}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
            }}
        >
            <NebulaParticles
                scrollState={
                    scrollState
                }
            />
        </Canvas>
    )
}

export default NebulaBackground