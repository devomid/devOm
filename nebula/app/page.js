'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo, useRef } from 'react';

const vertexShader = `
  attribute float aIntensity;
  attribute float aSize;

  varying float vIntensity;

  void main() {
    vIntensity = aIntensity;

    vec4 mvPosition =
      modelViewMatrix *
      vec4(position, 1.0);

    float depth =
      max(1.0, -mvPosition.z);

    gl_PointSize =
      aSize * (420.0 / depth);

    gl_Position =
      projectionMatrix *
      mvPosition;
  }
`;

const fragmentShader = `
  varying float vIntensity;

  vec3 getColor(float t) {

    /*
     * Muted warm material palette.
     *
     * Much less yellow/gold than before.
     *
     * Think:
     * smoked bronze
     * aged brass
     * warm stone
     * incandescent ivory
     */

    vec3 dark =
      vec3(
        0.22,
        0.18,
        0.135
      );

    vec3 bronze =
      vec3(
        0.42,
        0.35,
        0.25
      );

    vec3 warm =
      vec3(
        0.66,
        0.56,
        0.40
      );

    vec3 light =
      vec3(
        0.86,
        0.78,
        0.63
      );

    if (t < 0.40) {
      return mix(
        dark,
        bronze,
        smoothstep(
          0.0,
          0.40,
          t
        )
      );
    }

    if (t < 0.78) {
      return mix(
        bronze,
        warm,
        smoothstep(
          0.40,
          0.78,
          t
        )
      );
    }

    return mix(
      warm,
      light,
      smoothstep(
        0.78,
        1.0,
        t
      )
    );
  }

  void main() {

    /*
     * Soft circular particle.
     */
    vec2 uv =
      gl_PointCoord -
      0.5;

    float d =
      length(uv);

    if (d > 0.5) {
      discard;
    }

    /*
     * Feathered edge.
     */
    float edge =
      1.0 -
      smoothstep(
        0.18,
        0.50,
        d
      );

    /*
     * Soft center.
     */
    float core =
      1.0 -
      smoothstep(
        0.0,
        0.43,
        d
      );

    vec3 color =
      getColor(vIntensity);

    float alpha =
      edge *
      (
        0.40 +
        core * 0.45
      );

    gl_FragColor =
      vec4(
        color,
        alpha
      );
  }
`;

