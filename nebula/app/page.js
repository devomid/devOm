'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo, useRef } from 'react';

function Particles() {
  const pointsRef = useRef();

  const particles = useMemo(() => {
    const count = 8000;

    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * 14;
      positions[i3 + 1] = (Math.random() - 0.5) * 9;
      positions[i3 + 2] = (Math.random() - 0.5) * 8;
    }

    return {
      positions,
      velocities,
      count,
    };
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;

    if (!points) return;

    const positions =
      points.geometry.attributes.position.array;

    const velocities = particles.velocities;

    const time = state.clock.elapsedTime;

    for (let i = 0; i < particles.count; i++) {
      const i3 = i * 3;

      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];

      /*
       * Multiple overlapping waves create
       * a continuous, organic flow field.
       */

      const wave1 =
        Math.sin(y * 0.65 + time * 0.18);

      const wave2 =
        Math.sin(z * 0.55 - time * 0.13);

      const wave3 =
        Math.cos(x * 0.45 + y * 0.3 + time * 0.11);

      const wave4 =
        Math.sin(
          x * 0.22 -
          z * 0.35 +
          time * 0.09
        );

      /*
       * Combine the fields.
       */

      const flowX =
        wave1 * 0.7 +
        wave2 * 0.35 +
        wave4 * 0.25;

      const flowY =
        wave2 * 0.45 -
        wave3 * 0.55;

      const flowZ =
        wave3 * 0.5 +
        wave1 * 0.25;

      /*
       * Add a gentle rotational component
       * around the center.
       */

      const radius = Math.sqrt(x * x + y * y) + 0.001;

      const swirlX = -y / radius;
      const swirlY = x / radius;

      velocities[i3] +=
        (flowX + swirlX * 0.35) * 0.00045;

      velocities[i3 + 1] +=
        (flowY + swirlY * 0.35) * 0.00045;

      velocities[i3 + 2] +=
        flowZ * 0.00035;

      /*
       * Damping.
       */

      velocities[i3] *= 0.992;
      velocities[i3 + 1] *= 0.992;
      velocities[i3 + 2] *= 0.992;

      /*
       * Move.
       */

      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];

      /*
       * Softly pull particles back toward
       * the larger field instead of teleporting
       * them at a visible boundary.
       */

      const distance =
        Math.sqrt(
          x * x +
          y * y +
          z * z
        );

      if (distance > 9) {
        const pull = (distance - 9) * 0.0008;

        velocities[i3] -= x * pull;
        velocities[i3 + 1] -= y * pull;
        velocities[i3 + 2] -= z * pull;
      }
    }

    points.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        size={0.022}
        color="white"
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
}

export default function Home() {
  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
      }}
    >
      <Canvas
        camera={{
          position: [0, 0, 8],
          fov: 60,
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