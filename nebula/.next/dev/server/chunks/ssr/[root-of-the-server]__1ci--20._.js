module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/favicon.ico (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/favicon.2vob68tjqpejf.ico" + (globalThis["NEXT_CLIENT_ASSET_SUFFIX"] || ''));}),
"[project]/app/favicon.ico.mjs { IMAGE => \"[project]/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/app/favicon.ico (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 256,
    height: 256
};
}),
"[project]/app/page.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

useFrame((state)=>{
    const points = pointsRef.current;
    if (!points) return;
    const positions = points.geometry.attributes.position.array;
    const velocities = particles.velocities;
    const time = state.clock.elapsedTime;
    const speed = 0.0009;
    for(let i = 0; i < particles.count; i++){
        const i3 = i * 3;
        const x = positions[i3];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];
        /*
     * Large-scale flowing field.
     *
     * Important:
     * There is NO permanent directional wind.
     * The direction changes depending on position.
     */ const waveA = Math.sin(y * 0.48 + z * 0.35 + time * 0.16);
        const waveB = Math.cos(x * 0.38 - z * 0.55 - time * 0.12);
        const waveC = Math.sin(x * 0.72 + y * 0.42 + time * 0.20);
        /*
     * Large sweeping shear.
     * Different areas move in different directions.
     */ const shearX = Math.sin(y * 0.62 + time * 0.13) * 0.34;
        const shearY = Math.cos(x * 0.48 - time * 0.11) * 0.28;
        /*
     * Local turbulence.
     * Gives the gas smaller-scale irregular motion.
     */ const turbulenceX = Math.sin(y * 1.35 + z * 0.9 + time * 0.31);
        const turbulenceY = Math.cos(x * 1.15 + z * 0.75 - time * 0.27);
        const turbulenceZ = Math.sin(x * 0.9 - y * 0.8 + time * 0.24);
        /*
     * Rotational components are deliberately weak.
     * This prevents the whole thing becoming a disk.
     */ const curlX = Math.sin(y * 0.55 + time * 0.18) * 0.18;
        const curlY = Math.cos(x * 0.50 - time * 0.15) * 0.16;
        /*
     * Final force.
     *
     * Notice that none of these has a permanent
     * positive X/Y direction.
     */ const flowX = waveA * 0.28 + waveB * 0.20 + shearX + turbulenceX * 0.11 + curlX;
        const flowY = waveB * 0.25 + waveC * 0.22 + shearY + turbulenceY * 0.12 + curlY;
        const flowZ = waveA * 0.045 + waveC * 0.035 + turbulenceZ * 0.025;
        velocities[i3] += flowX * speed;
        velocities[i3 + 1] += flowY * speed;
        velocities[i3 + 2] += flowZ * speed;
        /*
     * Stronger damping keeps the field contained
     * without freezing it.
     */ velocities[i3] *= 0.9945;
        velocities[i3 + 1] *= 0.9945;
        velocities[i3 + 2] *= 0.996;
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];
        /*
     * Soft containment.
     *
     * Instead of teleporting particles,
     * gradually push them back when they approach
     * the boundaries.
     */ const edgeX = Math.abs(x) / 10.0;
        const edgeY = Math.abs(y) / 5.0;
        const edgeZ = Math.abs(z) / 2.25;
        if (edgeX > 0.72) {
            velocities[i3] += -Math.sign(x) * Math.pow(edgeX - 0.72, 2) * 0.0009;
        }
        if (edgeY > 0.72) {
            velocities[i3 + 1] += -Math.sign(y) * Math.pow(edgeY - 0.72, 2) * 0.0007;
        }
        if (edgeZ > 0.70) {
            velocities[i3 + 2] += -Math.sign(z) * Math.pow(edgeZ - 0.70, 2) * 0.00045;
        }
    }
    points.geometry.attributes.position.needsUpdate = true;
});
}),
"[project]/app/page.js [app-rsc] (ecmascript, Next.js Server Component)", (function(__turbopack_context__){

__turbopack_context__.n(__turbopack_context__.i("[project]/app/page.js [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1ci--20._.js.map