function Particles() {
  const pointsRef = useRef();

  const particles = useMemo(() => {
    const count = 50000;

    const positions =
      new Float32Array(
        count * 3
      );

    const velocities =
      new Float32Array(
        count * 3
      );

    const intensities =
      new Float32Array(count);

    const sizes =
      new Float32Array(count);

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const i3 = i * 3;

      /*
       * Wide horizontal gas field.
       *
       * Instead of a spherical cloud,
       * the nebula occupies a broad volume.
       */

      const x =
        (Math.random() - 0.5) *
        17.0;

      const y =
        (Math.random() - 0.5) *
        8.0;

      /*
       * Keep the depth relatively shallow.
       *
       * This dramatically reduces particles
       * flying directly through the camera.
       */
      const z =
        (Math.random() - 0.5) *
        4.0;

      /*
       * Density envelope.
       *
       * We don't make a hard central blob.
       * Instead, the middle is somewhat denser
       * while the edges fade naturally.
       */

      const normalizedX =
        x / 8.5;

      const normalizedY =
        y / 4.0;

      const envelope =
        Math.max(
          0,
          1 -
          Math.sqrt(
            normalizedX *
            normalizedX +
            normalizedY *
            normalizedY
          )
        );

      /*
       * Slightly bias particle density toward
       * the middle without collapsing everything.
       */
      if (
        Math.random() >
        0.32 +
        envelope * 0.68
      ) {
        /*
         * Reposition rejected particles into
         * the broader surrounding field.
         */
        positions[i3] =
          x *
          1.18;

        positions[i3 + 1] =
          y *
          1.10;

        positions[i3 + 2] =
          z;
      } else {
        positions[i3] =
          x;

        positions[i3 + 1] =
          y;

        positions[i3 + 2] =
          z;
      }

      /*
       * Almost entirely lateral initial movement.
       */
      velocities[i3] =
        0.001 +
        Math.random() * 0.0015;

      velocities[i3 + 1] =
        (Math.random() - 0.5) *
        0.0008;

      velocities[i3 + 2] =
        (Math.random() - 0.5) *
        0.00025;

      /*
       * Warm but restrained intensity.
       */
      intensities[i] =
        0.10 +
        Math.pow(
          Math.random(),
          2.1
        ) *
        0.90;

      /*
       * Small soft particles.
       */
      sizes[i] =
        0.025 +
        Math.pow(
          Math.random(),
          3.0
        ) *
        0.075;
    }

    return {
      positions,
      velocities,
      intensities,
      sizes,
      count,
    };
  }, []);

  const geometry = useMemo(() => {
    const geometry =
      new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        particles.positions,
        3
      )
    );

    geometry.setAttribute(
      'aIntensity',
      new THREE.BufferAttribute(
        particles.intensities,
        1
      )
    );

    geometry.setAttribute(
      'aSize',
      new THREE.BufferAttribute(
        particles.sizes,
        1
      )
    );

    return geometry;
  }, [particles]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending:
        THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    const points =
      pointsRef.current;

    if (!points) return;

    const positions =
      points.geometry
        .attributes
        .position
        .array;

    const velocities =
      particles.velocities;

    const time =
      state.clock.elapsedTime;

    /*
     * Gentle simulation speed.
     */
    const speed = 0.00075;

    for (
      let i = 0;
      i < particles.count;
      i++
    ) {
      const i3 = i * 3;

      const x =
        positions[i3];

      const y =
        positions[i3 + 1];

      const z =
        positions[i3 + 2];

      /*
       * ------------------------------------------
       * LONG CONTINUOUS CURRENT
       * ------------------------------------------
       *
       * The whole field has a very slow drift,
       * but different regions drift at different
       * speeds.
       */

      const current =
        Math.sin(
          y * 0.34 +
          z * 0.25 +
          time * 0.10
        );

      /*
       * ------------------------------------------
       * LARGE SHEAR
       * ------------------------------------------
       *
       * Upper and lower regions move differently.
       * This creates gas-like stretching instead
       * of central rotation.
       */

      const shear =
        Math.sin(
          y * 0.55 +
          time * 0.08
        );

      /*
       * ------------------------------------------
       * LATERAL TURBULENCE
       * ------------------------------------------
       */

      const turbulenceX =
        Math.sin(
          y * 1.05 +
          z * 0.70 +
          time * 0.23
        );

      const turbulenceY =
        Math.cos(
          x * 0.72 +
          z * 0.50 -
          time * 0.18
        );

      /*
       * ------------------------------------------
       * SMALL LOCAL MOTION
       * ------------------------------------------
       */

      const localX =
        Math.sin(
          x * 1.30 +
          y * 0.80 +
          time * 0.31
        );

      const localY =
        Math.cos(
          y * 1.25 -
          x * 0.65 -
          time * 0.27
        );

      /*
       * X is the dominant gas direction.
       */
      const flowX =
        0.70 +
        current * 0.24 +
        shear * 0.18 +
        turbulenceX * 0.12 +
        localX * 0.06;

      /*
       * Y creates vertical deformation.
       */
      const flowY =
        shear * 0.30 +
        turbulenceY * 0.20 +
        localY * 0.10;

      /*
       * Z is intentionally tiny.
       *
       * This is the important change that
       * prevents particles constantly crossing
       * directly through the camera.
       */
      const flowZ =
        turbulenceX * 0.025 +
        turbulenceY * 0.018;

      velocities[i3] +=
        flowX * speed;

      velocities[i3 + 1] +=
        flowY * speed;

      velocities[i3 + 2] +=
        flowZ * speed;

      /*
       * Very light damping.
       */
      velocities[i3] *= 0.9987;

      velocities[i3 + 1] *= 0.9987;

      velocities[i3 + 2] *= 0.9975;

      /*
       * Move.
       */
      positions[i3] +=
        velocities[i3];

      positions[i3 + 1] +=
        velocities[i3 + 1];

      positions[i3 + 2] +=
        velocities[i3 + 2];

      /*
       * ------------------------------------------
       * SOFT OUTER LIMIT
       * ------------------------------------------
       *
       * No central attraction.
       *
       * If a particle gets too far away,
       * it gets gently redirected back into
       * the broad field.
       */

      if (positions[i3] > 10.5) {
        velocities[i3] -=
          0.00035;
      }

      if (positions[i3] < -10.5) {
        velocities[i3] +=
          0.00035;
      }

      if (positions[i3 + 1] > 5.2) {
        velocities[i3 + 1] -=
          0.00018;
      }

      if (positions[i3 + 1] < -5.2) {
        velocities[i3 + 1] +=
          0.00018;
      }

      /*
       * Keep the depth within a narrow
       * atmospheric layer.
       */
      if (positions[i3 + 2] > 2.4) {
        velocities[i3 + 2] -=
          0.00012;
      }

      if (positions[i3 + 2] < -2.4) {
        velocities[i3 + 2] +=
          0.00012;
      }
    }

    points.geometry
      .attributes
      .position
      .needsUpdate = true;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
    />
  );
}

export default function Home() {
  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#050403',
      }}
    >
      <Canvas
        camera={{
          position: [0, 0, 10],
          fov: 60,
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
      >
        <Particles />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
        />
      </Canvas>
    </main>
  );
}