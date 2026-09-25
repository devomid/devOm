module.exports = [
"[project]/app/page.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$react$2d$three$2d$fiber$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@react-three/fiber/dist/react-three-fiber.esm.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$9ce18a08$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__F__as__useFrame$3e$__ = __turbopack_context__.i("[project]/node_modules/@react-three/fiber/dist/events-9ce18a08.esm.js [app-ssr] (ecmascript) <export F as useFrame>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$OrbitControls$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-three/drei/core/OrbitControls.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
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
      aSize * (440.0 / depth);

    gl_Position =
      projectionMatrix *
      mvPosition;
  }
`;
const fragmentShader = `
  varying float vIntensity;

  vec3 getColor(float t) {
    vec3 shadow =
      vec3(0.24, 0.22, 0.19);

    vec3 stone =
      vec3(0.41, 0.37, 0.32);

    vec3 copper =
      vec3(0.57, 0.49, 0.40);

    vec3 warm =
      vec3(0.70, 0.61, 0.51);

    vec3 highlight =
      vec3(0.80, 0.73, 0.63);

    if (t < 0.20) {
      return mix(
        shadow,
        stone,
        smoothstep(0.0, 0.20, t)
      );
    }

    if (t < 0.52) {
      return mix(
        stone,
        copper,
        smoothstep(0.20, 0.52, t)
      );
    }

    if (t < 0.82) {
      return mix(
        copper,
        warm,
        smoothstep(0.52, 0.82, t)
      );
    }

    return mix(
      warm,
      highlight,
      smoothstep(0.82, 1.0, t)
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
      getColor(vIntensity);

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
`;
function Particles() {
    const pointsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])();
    const particles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const count = 200000;
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const intensities = new Float32Array(count);
        const sizes = new Float32Array(count);
        const phases = new Float32Array(count);
        const speeds = new Float32Array(count);
        for(let i = 0; i < count; i++){
            const i3 = i * 3;
            const x = (Math.random() - 0.5) * 21.0;
            const y = (Math.random() - 0.5) * 11.5;
            const z = (Math.random() - 0.5) * 3.8;
            /*
       * Broad atmospheric distribution.
       */ // const spread =
            //   0.76 +
            //   Math.pow(
            //     Math.random(),
            //     1.65
            //   ) *
            //   0.24;
            const spread = 0.84 + Math.pow(Math.random(), 2.2) * 0.16;
            positions[i3] = x * spread;
            positions[i3 + 1] = y * spread;
            positions[i3 + 2] = z;
            /*
       * Initial motion.
       */ velocities[i3] = (Math.random() - 0.5) * 0.0015;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.0015;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.00065;
            /*
       * Individual phase.
       */ phases[i] = Math.random() * Math.PI * 2.1;
            /*
       * Small individual speed variation.
       */ speeds[i] = 0.72 + Math.random() * 0.56;
            /*
       * Restrained warm palette.
       */ intensities[i] = 0.13 + Math.pow(Math.random(), 1.8) * 0.70;
            /*
       * Soft atmospheric particles.
       */ sizes[i] = 0.040 + Math.pow(Math.random(), 3) * 0.068;
        }
        // sizes[i] =
        //   0.020 +
        //   Math.pow(
        //     Math.random(),
        //     2.6
        //   ) *
        //   0.055;
        return {
            positions,
            velocities,
            intensities,
            sizes,
            phases,
            speeds,
            count
        };
    }, []);
    const geometry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const geometry = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferGeometry"]();
        geometry.setAttribute('position', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferAttribute"](particles.positions, 3));
        geometry.setAttribute('aIntensity', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferAttribute"](particles.intensities, 1));
        geometry.setAttribute('aSize', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferAttribute"](particles.sizes, 1));
        return geometry;
    }, [
        particles
    ]);
    const material = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ShaderMaterial"]({
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NormalBlending"]
        });
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$9ce18a08$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__F__as__useFrame$3e$__["useFrame"])((state)=>{
        const points = pointsRef.current;
        if (!points) return;
        const positions = points.geometry.attributes.position.array;
        const velocities = particles.velocities;
        const phases = particles.phases;
        const speeds = particles.speeds;
        const time = state.clock.elapsedTime;
        /*
     * Small speed increase.
     *
     * Previous: 0.00115
     * Current:  0.00129
     */ const speed = 0.00220;
        for(let i = 0; i < particles.count; i++){
            const i3 = i * 3;
            const x = positions[i3];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];
            const phase = phases[i];
            const particleSpeed = speeds[i];
            /*
       * ------------------------------------------------
       * LARGE-SCALE CLOUD FLOW
       * ------------------------------------------------
       */ const largeX = Math.sin(y * 0.29 + z * 0.63 + time * 0.075 + phase);
            const largeY = Math.cos(x * 0.25 - z * 0.57 - time * 0.068 + phase * 1.37);
            const largeZ = Math.sin(x * 0.31 + y * 0.28 + time * 0.059 + phase * 0.71);
            /*
       * ------------------------------------------------
       * MEDIUM TURBULENCE
       * ------------------------------------------------
       */ const mediumX = Math.sin(y * 0.78 + z * 1.17 + time * 0.16 + phase * 1.3);
            const mediumY = Math.cos(x * 0.83 - z * 0.91 - time * 0.14 + phase * 0.8);
            const mediumZ = Math.sin(x * 0.68 - y * 0.74 + time * 0.12 + phase * 1.7);
            /*
       * ------------------------------------------------
       * SMALL TURBULENCE
       * ------------------------------------------------
       */ const smallX = Math.sin(y * 1.65 + z * 1.30 + time * 0.24 + phase);
            const smallY = Math.cos(x * 1.48 - z * 1.16 - time * 0.21 + phase * 1.2);
            const smallZ = Math.sin(x * 1.34 + y * 1.21 + time * 0.19 + phase * 0.6);
            /*
       * ------------------------------------------------
       * 3D CURL
       * ------------------------------------------------
       */ const curlX = Math.sin(y * 0.46 + z * 0.82 + time * 0.10 + phase) - Math.cos(z * 0.37 - time * 0.08 + phase * 1.4);
            const curlY = Math.cos(x * 0.43 - z * 0.69 - time * 0.09 + phase) - Math.sin(z * 0.32 + time * 0.07 + phase * 0.8);
            const curlZ = Math.sin(x * 0.39 + y * 0.51 + time * 0.08 + phase * 1.1) - Math.cos(y * 0.34 - time * 0.06 + phase);
            /*
       * ------------------------------------------------
       * TEMPORARY COHERENCE FIELD
       * ------------------------------------------------
       *
       * This is what allows shapes to
       * briefly emerge.
       *
       * But the field itself changes
       * quickly enough that the shape
       * cannot remain stable.
       */ const coherenceA = Math.sin(x * 0.34 + y * 0.27 + z * 0.61 + time * 0.19 + phase);
            const coherenceB = Math.cos(x * 0.51 - y * 0.37 + z * 0.43 - time * 0.23 + phase * 1.4);
            const coherence = coherenceA * coherenceB;
            /*
       * ------------------------------------------------
       * SHAPE FORMATION
       * ------------------------------------------------
       *
       * Local compression can create
       * temporary ribbons / tendrils /
       * clusters.
       */ const shapeX = coherence * Math.sin(y * 0.59 + z * 0.42 + phase) * 0.13;
            const shapeY = coherence * Math.cos(x * 0.53 - z * 0.38 + phase * 1.2) * 0.12;
            const shapeZ = coherence * Math.sin(x * 0.47 + y * 0.64 + phase * 0.8) * 0.055;
            /*
       * ------------------------------------------------
       * SHAPE BREAKER
       * ------------------------------------------------
       *
       * This is the important new piece.
       *
       * A second field moves at a different
       * temporal frequency and actively
       * destroys coherence.
       */ const breakup = Math.sin(x * 0.91 - y * 0.73 + z * 1.17 + time * 0.31 + phase * 1.7) * Math.cos(y * 0.82 + z * 0.91 - time * 0.27 + phase);
            const breakupX = breakup * Math.cos(y * 0.71 + phase) * 0.065;
            const breakupY = breakup * Math.sin(x * 0.67 - phase) * 0.060;
            const breakupZ = breakup * Math.cos(z * 0.94 + phase) * 0.035;
            /*
       * ------------------------------------------------
       * COMBINE
       * ------------------------------------------------
       */ const flowX = largeX * 0.19 + largeY * 0.13 + mediumX * 0.095 + mediumY * 0.07 + smallX * 0.035 + curlX * 0.095 + shapeX + breakupX;
            const flowY = largeY * 0.17 + largeZ * 0.13 + mediumY * 0.095 + mediumZ * 0.07 + smallY * 0.035 + curlY * 0.095 + shapeY + breakupY;
            const flowZ = largeZ * 0.075 + largeX * 0.035 + mediumZ * 0.045 + smallZ * 0.025 + curlZ * 0.075 + shapeZ + breakupZ;
            /*
       * ------------------------------------------------
       * CONTINUOUS MOTION
       * ------------------------------------------------
       */ velocities[i3] += flowX * speed * particleSpeed;
            velocities[i3 + 1] += flowY * speed * particleSpeed;
            velocities[i3 + 2] += flowZ * speed * particleSpeed;
            /*
       * Inertia.
       *
       * Slightly stronger damping on Z
       * keeps the cloud visually broad.
       */ velocities[i3] *= 0.965;
            velocities[i3 + 1] *= 0.965;
            velocities[i3 + 2] *= 0.978;
            /*
       * ------------------------------------------------
       * MOVE
       * ------------------------------------------------
       */ positions[i3] += velocities[i3];
            positions[i3 + 1] += velocities[i3 + 1];
            positions[i3 + 2] += velocities[i3 + 2];
            /*
       * ------------------------------------------------
       * SOFT OUTER CONTAINMENT
       * ------------------------------------------------
       */ const edgeX = Math.abs(positions[i3]) / 10.8;
            const edgeY = Math.abs(positions[i3 + 1]) / 5.95;
            const edgeZ = Math.abs(positions[i3 + 2]) / 2.05;
            if (edgeX > 0.82) {
                velocities[i3] += -Math.sign(positions[i3]) * Math.pow(edgeX - 0.82, 2) * 0.00085;
            }
            if (edgeY > 0.82) {
                velocities[i3 + 1] += -Math.sign(positions[i3 + 1]) * Math.pow(edgeY - 0.82, 2) * 0.00070;
            }
            if (edgeZ > 0.80) {
                velocities[i3 + 2] += -Math.sign(positions[i3 + 2]) * Math.pow(edgeZ - 0.80, 2) * 0.00032;
            }
        }
        points.geometry.attributes.position.needsUpdate = true;
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("points", {
        ref: pointsRef,
        geometry: geometry,
        material: material
    }, void 0, false, {
        fileName: "[project]/app/page.js",
        lineNumber: 792,
        columnNumber: 5
    }, this);
}
function Home() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        style: {
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            background: '#050403'
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$react$2d$three$2d$fiber$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Canvas"], {
            camera: {
                position: [
                    0,
                    0,
                    10
                ],
                fov: 60
            },
            gl: {
                antialias: true,
                alpha: false
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Particles, {}, void 0, false, {
                    fileName: "[project]/app/page.js",
                    lineNumber: 820,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$OrbitControls$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["OrbitControls"], {
                    enablePan: false,
                    enableZoom: false
                }, void 0, false, {
                    fileName: "[project]/app/page.js",
                    lineNumber: 822,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/page.js",
            lineNumber: 810,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/page.js",
        lineNumber: 802,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=app_page_1fazqbf.js.map